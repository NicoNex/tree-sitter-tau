module.exports = grammar({
  name: 'tau',

  extras: $ => [
    /\s/,
    $.comment,
  ],

  conflicts: $ => [
    [$.block, $.map],
  ],

  rules: {
    source_file: $ => repeat($._statement),

    _statement: $ => choice(
      $.expression_statement,
      $.assignment,
      $.return_statement,
      $.break_statement,
      $.continue_statement,
      $.for_statement,
      $.if_statement,
      $.comment,
    ),

    comment: $ => token(seq('#', /.*/)),

    // Expressions
    expression_statement: $ => seq(
      $._expression,
      optional('\n'),
    ),

    _expression: $ => choice(
      $.identifier,
      $.number,
      $.string,
      $.boolean,
      $.null,
      $.function_expression,
      $.call_expression,
      $.binary_expression,
      $.unary_expression,
      $.index_expression,
      $.member_expression,
      $.parenthesized_expression,
      $.array,
      $.map,
      $.if_expression,
    ),

    // Literals
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    number: $ => {
      const hex = /0[xX][0-9a-fA-F]+/;
      const binary = /0[bB][01]+/;
      const octal = /0[oO][0-7]+/;
      const decimal = /\d+/;
      const float = /\d+\.\d+/;
      const exponent = /[eE][+-]?\d+/;
      return token(choice(
        hex,
        binary,
        octal,
        seq(float, optional(exponent)),
        seq(decimal, exponent),
        decimal,
      ));
    },

    string: $ => choice(
      seq('"', repeat(choice(/[^"\\]/, /\\./)), '"'),
      seq("'", repeat(choice(/[^'\\]/, /\\./)), "'"),
    ),

    boolean: $ => choice('true', 'false'),

    null: $ => 'null',

    // Function expression
    function_expression: $ => seq(
      'fn',
      '(',
      optional($.parameter_list),
      ')',
      $.block,
    ),

    parameter_list: $ => seq(
      $.identifier,
      repeat(seq(',', $.identifier)),
      optional(','),
    ),

    block: $ => seq(
      '{',
      repeat($._statement),
      '}',
    ),

    // Assignment
    assignment: $ => prec.right(1, seq(
      field('left', choice($.identifier, $.index_expression, $.member_expression)),
      '=',
      field('right', $._expression),
    )),

    // Return statement
    return_statement: $ => prec.left(seq(
      'return',
      optional($._expression),
    )),

    // Break statement
    break_statement: $ => 'break',

    // Continue statement
    continue_statement: $ => 'continue',

    // For statement
    for_statement: $ => seq(
      'for',
      choice(
        seq(
          optional($.assignment),
          ';',
          optional($._expression),
          ';',
          optional($._expression),
        ),
        seq(
          '(',
          optional($.assignment),
          '=',
          $._expression,
          ')',
          optional($._expression),
        ),
        $._expression,
      ),
      $.block,
    ),

    // If statement
    if_statement: $ => prec.right(seq(
      'if',
      $._expression,
      $.block,
      optional(seq('else', choice($.if_statement, $.block))),
    )),

    // If expression
    if_expression: $ => prec.right(10, seq(
      'if',
      $._expression,
      '{',
      $._expression,
      '}',
      'else',
      '{',
      $._expression,
      '}',
    )),

    // Call expression
    call_expression: $ => prec(15, seq(
      field('function', $._expression),
      '(',
      optional($.argument_list),
      ')',
    )),

    argument_list: $ => seq(
      $._expression,
      repeat(seq(',', $._expression)),
      optional(','),
    ),

    // Binary expression
    binary_expression: $ => choice(
      ...[
        ['||', 1],
        ['&&', 2],
        ['==', 3],
        ['!=', 3],
        ['<', 4],
        ['<=', 4],
        ['>', 4],
        ['>=', 4],
        ['+', 5],
        ['-', 5],
        ['*', 6],
        ['/', 6],
        ['%', 6],
      ].map(([operator, precedence]) =>
        prec.left(precedence, seq(
          field('left', $._expression),
          field('operator', operator),
          field('right', $._expression),
        ))
      ),
    ),

    // Unary expression
    unary_expression: $ => prec(14, seq(
      field('operator', choice('!', '-', '++', '--')),
      field('argument', $._expression),
    )),

    // Index expression
    index_expression: $ => prec(16, seq(
      field('object', $._expression),
      '[',
      field('index', $._expression),
      ']',
    )),

    // Member expression
    member_expression: $ => prec(16, seq(
      field('object', $._expression),
      '.',
      field('property', $.identifier),
    )),

    // Parenthesized expression
    parenthesized_expression: $ => seq(
      '(',
      $._expression,
      ')',
    ),

    // Array
    array: $ => seq(
      '[',
      optional($.argument_list),
      ']',
    ),

    // Map
    map: $ => seq(
      '{',
      optional($.map_entries),
      '}',
    ),

    map_entries: $ => seq(
      $.map_entry,
      repeat(seq(',', $.map_entry)),
      optional(','),
    ),

    map_entry: $ => seq(
      choice($.string, $.identifier),
      ':',
      $._expression,
    ),
  }
});
