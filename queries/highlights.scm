; Comments
(comment) @comment

; Keywords
[
  "fn"
  "if"
  "else"
  "for"
  "return"
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

; Built-in function calls (higher priority)
(call_expression
  function: (identifier) @function.builtin
  (#match? @function.builtin "^(len|println|print|input|string|error|type|int|float|exit|append|new|failed|plugin|pipe|send|recv|close|hex|oct|bin|slice|keys|delete|bytes)$"))

; Method calls on member expressions
(call_expression
  function: (member_expression
    property: (identifier) @function.method))

; Regular function calls
(call_expression
  function: (identifier) @function.call)

; Parameters
(parameter_list
  (identifier) @variable.parameter)

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

; Property access
(member_expression
  property: (identifier) @property)

; Variables
(identifier) @variable
