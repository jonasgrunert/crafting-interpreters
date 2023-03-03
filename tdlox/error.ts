import { Token } from "./scanner.ts";

function report(line: number, where: string, message: string) {
  const m = `[line ${line}] Error${where}: ${message}`;
  console.log(m);
  return m;
}

export function error(where: number | Token, message: string) {
  if (typeof where === "number") {
    return report(where, "", message);
  }
  return report(
    where.line,
    where.type === "EOF" ? " at end" : ` at '${where.lexeme}'`,
    message,
  );
}
