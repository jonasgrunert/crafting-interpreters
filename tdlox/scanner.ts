import { error } from "./error.ts";

function createKeyword<Name extends string>(name: Name) {
  return createLex(
    name.toUpperCase() as Uppercase<Name>,
    `(?<!\\w)${name}(?!\\w)`,
  );
}

type LexOptions = {
  omit?: boolean;
  toLiteral?: ((lex: string) => unknown) | null;
  lines?: number | ((lex: string) => number);
  errors?: ((lex: string) => string | null) | null;
};

function createLex<Name extends string>(
  name: Name,
  regEx: string,
  options: LexOptions = {},
) {
  return [
    name,
    Object.assign(
      {
        regEx,
        omit: false,
        toLiteral: null,
        lines: 0,
        errors: null,
      },
      options,
    ),
  ] as [Name, Required<LexOptions> & { regEx: string }];
}

const lexes = [
  // Comments and Linebreaks
  createLex("COMMENT" as const, "\\/\\/.*(?:\n|$)", {
    omit: true,
    lines: (s) => (s.endsWith("\n") ? 1 : 0),
  }),
  createLex("MULTILINECOMMENT" as const, "\\/\\*(?:.|\n)*?(?:\\*\\/|$)", {
    omit: true,
    lines: (s) => s.split("\n").length - 1,
    errors: (s) =>
      s.endsWith("*/") ? null : "Unterminated multiline comment.",
  }),
  // Keywords
  createKeyword("and"),
  createKeyword("class"),
  createKeyword("else"),
  createKeyword("false"),
  createKeyword("fun"),
  createKeyword("for"),
  createKeyword("if"),
  createKeyword("nil"),
  createKeyword("or"),
  createKeyword("print"),
  createKeyword("return"),
  createKeyword("super"),
  createKeyword("this"),
  createKeyword("true"),
  createKeyword("var"),
  createKeyword("while"),
  //Literals
  createLex("STRING" as const, '\\"[\\S\\s]*?(?:\\"|$)', {
    toLiteral: (s) => s.slice(1, -1),
    lines: (s) => s.split("\n").length - 1,
    errors: (s) => (s.endsWith('"') ? null : "Unterminated string."),
  }),
  createLex("NUMBER" as const, "\\d+(\\.\\d+)?", {
    toLiteral: (n) => Number.parseFloat(n),
  }),
  createLex("IDENTIFIER" as const, "[a-zA-Z_]\\w*"),
  // Single-character tokens.
  createLex("LEFT_PAREN" as const, "\\("),
  createLex("RIGHT_PAREN" as const, "\\)"),
  createLex("LEFT_BRACE" as const, "\\{"),
  createLex("RIGHT_BRACE" as const, "\\}"),
  createLex("COMMA" as const, ","),
  createLex("DOT" as const, "\\."),
  createLex("MINUS" as const, "\\-"),
  createLex("PLUS" as const, "\\+"),
  createLex("SEMICOLON" as const, ";"),
  createLex("SLASH" as const, "\\/"),
  createLex("STAR" as const, "\\*"),
  // One or two character tokens.
  createLex("BANG_EQUAL" as const, "!="),
  createLex("BANG" as const, "!"),
  createLex("GREATER_EQUAL" as const, ">="),
  createLex("GREATER" as const, ">"),
  createLex("LESS_EQUAL" as const, "<="),
  createLex("LESS" as const, "<"),
  createLex("EQUAL_EQUAL" as const, "=="),
  createLex("EQUAL" as const, "="),
  createLex("EOF" as const, "\\s+", {
    omit: true,
    lines: (s) => s.split("\n").length - 1,
  }),
  createLex("UNKOWN_CHARACTER" as const, "\\S", {
    omit: true,
    errors: () => "Unexpected charachter.",
  }),
] as const;

type TokenType = `${typeof lexes[number][0]}`;

const Tokens: Map<string, ReturnType<typeof createLex>[1]> = new Map(lexes);
const tokenRegEx = new RegExp(
  [...Tokens.entries()]
    .map(([key, value]) => `(?<${key}>${value.regEx})`)
    .join("|"),
  "g",
);

export class Token {
  readonly type: TokenType;
  readonly lexeme: string;
  readonly literal: unknown;
  readonly line: number;

  constructor(type: TokenType, lexeme: string, literal: unknown, line: number) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.line = line;
  }

  toString() {
    return `${this.type} ${this.lexeme} ${this.literal}`;
  }
}

export class Scanner {
  #source: string;
  #line = 1;
  readonly errors: string[] = [];

  constructor(source: string) {
    this.#source = source;
  }

  *scanTokens() {
    let match: RegExpExecArray | null;
    while ((match = tokenRegEx.exec(this.#source)) != null) {
      const token = Object.keys(match.groups!).find(
        (k) => match!.groups![k],
      ) as TokenType;
      const config = Tokens.get(token)!;
      this.#line +=
        typeof config.lines === "number"
          ? config.lines
          : config.lines(match[0]);
      const errorString = config.errors?.(match[0]);
      if (errorString) {
        this.errors.push(error(this.#line, errorString));
        continue;
      }
      if (!config.omit) {
        if (config.toLiteral === null) {
          yield this.#addToken(token, match[0]);
        } else {
          yield this.#addToken(token, match[0], config.toLiteral(match[0]));
        }
      }
    }
    yield this.#addToken("EOF");
  }

  #addToken(type: TokenType, lex = "", literal: unknown = null) {
    return new Token(type, lex, literal, this.#line);
  }
}
