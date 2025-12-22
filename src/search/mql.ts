/**
 * Message Query Language (MQL) - A DSL for advanced message search
 * 
 * This module implements a complete domain-specific language for querying messages
 * with support for conditions, logical operators, field access, and functions.
 *  
 * Architecture:
 * - MQLLexer: Tokenizes input string into meaningful tokens
 * - MQLParser: Parses tokens into an Abstract Syntax Tree (AST)
 * - MQLEvaluator: Evaluates AST against message data
 * 
 * Example usage:
 * const mql = new MessageQueryLanguage();
 * const result = mql.query('from:john AND contains("important")', messages);
 */

// Token types for the lexer
export enum TokenType {
  // Literals
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  IDENTIFIER = 'IDENTIFIER',
  
  // Operators
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_EQUAL = 'GREATER_EQUAL',
  LESS_EQUAL = 'LESS_EQUAL',
  
  // Delimiters
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  COLON = 'COLON',
  COMMA = 'COMMA',
  DOT = 'DOT',
  
  // Special
  EOF = 'EOF',
}

// Token interface
export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

// AST Node types
export interface ASTNode {
  type: string;
}

export interface BinaryOpNode extends ASTNode {
  type: 'binary_op';
  operator: TokenType;
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryOpNode extends ASTNode {
  type: 'unary_op';
  operator: TokenType;
  operand: ASTNode;
}

export interface FieldAccessNode extends ASTNode {
  type: 'field_access';
  field: string;
  value: ASTNode;
}

export interface FunctionCallNode extends ASTNode {
  type: 'function_call';
  name: string;
  args: ASTNode[];
}

export interface LiteralNode extends ASTNode {
  type: 'literal';
  value: string | number;
}

export interface IdentifierNode extends ASTNode {
  type: 'identifier';
  name: string;
}

/**
 * MQLLexer - Tokenizes MQL query strings
 */
export class MQLLexer {
  private input: string;
  private position: number;
  private currentChar: string | null;

  constructor(input: string) {
    this.input = input;
    this.position = 0;
    this.currentChar = this.input[this.position] || null;
  }

  private advance(): void {
    this.position++;
    this.currentChar = this.position < this.input.length ? this.input[this.position] : null;
  }

  private skipWhitespace(): void {
    while (this.currentChar && /\s/.test(this.currentChar)) {
      this.advance();
    }
  }

  private readString(): string {
    let result = '';
    const quote = this.currentChar; // " or '
    this.advance(); // Skip opening quote
    
    while (this.currentChar && this.currentChar !== quote) {
      if (this.currentChar === '\\') {
        this.advance();
        if (this.currentChar) {
          result += this.currentChar;
          this.advance();
        }
      } else {
        result += this.currentChar;
        this.advance();
      }
    }
    
    if (this.currentChar === quote) {
      this.advance(); // Skip closing quote
    }
    
    return result;
  }

  private readNumber(): string {
    let result = '';
    while (this.currentChar && /[0-9.]/.test(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }
    return result;
  }

  private readIdentifier(): string {
    let result = '';
    while (this.currentChar && /[a-zA-Z0-9_]/.test(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }
    return result;
  }

  getNextToken(): Token {
    while (this.currentChar) {
      const pos = this.position;

      if (/\s/.test(this.currentChar)) {
        this.skipWhitespace();
        continue;
      }

      if (this.currentChar === '"' || this.currentChar === "'") {
        return { type: TokenType.STRING, value: this.readString(), position: pos };
      }

      if (/[0-9]/.test(this.currentChar)) {
        return { type: TokenType.NUMBER, value: this.readNumber(), position: pos };
      }

      if (/[a-zA-Z_]/.test(this.currentChar)) {
        const identifier = this.readIdentifier();
        
        // Check for keywords
        switch (identifier.toLowerCase()) {
          case 'and':
            return { type: TokenType.AND, value: identifier, position: pos };
          case 'or':
            return { type: TokenType.OR, value: identifier, position: pos };
          case 'not':
            return { type: TokenType.NOT, value: identifier, position: pos };
          default:
            return { type: TokenType.IDENTIFIER, value: identifier, position: pos };
        }
      }

      // Two-character operators
      if (this.currentChar === '=' && this.input[this.position + 1] === '=') {
        this.advance();
        this.advance();
        return { type: TokenType.EQUALS, value: '==', position: pos };
      }

      if (this.currentChar === '!' && this.input[this.position + 1] === '=') {
        this.advance();
        this.advance();
        return { type: TokenType.NOT_EQUALS, value: '!=', position: pos };
      }

      if (this.currentChar === '>' && this.input[this.position + 1] === '=') {
        this.advance();
        this.advance();
        return { type: TokenType.GREATER_EQUAL, value: '>=', position: pos };
      }

      if (this.currentChar === '<' && this.input[this.position + 1] === '=') {
        this.advance();
        this.advance();
        return { type: TokenType.LESS_EQUAL, value: '<=', position: pos };
      }

      // Single-character tokens
      switch (this.currentChar) {
        case '(':
          this.advance();
          return { type: TokenType.LPAREN, value: '(', position: pos };
        case ')':
          this.advance();
          return { type: TokenType.RPAREN, value: ')', position: pos };
        case ':':
          this.advance();
          return { type: TokenType.COLON, value: ':', position: pos };
        case ',':
          this.advance();
          return { type: TokenType.COMMA, value: ',', position: pos };
        case '.':
          this.advance();
          return { type: TokenType.DOT, value: '.', position: pos };
        case '>':
          this.advance();
          return { type: TokenType.GREATER_THAN, value: '>', position: pos };
        case '<':
          this.advance();
          return { type: TokenType.LESS_THAN, value: '<', position: pos };
        default:
          throw new Error(`Unexpected character: ${this.currentChar} at position ${pos}`);
      }
    }

    return { type: TokenType.EOF, value: '', position: this.position };
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    let token = this.getNextToken();
    
    while (token.type !== TokenType.EOF) {
      tokens.push(token);
      token = this.getNextToken();
    }
    
    tokens.push(token); // Add EOF token
    return tokens;
  }
}

/**
 * MQLParser - Parses tokens into an Abstract Syntax Tree
 */
export class MQLParser {
  private tokens: Token[];
  private position: number;
  private currentToken: Token;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.position = 0;
    this.currentToken = this.tokens[this.position];
  }

  private advance(): void {
    this.position++;
    if (this.position < this.tokens.length) {
      this.currentToken = this.tokens[this.position];
    }
  }

  private eat(tokenType: TokenType): void {
    if (this.currentToken.type === tokenType) {
      this.advance();
    } else {
      throw new Error(
        `Expected token ${tokenType}, got ${this.currentToken.type} at position ${this.currentToken.position}`
      );
    }
  }

  // Grammar: expression = or_expression
  parse(): ASTNode {
    const node = this.orExpression();
    if (this.currentToken.type !== TokenType.EOF) {
      throw new Error(`Unexpected token: ${this.currentToken.type} at position ${this.currentToken.position}`);
    }
    return node;
  }

  // Grammar: or_expression = and_expression (OR and_expression)*
  private orExpression(): ASTNode {
    let node = this.andExpression();

    while (this.currentToken.type === TokenType.OR) {
      const operator = this.currentToken.type;
      this.advance();
      node = {
        type: 'binary_op',
        operator,
        left: node,
        right: this.andExpression(),
      } as BinaryOpNode;
    }

    return node;
  }

  // Grammar: and_expression = not_expression (AND not_expression)*
  private andExpression(): ASTNode {
    let node = this.notExpression();

    while (this.currentToken.type === TokenType.AND) {
      const operator = this.currentToken.type;
      this.advance();
      node = {
        type: 'binary_op',
        operator,
        left: node,
        right: this.notExpression(),
      } as BinaryOpNode;
    }

    return node;
  }

  // Grammar: not_expression = NOT? comparison_expression
  private notExpression(): ASTNode {
    if (this.currentToken.type === TokenType.NOT) {
      const operator = this.currentToken.type;
      this.advance();
      return {
        type: 'unary_op',
        operator,
        operand: this.notExpression(),
      } as UnaryOpNode;
    }

    return this.comparisonExpression();
  }

  // Grammar: comparison_expression = primary_expression (comparison_op primary_expression)?
  private comparisonExpression(): ASTNode {
    let node = this.primaryExpression();

    const comparisonOps = [
      TokenType.EQUALS,
      TokenType.NOT_EQUALS,
      TokenType.GREATER_THAN,
      TokenType.LESS_THAN,
      TokenType.GREATER_EQUAL,
      TokenType.LESS_EQUAL,
    ];

    if (comparisonOps.includes(this.currentToken.type)) {
      const operator = this.currentToken.type;
      this.advance();
      node = {
        type: 'binary_op',
        operator,
        left: node,
        right: this.primaryExpression(),
      } as BinaryOpNode;
    }

    return node;
  }

  // Grammar: primary_expression = field_access | function_call | literal | ( expression )
  private primaryExpression(): ASTNode {
    if (this.currentToken.type === TokenType.LPAREN) {
      this.advance();
      const node = this.orExpression();
      this.eat(TokenType.RPAREN);
      return node;
    }

    if (this.currentToken.type === TokenType.IDENTIFIER) {
      return this.fieldAccessOrFunctionCall();
    }

    if (this.currentToken.type === TokenType.STRING) {
      const value = this.currentToken.value;
      this.advance();
      return { type: 'literal', value } as LiteralNode;
    }

    if (this.currentToken.type === TokenType.NUMBER) {
      const value = parseFloat(this.currentToken.value);
      this.advance();
      return { type: 'literal', value } as LiteralNode;
    }

    throw new Error(`Unexpected token: ${this.currentToken.type} at position ${this.currentToken.position}`);
  }

  // Grammar: field_access_or_function_call = IDENTIFIER (: primary_expression | ( argument_list ))
  private fieldAccessOrFunctionCall(): ASTNode {
    const name = this.currentToken.value;
    this.advance();

    if (this.currentToken.type === TokenType.COLON) {
      // Field access: field:value
      this.advance();
      const value = this.primaryExpression();
      return {
        type: 'field_access',
        field: name,
        value,
      } as FieldAccessNode;
    }

    if (this.currentToken.type === TokenType.LPAREN) {
      // Function call: function(args)
      this.advance();
      const args: ASTNode[] = [];

      if ((this.currentToken.type as TokenType) !== TokenType.RPAREN) {
        args.push(this.orExpression());

        while ((this.currentToken.type as TokenType) === TokenType.COMMA) {
          this.advance();
          args.push(this.orExpression());
        }
      }

      this.eat(TokenType.RPAREN);
      return {
        type: 'function_call',
        name,
        args,
      } as FunctionCallNode;
    }

    // Just an identifier
    return { type: 'identifier', name } as IdentifierNode;
  }
}

/**
 * MQLEvaluator - Evaluates AST against message data
 */
export class MQLEvaluator {
  private messages: any[];

  constructor(messages: any[]) {
    this.messages = messages;
  }

  evaluate(node: ASTNode): any[] {
    return this.messages.filter(message => this.evaluateNode(node, message));
  }

  private evaluateNode(node: ASTNode, message: any): boolean {
    switch (node.type) {
      case 'binary_op':
        return this.evaluateBinaryOp(node as BinaryOpNode, message);
      case 'unary_op':
        return this.evaluateUnaryOp(node as UnaryOpNode, message);
      case 'field_access':
        return this.evaluateFieldAccess(node as FieldAccessNode, message);
      case 'function_call':
        return this.evaluateFunctionCall(node as FunctionCallNode, message);
      case 'literal':
        return !!(node as LiteralNode).value;
      case 'identifier':
        return this.evaluateIdentifier(node as IdentifierNode, message);
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  private evaluateBinaryOp(node: BinaryOpNode, message: any): boolean {
    const left = this.evaluateNodeValue(node.left, message);
    const right = this.evaluateNodeValue(node.right, message);

    switch (node.operator) {
      case TokenType.AND:
        return this.evaluateNode(node.left, message) && this.evaluateNode(node.right, message);
      case TokenType.OR:
        return this.evaluateNode(node.left, message) || this.evaluateNode(node.right, message);
      case TokenType.EQUALS:
        return left === right;
      case TokenType.NOT_EQUALS:
        return left !== right;
      case TokenType.GREATER_THAN:
        return left > right;
      case TokenType.LESS_THAN:
        return left < right;
      case TokenType.GREATER_EQUAL:
        return left >= right;
      case TokenType.LESS_EQUAL:
        return left <= right;
      default:
        throw new Error(`Unknown binary operator: ${node.operator}`);
    }
  }

  private evaluateUnaryOp(node: UnaryOpNode, message: any): boolean {
    switch (node.operator) {
      case TokenType.NOT:
        return !this.evaluateNode(node.operand, message);
      default:
        throw new Error(`Unknown unary operator: ${node.operator}`);
    }
  }

  private evaluateFieldAccess(node: FieldAccessNode, message: any): boolean {
    const fieldValue = this.getFieldValue(message, node.field);
    const expectedValue = this.evaluateNodeValue(node.value, message);
    
    if (typeof fieldValue === 'string' && typeof expectedValue === 'string') {
      return fieldValue.toLowerCase().includes(expectedValue.toLowerCase());
    }
    
    return fieldValue === expectedValue;
  }

  private evaluateFunctionCall(node: FunctionCallNode, message: any): boolean {
    const args = node.args.map(arg => this.evaluateNodeValue(arg, message));

    switch (node.name.toLowerCase()) {
      case 'contains':
        const searchText = args[0]?.toString().toLowerCase() || '';
        const messageText = (message.content || '').toLowerCase();
        return messageText.includes(searchText);
        
      case 'startswith':
        const prefix = args[0]?.toString().toLowerCase() || '';
        return (message.content || '').toLowerCase().startsWith(prefix);
        
      case 'endswith':
        const suffix = args[0]?.toString().toLowerCase() || '';
        return (message.content || '').toLowerCase().endsWith(suffix);
        
      case 'length':
        const text = message.content || '';
        const targetLength = Number(args[0]) || 0;
        return text.length === targetLength;
        
      case 'regex':
        const pattern = args[0]?.toString() || '';
        const flags = args[1]?.toString() || 'i';
        try {
          const regex = new RegExp(pattern, flags);
          return regex.test(message.content || '');
        } catch {
          return false;
        }
        
      case 'hasattachments':
        return !!(message.attachments && message.attachments.length > 0);
        
      case 'isreply':
        return !!(message.parent_id || message.reply_to);
        
      case 'ispinned':
        return !!(message.pinned || message.is_pinned);
        
      case 'age':
        const days = Number(args[0]) || 0;
        const messageDate = new Date(message.created_at);
        const now = new Date();
        const diffDays = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= days;
        
      case 'mentions':
        const username = args[0]?.toString().toLowerCase() || '';
        const content = (message.content || '').toLowerCase();
        return content.includes(`@${username}`);
        
      default:
        throw new Error(`Unknown function: ${node.name}`);
    }
  }

  private evaluateIdentifier(node: IdentifierNode, message: any): boolean {
    // Handle boolean field access
    return !!this.getFieldValue(message, node.name);
  }

  private evaluateNodeValue(node: ASTNode, message: any): any {
    switch (node.type) {
      case 'literal':
        return (node as LiteralNode).value;
      case 'identifier':
        return this.getFieldValue(message, (node as IdentifierNode).name);
      case 'field_access':
        return this.getFieldValue(message, (node as FieldAccessNode).field);
      default:
        return this.evaluateNode(node, message);
    }
  }

  private getFieldValue(message: any, field: string): any {
    const fieldMap: Record<string, string> = {
      'from': 'author',
      'user': 'author',
      'sender': 'author',
      'author': 'author',
      'to': 'recipient',
      'content': 'content',
      'text': 'content',
      'message': 'content',
      'body': 'content',
      'channel': 'channel_id',
      'room': 'channel_id',
      'date': 'created_at',
      'time': 'created_at',
      'timestamp': 'created_at',
      'created': 'created_at',
      'type': 'type',
      'id': 'id',
    };

    const actualField = fieldMap[field.toLowerCase()] || field;
    
    // Handle nested field access with dot notation
    if (actualField.includes('.')) {
      return actualField.split('.').reduce((obj, key) => obj?.[key], message);
    }
    
    return message[actualField];
  }
}

/**
 * MessageQueryLanguage - Main class that orchestrates the DSL
 */
export class MessageQueryLanguage {
  /**
   * Execute a MQL query against a set of messages
   */
  query(queryString: string, messages: any[]): any[] {
    try {
      // Step 1: Lexical analysis
      const lexer = new MQLLexer(queryString);
      const tokens = lexer.tokenize();

      // Step 2: Parsing
      const parser = new MQLParser(tokens);
      const ast = parser.parse();

      // Step 3: Evaluation
      const evaluator = new MQLEvaluator(messages);
      return evaluator.evaluate(ast);
    } catch (error) {
      throw new Error(`MQL Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate a MQL query syntax without executing it
   */
  validate(queryString: string): { valid: boolean; error?: string } {
    try {
      const lexer = new MQLLexer(queryString);
      const tokens = lexer.tokenize();
      const parser = new MQLParser(tokens);
      parser.parse();
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get available functions and their descriptions
   */
  getAvailableFunctions(): Record<string, string> {
    return {
      'contains(text)': 'Check if message contains specific text',
      'startswith(text)': 'Check if message starts with specific text', 
      'endswith(text)': 'Check if message ends with specific text',
      'length(number)': 'Check if message has exact character length',
      'regex(pattern, flags?)': 'Match message against regular expression',
      'hasattachments()': 'Check if message has file attachments',
      'isreply()': 'Check if message is a reply to another message',
      'ispinned()': 'Check if message is pinned in channel',
      'age(days)': 'Check if message is within specified days old',
      'mentions(username)': 'Check if message mentions specific user',
    };
  }

  /**
   * Get available field names for queries
   */
  getAvailableFields(): Record<string, string> {
    return {
      'from/author/user/sender': 'Message author/sender',
      'to/recipient': 'Message recipient', 
      'content/text/message/body': 'Message text content',
      'channel/room': 'Channel or room ID',
      'date/time/timestamp/created': 'Message creation time',
      'type': 'Message type',
      'id': 'Message ID',
    };
  }

  /**
   * Get example queries for reference
   */
  getExamples(): Record<string, string> {
    return {
      'from:john': 'Messages from user john',
      'contains("important")': 'Messages containing "important"',
      'from:alice AND contains("meeting")': 'Messages from alice containing "meeting"', 
      'hasattachments() OR ispinned()': 'Messages with attachments or that are pinned',
      'age(7) AND NOT from:bot': 'Messages from last 7 days, not from bot',
      'channel:general AND mentions("team")': 'Messages in #general mentioning "team"',
      'startswith("Hello") OR endswith("thanks")': 'Messages starting with "Hello" or ending with "thanks"',
      'regex("\\d+", "g")': 'Messages containing numbers',
    };
  }
}

export default MessageQueryLanguage;

