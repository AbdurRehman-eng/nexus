/**
 * Search Service
 * 
 * This file demonstrates:
 * 2. Declarative specification for search(query)
 */

import { Message } from '../models/Message';

/**
 * Declarative Specification for search(query):
 * 
 * search(query: string): Message[]
 * 
 * Returns all messages m in the system where match(m, query) == true.
 * 
 * The specification is declarative because:
 * - It describes WHAT the function returns (all matching messages)
 * - It does not specify HOW to find them (implementation detail)
 * - The match() function can be replaced with semanticMatch() or keywordMatch()
 *   without affecting callers, as long as the specification holds
 * 
 * Preconditions:
 * - query must be a non-empty string
 * 
 * Postconditions:
 * - Returns an array of messages (possibly empty)
 * - All returned messages satisfy match(message, query) == true
 * - No messages that satisfy match(message, query) == true are omitted
 */
export class SearchService {
  private messages: Message[] = [];

  /**
   * Declarative specification:
   * Returns all messages m where match(m, query) == true.
   * 
   * The implementation can use keyword search, semantic search, or both,
   * but the specification remains the same.
   */
  search(query: string): Message[] {
    if (!query || query.trim().length === 0) {
      return [];
    }

    // Implementation: Uses match() function which can be swapped
    // The specification doesn't care HOW matching is done
    return this.messages.filter(message => this.match(message, query));
  }

  /**
   * match(message, query): boolean
   * 
   * Declarative specification:
   * Returns true if and only if message matches query according to some criteria.
   * 
   * This function can be replaced with:
   * - keywordMatch() for keyword-based search
   * - semanticMatch() for AI-based semantic search
   * - hybridMatch() for combined approaches
   * 
   * As long as the specification holds, callers don't need to change.
   */
  private match(message: Message, query: string): boolean {
    // Current implementation: keyword matching
    // Can be replaced with semanticMatch() without changing search() signature
    return this.keywordMatch(message, query);
  }

  /**
   * keywordMatch: Implementation detail - not part of the declarative spec
   */
  private keywordMatch(message: Message, query: string): boolean {
    const queryLower = query.toLowerCase();
    return message.content.toLowerCase().includes(queryLower);
  }

  /**
   * semanticMatch: Alternative implementation that satisfies the same spec
   * 
   * This demonstrates that the declarative specification allows different
   * implementations without affecting callers.
   */
  private semanticMatch(message: Message, query: string): boolean {
    // This would use semanticSearch(query) internally
    // The specification remains: "returns all messages where match(m, query) == true"
    // Implementation can change from keyword to semantic without breaking callers
    if (!message.embedding) {
      return false;
    }
    
    // Placeholder: In real implementation, would compute similarity
    // between message.embedding and query embedding
    return this.keywordMatch(message, query); // Fallback for now
  }

  /**
   * Hybrid search: Another implementation that satisfies the same declarative spec
   */
  private hybridMatch(message: Message, query: string): boolean {
    // Combines keyword and semantic matching
    // Still satisfies: "returns all messages where match(m, query) == true"
    return this.keywordMatch(message, query) || this.semanticMatch(message, query);
  }

  /**
   * Add message to searchable collection
   */
  addMessage(message: Message): void {
    this.messages.push(message);
  }
}

/**
 * Example usage demonstrating that the declarative specification
 * allows implementation changes without affecting callers:
 * 
 * const searchService = new SearchService();
 * const results = searchService.search("hello");
 * 
 * Whether searchService uses keywordMatch(), semanticMatch(), or hybridMatch()
 * internally doesn't matter - the specification guarantees:
 * "returns all messages m where match(m, query) == true"
 */

