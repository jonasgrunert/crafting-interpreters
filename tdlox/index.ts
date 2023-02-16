import { scanTokens } from "./scanner.ts";

function run(source: string) {
  for (const token of scanTokens(source, [])) {
    console.log(token);
  }
  return 65;
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
