expr -> IDENTIFIER
expr -> NUMBER
expr -> expr followOnce
followOnce -> left follow
followOnce -> right follow
follow -> followOnce
follow -> followonce
follow ->
right -> "." IDENTIFER
left -> "(" ")"
left -> "(" expr additionalExpr ")"
additionalExpr -> "," expr
additionalExpr ->

Solution:

expr → expr calls
expr → IDENTIFIER
expr → NUMBER

calls → calls call
calls → call

call → "(" ")"
call → "(" arguments ")"
call → "." IDENTIFIER

arguments → expr
arguments → arguments "," expr
