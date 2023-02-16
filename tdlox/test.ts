import { walk } from "https://deno.land/std@0.177.0/fs/mod.ts";
import { Scanner, Token } from "./scanner.ts";
import {
  assertEquals,
  AssertionError,
} from "https://deno.land/std@0.177.0/testing/asserts.ts";

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
      const scanner = new Scanner(source);
      assertTokens(expected.tokens, [...scanner.scanTokens()]);
      assertEquals(scanner.errors, expected.errors);
    },
  );
}
