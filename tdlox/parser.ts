import { error } from "./error.ts";
import { Token, TokenType } from "./scanner.ts";

type Binary = {
  type: "binary";
  left: Expr;
  operator: Token;
  right: Expr;
};

type Grouping = {
  type: "grouping";
  expr: Expr;
};

type Literal = {
  type: "literal";
  value: unknown;
};

type Unary = {
  type: "unary";
  operator: Token;
  right: Expr;
};

type Conditional = {
  type: "conditional";
  ifExpr: Expr;
  thenBranch: Expr;
  elseBranch: Expr;
};

export type Expr = Binary | Grouping | Literal | Unary | Conditional | null;

class ParseError extends EvalError {}

export class Parser {
  #tokens: Token[];
  #current = 0;
  #errors: string[] = [];

  constructor(tokens: Token[]) {
    this.#tokens = tokens;
  }

  get errors() {
    return this.#errors;
  }

  parse() {
    try {
      return this.#expression();
    } catch (e: unknown) {
      if (e instanceof ParseError) return null;
      throw e;
    }
  }

  #expression() {
    return this.#comma();
  }

  #comma() {
    let expr = this.#conditional();
    while (this.#match("COMMA")) {
      const operator = this.#previous;
      const right = this.#expression();
      expr = {
        type: "binary",
        left: expr,
        operator,
        right,
      };
    }
    return expr;
  }

  #conditional(): Expr {
    let expr = this.#equality();

    if (this.#match("QUESTION")) {
      const thenBranch = this.#equality();
      this.#consume(
        "COLON",
        "Expect : after then branch of conditional expression.",
      );
      const elseBranch = this.#conditional();
      expr = {
        type: "conditional",
        ifExpr: expr,
        thenBranch,
        elseBranch,
      };
    }
    return expr;
  }

  #equality() {
    let expr = this.#comparison();
    while (this.#match("BANG_EQUAL", "EQUAL_EQUAL")) {
      const operator = this.#previous;
      const right = this.#comparison();
      expr = {
        type: "binary",
        left: expr,
        operator,
        right,
      };
    }
    return expr;
  }

  #comparison() {
    let expr = this.#term();
    while (this.#match("GREATER", "GREATER_EQUAL", "LESS", "LESS_EQUAL")) {
      const operator = this.#previous;
      const right = this.#term();
      expr = {
        type: "binary",
        left: expr,
        operator,
        right,
      };
    }
    return expr;
  }

  #term() {
    let expr = this.#factor();
    while (this.#match("MINUS", "PLUS")) {
      const operator = this.#previous;
      const right = this.#factor();
      expr = {
        type: "binary",
        left: expr,
        operator,
        right,
      };
    }
    return expr;
  }

  #factor() {
    let expr = this.#unary();
    while (this.#match("SLASH", "STAR")) {
      const operator = this.#previous;
      const right = this.#unary();
      expr = {
        type: "binary",
        left: expr,
        operator,
        right,
      };
    }
    return expr;
  }

  #unary(): Expr {
    if (this.#match("BANG", "MINUS")) {
      const operator = this.#previous;
      const right = this.#unary();
      return {
        type: "unary",
        operator,
        right,
      };
    }
    return this.#primary();
  }

  #primary(): Expr {
    if (this.#match("FALSE")) return { type: "literal", value: false };
    if (this.#match("TRUE")) return { type: "literal", value: true };
    if (this.#match("NIL")) return { type: "literal", value: null };

    if (this.#match("NUMBER", "STRING")) {
      return { type: "literal", value: this.#previous.literal };
    }

    if (this.#match("LEFT_PAREN")) {
      const expr = this.#expression();
      this.#consume("RIGHT_PAREN", "Expect ')' after expression.");
      return { type: "grouping", expr: expr };
    }
    // Error productions.
    if (this.#match("BANG_EQUAL", "EQUAL_EQUAL")) {
      this.errors.push(error(this.#previous, "Missing left-hand operand."));
      this.#equality();
      return null;
    }

    if (this.#match("GREATER", "GREATER_EQUAL", "LESS", "LESS_EQUAL")) {
      this.errors.push(error(this.#previous, "Missing left-hand operand."));
      this.#comparison();
      return null;
    }

    if (this.#match("PLUS")) {
      this.errors.push(error(this.#previous, "Missing left-hand operand."));
      this.#term();
      return null;
    }

    if (this.#match("SLASH", "STAR")) {
      this.errors.push(error(this.#previous, "Missing left-hand operand."));
      this.#factor();
      return null;
    }

    throw this.#error(this.#peek, "Expect expression.");
  }

  #synchronize() {
    this.#advance();

    while (!this.#isAtEnd) {
      if (this.#previous.type == "SEMICOLON") return;

      switch (this.#peek.type) {
        case "CLASS":
        case "FUN":
        case "VAR":
        case "FOR":
        case "IF":
        case "WHILE":
        case "PRINT":
        case "RETURN":
          return;
      }

      this.#advance();
    }
  }

  #consume(type: TokenType, message: string) {
    if (this.#check(type)) return this.#advance();
    throw this.#error(this.#peek, message);
  }

  #error(token: Token, message: string) {
    this.#errors.push(error(token, message));
    return new ParseError();
  }

  #match(...tokens: TokenType[]) {
    for (const token of tokens) {
      if (this.#check(token)) {
        this.#advance();
        return true;
      }
    }
    return false;
  }

  #check(token: TokenType) {
    if (this.#isAtEnd) return false;
    return this.#peek.type === token;
  }

  #advance() {
    if (!this.#isAtEnd) return this.#current++;
    return this.#previous;
  }

  get #isAtEnd() {
    return this.#peek.type === "EOF";
  }

  get #peek() {
    return this.#tokens[this.#current];
  }

  get #previous() {
    return this.#tokens[this.#current - 1];
  }
}
