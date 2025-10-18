; Comments
(comment) @comment

; Keywords
[
  "fn"
  "if"
  "else"
  "for"
  "return"
  "break"
  "continue"
  "tau"
] @keyword

; Boolean literals
(boolean) @constant.builtin.boolean

; Null
(null) @constant.builtin

; Numbers
(number) @number

; Strings
(string) @string

; Function definitions
(function_expression) @function

; Built-in function calls
(call_expression
  function: (identifier) @function
  (#match? @function "^(len|println|print|input|string|error|type|int|float|exit|append|new|failed|plugin|pipe|send|recv|close|hex|oct|bin|slice|keys|delete|bytes)$"))

; Regular function calls - highlight the function name
(call_expression
  function: (identifier) @function)

; Parameters
(parameter_list
  (identifier) @variable.parameter)

; Property access - placed BEFORE method calls so method calls can override
(member_expression
  property: (identifier) @property)

; Method calls on member expressions - MUST come after property access to override
(call_expression
  function: (member_expression
    property: (identifier) @function))

; Variables in member expression objects
(member_expression
  object: (identifier) @variable)

; Variables in index expressions
(index_expression
  object: (identifier) @variable)

; Variables as index
(index_expression
  index: (identifier) @variable)

; Left side of assignments
(assignment
  left: (identifier) @variable)

; Right side of assignments (variables being read)
(assignment
  right: (identifier) @variable)

; Variables in binary expressions
(binary_expression
  left: (identifier) @variable)

(binary_expression
  right: (identifier) @variable)

; Variables as arguments to function calls
(argument_list
  (identifier) @variable)

; Variables in return statements (direct identifiers)
(return_statement
  (identifier) @variable)

; Operators
[
  "="
  "+"
  "-"
  "*"
  "/"
  "%"
  "=="
  "!="
  "<"
  "<="
  ">"
  ">="
  "&&"
  "||"
  "!"
  "++"
  "--"
] @operator

; Punctuation
[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

[
  ","
  ":"
  ";"
] @punctuation.delimiter
