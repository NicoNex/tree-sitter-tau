// The grammar of tau, following internal/lexer and internal/parser of the
// language itself: the precedence classes below are the ones of parser.go, in
// the same order, so that the two can be read side by side.
//
// Nearly everything in tau is an expression, assignment and control flow
// included, which is why there are so few statement rules here: a file is a
// list of expressions, and a block is a list of expressions between braces.

const PREC = {
  assignment: 1,
  logical_or: 2,
  logical_and: 3,
  bitwise_or: 4,
  bitwise_xor: 5,
  bitwise_and: 6,
  equality: 7,
  relational: 8,
  shift: 9,
  additive: 10,
  multiplicative: 11,
  unary: 12,
  call: 13,
  index: 14,
  member: 15,
};

module.exports = grammar({
  name: 'tau',

  extras: $ => [
    /\s/,
    $.comment,
  ],

  // A brace opens a block in one place and a map in another, and which one it
  // is only becomes clear further in.
  conflicts: $ => [
    [$.block, $.map],
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat($._statement),

    _statement: $ => seq($._expression, optional(choice(';', '\n'))),

    comment: $ => token(seq('#', /.*/)),

    _expression: $ => choice(
      $.identifier,
      $.integer,
      $.float,
      $.string,
      $.escaped_string,
      $.raw_string,
      $.boolean,
      $.null,
      $.function,
      $.call,
      $.import,
      $.tau_call,
      $.assignment,
      $.binary_expression,
      $.unary_expression,
      $.update_expression,
      $.index,
      $.member,
      $.parenthesized_expression,
      $.list,
      $.map,
      $.if,
      $.for,
      $.return,
      $.break,
      $.continue,
    ),

    // Literals

    identifier: $ => /[a-zA-Z_][a-zA-Z_0-9]*/,

    // The bases the lexer accepts, with underscores allowed inside any of
    // them: 0644, 0x1f, 0b1010, 1_000_000.
    integer: $ => token(choice(
      seq(/0[xX]/, /[0-9a-fA-F_]+/),
      seq(/0[bB]/, /[01_]+/),
      seq(/0[oO]/, /[0-7_]+/),
      /[0-9][0-9_]*/,
    )),

    float: $ => token(choice(
      seq(/[0-9][0-9_]*/, '.', /[0-9_]*/, optional(/[eE][+-]?[0-9]+/)),
      seq(/[0-9][0-9_]*/, /[eE][+-]?[0-9]+/),
    )),

    boolean: $ => choice('true', 'false'),

    null: $ => 'null',

    // A string holds expressions between braces, which is how tau builds its
    // messages: "got {n} of them".
    string: $ => seq(
      '"',
      repeat(choice(
        $.escape_sequence,
        $.interpolation,
        token.immediate(prec(1, /[^"\\{]+/)),
      )),
      '"',
    ),

    // Backticks, where nothing is escaped and nothing is interpolated.
    raw_string: $ => seq('`', repeat(token.immediate(/[^`]+/)), '`'),

    escape_sequence: $ => token.immediate(seq('\\', /./)),

    // A string inside an interpolation, where the quotes around it belong to
    // the string it sits in and are written escaped:
    // "{r.Query[\"a\"]}".
    escaped_string: $ => token(seq(
      '\\"',
      repeat(choice(/[^"\\]/, seq('\\', /[^"]/))),
      '\\"',
    )),

    interpolation: $ => seq('{', optional($._expression), '}'),

    // Functions

    function: $ => seq(
      'fn',
      '(',
      optional($.parameters),
      ')',
      field('body', $.block),
    ),

    parameters: $ => seq(
      $.identifier,
      repeat(seq(',', $.identifier)),
      optional(','),
    ),

    block: $ => seq('{', repeat($._statement), '}'),

    // Calls

    call: $ => prec(PREC.call, seq(
      field('function', $._expression),
      '(',
      optional($.arguments),
      ')',
    )),

    arguments: $ => seq(
      $._expression,
      repeat(seq(',', $._expression)),
      optional(','),
    ),

    // import is a keyword and not a function, so that a module can be found
    // before the program runs.
    import: $ => prec(PREC.call, seq('import', '(', $._expression, ')')),

    // tau runs what follows in a routine of its own, the way go does.
    tau_call: $ => prec.right(seq('tau', $._expression)),

    // Assignment is an expression: the value it stores is the value it gives
    // back, which is what makes `if failed(x = f())` read the way it looks.
    assignment: $ => prec.right(PREC.assignment, seq(
      field('left', $._expression),
      field('operator', choice(
        '=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=',
      )),
      field('right', $._expression),
    )),

    binary_expression: $ => {
      const operators = [
        ['||', PREC.logical_or],
        ['&&', PREC.logical_and],
        ['|', PREC.bitwise_or],
        ['^', PREC.bitwise_xor],
        ['&', PREC.bitwise_and],
        ['==', PREC.equality],
        ['!=', PREC.equality],
        ['<', PREC.relational],
        ['<=', PREC.relational],
        ['>', PREC.relational],
        ['>=', PREC.relational],
        ['<<', PREC.shift],
        ['>>', PREC.shift],
        ['+', PREC.additive],
        ['-', PREC.additive],
        ['*', PREC.multiplicative],
        ['/', PREC.multiplicative],
        ['%', PREC.multiplicative],
      ];

      return choice(...operators.map(([operator, precedence]) =>
        prec.left(precedence, seq(
          field('left', $._expression),
          field('operator', operator),
          field('right', $._expression),
        ))
      ));
    },

    unary_expression: $ => prec.right(PREC.unary, seq(
      field('operator', choice('-', '!', '~')),
      field('argument', $._expression),
    )),

    // Both ++i and i++ parse: the parser of the language registers ++ and --
    // on either side.
    update_expression: $ => choice(
      prec.right(PREC.unary, seq(
        field('operator', choice('++', '--')),
        field('argument', $._expression),
      )),
      prec.left(PREC.unary, seq(
        field('argument', $._expression),
        field('operator', choice('++', '--')),
      )),
    ),

    index: $ => prec(PREC.index, seq(
      field('object', $._expression),
      '[',
      field('index', $._expression),
      ']',
    )),

    member: $ => prec(PREC.member, seq(
      field('object', $._expression),
      '.',
      field('property', $.identifier),
    )),

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    list: $ => seq('[', optional($.arguments), ']'),

    map: $ => seq('{', optional($.map_entries), '}'),

    map_entries: $ => seq(
      $.map_entry,
      repeat(seq(',', $.map_entry)),
      optional(','),
    ),

    map_entry: $ => seq(
      field('key', $._expression),
      ':',
      field('value', $._expression),
    ),

    // Control flow, all of it expressions: an if gives back the value of the
    // branch that ran.
    if: $ => prec.right(seq(
      'if',
      field('condition', $._expression),
      field('consequence', $.block),
      optional(seq('else', field('alternative', choice($.if, $.block)))),
    )),

    // Three shapes: nothing at all, one condition, or the three parts.
    for: $ => seq(
      'for',
      optional(choice(
        seq(
          field('initializer', optional($._expression)),
          ';',
          field('condition', optional($._expression)),
          ';',
          field('update', optional($._expression)),
        ),
        field('condition', $._expression),
      )),
      field('body', $.block),
    ),

    return: $ => prec.right(seq('return', optional($._expression))),

    break: $ => 'break',

    continue: $ => 'continue',
  }
});
