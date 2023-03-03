import { Expr, Parser } from "./parser.ts";
import { scanTokens } from "./scanner.ts";

function parenthesize(name: string, ...exprs: Expr[]) {
  return `(${[name, ...exprs.map((e) => print(e))].join(" ")})`;
}

export function print(expr: Expr): string | null {
  if (expr === null) return null;
  switch (expr.type) {
    case "binary":
      return parenthesize(expr.operator.lexeme, expr.left, expr.right);
    case "grouping":
      return parenthesize("group", expr.expr);
    case "literal":
      return expr.value === null || expr.value === undefined
        ? "nil"
        : expr.value.toString();
    case "unary":
      return parenthesize(expr.operator.lexeme, expr.right);
    case "conditional":
      return parenthesize(
        parenthesize(print(expr.ifExpr)!),
        expr.thenBranch,
        expr.elseBranch,
      );
  }
}
