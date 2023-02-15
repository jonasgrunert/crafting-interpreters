import { error } from "./error.ts";

const Tokens = [
  // Single-character tokens.
  "LEFT_PAREN",
  "RIGHT_PAREN",
  "LEFT_BRACE",
  "RIGHT_BRACE",
  "COMMA",
  "DOT",
  "MINUS",
  "PLUS",
  "SEMICOLON",
  "SLASH",
  "STAR",

  // One or two character tokens.
  "BANG",
  "BANG_EQUAL",
  "EQUAL",
  "EQUAL_EQUAL",
  "GREATER",
  "GREATER_EQUAL",
  "LESS",
  "LESS_EQUAL",

  // Literals.
  "IDENTIFIER",
  "STRING",
  "NUMBER",

  // Keywords.
  "AND",
  "CLASS",
  "ELSE",
  "FALSE",
  "FUN",
  "FOR",
  "IF",
  "NIL",
  "OR",
  "PRINT",
  "RETURN",
  "SUPER",
  "THIS",
  "TRUE",
  "VAR",
  "WHILE",

  "EOF",
] as const;

type TokenType = typeof Tokens[number];

const keywords: Map<string, TokenType> = new Map(
  [
    "and",
    "class",
    "else",
    "false",
    "for",
    "fun",
    "if",
    "nil",
    "or",
    "print",
    "return",
    "super",
    "this",
    "true",
    "var",
    "while",
  ].map((m) => [m, m.toUpperCase() as TokenType]),
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
  #tokens: Token[] = [];
  #start = 0;
  #current = 0;
  #line = 1;
  readonly errors: string[] = [];

  constructor(source: string) {
    this.#source = source;
  }

  get #isAtEnd() {
    return this.#current >= this.#source.length;
  }

  scanTokens() {
    while (!this.#isAtEnd) {
      this.#start = this.#current;
      this.#scanToken();
    }
    this.#tokens.push(new Token("EOF", "", null, this.#line));
    return this.#tokens;
  }

  #scanToken() {
    const c = this.#advance();
    switch (c) {
      case "(":
        this.#addToken("LEFT_PAREN");
        break;
      case ")":
        this.#addToken("RIGHT_PAREN");
        break;
      case "{":
        this.#addToken("LEFT_BRACE");
        break;
      case "}":
        this.#addToken("RIGHT_BRACE");
        break;
      case ",":
        this.#addToken("COMMA");
        break;
      case ".":
        this.#addToken("DOT");
        break;
      case "-":
        this.#addToken("MINUS");
        break;
      case "+":
        this.#addToken("PLUS");
        break;
      case ";":
        this.#addToken("SEMICOLON");
        break;
      case "*":
        this.#addToken("STAR");
        break;
      case "!":
        this.#addToken(this.#match("=") ? "BANG_EQUAL" : "BANG");
        break;
      case "=":
        this.#addToken(this.#match("=") ? "EQUAL_EQUAL" : "EQUAL");
        break;
      case "<":
        this.#addToken(this.#match("=") ? "LESS_EQUAL" : "LESS");
        break;
      case ">":
        this.#addToken(this.#match("=") ? "GREATER_EQUAL" : "GREATER");
        break;
      case "/":
        if (this.#match("/")) {
          while (this.#peek() !== "\n" && !this.#isAtEnd) this.#advance();
        } else if (this.#match("*")) {
          while (
            this.#peek() !== "*" &&
            this.#peekNext() !== "/" &&
            !this.#isAtEnd
          ) {
            if (this.#peek() === "\n") this.#line++;
            this.#advance();
          }
          if (this.#isAtEnd) {
            this.errors.push(
              error(this.#line, "Unterminated multiline comment."),
            );
            return;
          }
          this.#advance();
          this.#advance();
        } else {
          this.#addToken("SLASH");
        }
        break;
      case " ":
      case "\r":
      case "\t":
        // Ignore whitespace.
        break;
      case "\n":
        this.#line++;
        break;
      case '"':
        this.#string();
        break;
      default:
        if (this.#isDigit(c)) {
          this.#number();
        } else if (this.#isAlpha(c)) {
          this.#identifier();
        } else {
          this.errors.push(error(this.#line, `Unexpected character.`));
        }
        break;
    }
  }

  #advance() {
    return this.#source.charAt(this.#current++);
  }

  #match(expected: string) {
    if (this.#isAtEnd) return false;
    if (this.#source.charAt(this.#current) !== expected) return false;
    this.#current++;
    return true;
  }

  #peek() {
    if (this.#isAtEnd) return "\0";
    return this.#source.charAt(this.#current);
  }

  #peekNext() {
    if (this.#current + 1 >= this.#source.length) return "\0";
    return this.#source.charAt(this.#current + 1);
  }

  #isAlpha(c: string) {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
  }

  #isAlphaNumeric(c: string) {
    return this.#isAlpha(c) || this.#isDigit(c);
  }

  #string() {
    while (this.#peek() != '"' && !this.#isAtEnd) {
      if (this.#peek() === "\n") this.#line++;
      this.#advance();
    }

    if (this.#isAtEnd) {
      this.errors.push(error(this.#line, "Unterminated string."));
      return;
    }

    this.#advance();
    const value = this.#source.slice(this.#start + 1, this.#current - 1);
    this.#addToken("STRING", value);
  }

  #isDigit(c: string) {
    return c >= "0" && c <= "9";
  }

  #number() {
    while (this.#isDigit(this.#peek())) this.#advance();

    if (this.#peek() === "." && this.#isDigit(this.#peekNext())) {
      this.#advance();
      while (this.#isDigit(this.#peek())) this.#advance();
    }

    this.#addToken(
      "NUMBER",
      Number.parseFloat(this.#source.slice(this.#start, this.#current)),
    );
  }

  #identifier() {
    while (this.#isAlphaNumeric(this.#peek())) this.#advance();
    const text = this.#source.slice(this.#start, this.#current);
    const token = keywords.get(text) ?? "IDENTIFIER";
    this.#addToken(token);
  }

  #addToken(type: TokenType, literal: unknown = null) {
    this.#tokens.push(
      new Token(
        type,
        this.#source.slice(this.#start, this.#current),
        literal,
        this.#line,
      ),
    );
  }
}
