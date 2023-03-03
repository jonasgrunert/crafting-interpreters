import { Parser } from "./parser.ts";
import { print } from "./printer.ts";
import { scanTokens } from "./scanner.ts";

function run(source: string) {
  const parser = new Parser([...scanTokens(source, [])]);
  const expr = parser.parse();
  if (expr === null) return;
  console.log(print(expr));
}

function runFile(path: string) {
  run(Deno.readTextFileSync(path));
}

function runPrompt() {
  for (;;) {
    console.log(`> `);
    const line = prompt();
    if (line === null) break;
    run(line);
  }
}

function main(args: string[]) {
  if (args.length > 1) {
    console.log(`Usage: tdlox [script]`);
    return 64;
  }
  if (args.length === 1) {
    return runFile(args[0]);
  }
  runPrompt();
  return -1;
}

main(Deno.args);
