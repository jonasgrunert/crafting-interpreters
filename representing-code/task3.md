No visiotr in our code just matchers :D.

```ts
type Binary {
    name: "Binary",
    left: Expr,
    operator: Token,
    right: Expr,
}

type Grouping {
    name: "Grouping",
    expression: Expr,
}

type Literal {
    name: "Literal",
    value: unknown,
}

type Unary {
    name: "Unary",
    operator: Token,
    right: Expr,
}

type Expr = Binary | Grouping | Literal | Unary;

function toRPN(expr: Expr){
    switch(expr.name){
        case "Binary": {
            if("-+*/".inlcudes(expr.operator.lexeme)){
                return `${toRPN(expr.left)} ${toRPN(expr.right)} ${expr.operator.lexeme}`;
            }
            return `${toRPN(expr.left)} ${expr.operator.lexeme} ${toRPN(expr.right)}`;
        }
        case "Grouping":
            return toRPN(expr.expression);
        case "Literal":
            return expr.value;
        case "Unary":
            return `${expr.operator.lexeme==="-" ? "~" : expr.operator.lexeme} ${toRPN(expr.right)}`
        default:
            throw new Error(`Unknown type ${expr.name}`);
    }
}
```
