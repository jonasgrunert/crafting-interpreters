import { walk } from "https://deno.land/std@0.177.0/fs/mod.ts";
import { scanTokens, Token } from "./scanner.ts";
import {
  assertEquals,
  AssertionError,
} from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { Parser } from "./parser.ts";
import { print } from "./printer.ts";

const ROOT = "tdlox/test/scripts";

function assertTokens(expected: Token[], actual: Token[]) {
  if (expected.length !== actual.length) {
    throw new AssertionError(
      `Expected ${expected.length} tokens, but were ${actual.length}.`,
    );
  }
  const messages: string[] = [];
  for (let i = 0; i < expected.length; i++) {
    for (const key of Object.keys(actual[i]) as Array<
      keyof typeof actual[number]
    >) {
      if (expected[i][key] !== actual[i][key]) {
        messages.push(
          `Token ${i} ${actual[i].toString()} expected ${key} ${
            expected[i][key]
          }, but was ${actual[i][key]}.`,
        );
      }
    }
  }
  if (messages.length > 0) throw new AssertionError(messages.join("\n"));
}

for await (const file of walk(ROOT, { includeDirs: false })) {
  Deno.test(
    file.path.replaceAll("\\", "/").replace(ROOT, "").replaceAll("/", " > "),
    async () => {
      const [source, expected] = await Promise.all([
        Deno.readTextFile(file.path),
        Deno.readTextFile(
          file.path.replace("scripts", "scanning") + ".json",
        ).then(JSON.parse) as Promise<{ tokens: Token[]; errors: string[] }>,
      ]);
      const errors: string[] = [];
      assertTokens(expected.tokens, [...scanTokens(source, errors)]);
      assertEquals(errors, expected.errors);
    },
  );
}

Deno.test("Simple expression parsing", () => {
  const parse = (code: string) => {
    return print(new Parser([...scanTokens(code, [])]).parse());
  };
  const errors = (code: string) => {
    const p = new Parser([...scanTokens(code, [])]);
    p.parse();
    return p.errors;
  };
  assertEquals(parse("-123 * (45.67)"), "(* (- 123) (group 45.67))");
  assertEquals(parse("-123 - 1 * 10"), "(- (- 123) (* 1 10))");
  assertEquals(parse("-(123 - 1) / 10"), "(/ (- (group (- 123 1))) 10)");
  assertEquals(parse('"a" == "b", nil / 2'), "(, (== a b) (/ nil 2))");
  assertEquals(parse('"a" == "b" ? nil : 2'), "(?(== a b) nil 2)");
  assertEquals(errors("true ? nil"), [
    "[line 1] Error at end: Expect : after then branch of conditional expression.",
  ]);
  assertEquals(errors("(true"), [
    "[line 1] Error at end: Expect ')' after expression.",
  ]);
  for (const token of ["!=", "==", ">", ">=", "<", "<=", "+", "/", "*"]) {
    assertEquals(errors(`${token} false`), [
      `[line 1] Error at '${token}': Missing left-hand operand.`,
    ]);
  }
});
