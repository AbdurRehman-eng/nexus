/**
 * Search Service
 * 
 * This file demonstrates:
 * 2. Declarative specification for search(query)
 * 
 * This file shows how declarative specifications are implemented in the actual Nexus codebase
 * and how they enable switching from keyword to semantic search.
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
   * 
   * This method is used throughout Nexus for message search functionality.
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
   * 
   * Uses actual Message.content from Message objects in the system.
   */
  private keywordMatch(message: Message, query: string): boolean {
    // MUTATION RISK: This relies on message.content being immutable.
    // If content were mutable and changed after indexing, search results would show
    // messages that don't match the displayed content (e.g., search for "hello" returns
    // a message that was mutated to say "goodbye"). Message.content is readonly (Message.ts line 23).
    const queryLower = query.toLowerCase();
    return message.content.toLowerCase().includes(queryLower);
  }

  /**
   * semanticMatch: Alternative implementation that satisfies the same spec
   * 
   * This demonstrates that the declarative specification allows different
   * implementations without affecting callers.
   * 
   * Uses actual Message.embedding from Message objects in the system.
   */
  private semanticMatch(message: Message, query: string): boolean {
    // This would use semanticSearch(query) internally
    // The specification remains: "returns all messages where match(m, query) == true"
    // Implementation can change from keyword to semantic without breaking callers
    if (!message.embedding) {
      return false;
    }
    
    // MUTATION RISK: This relies on message.embedding being immutable.
    // If embedding were mutable and changed after indexing, similarity calculations would be wrong,
    // causing search to return incorrect matches. Message.embedding getter returns defensive copy
    // (Message.ts line 93-94) to prevent this risk.
    // Placeholder: In real implementation, would compute similarity
    // between message.embedding and query embedding
    // Uses actual Message.embedding which must be 1536 dimensions (enforced by Message constructor)
    return this.keywordMatch(message, query); // Fallback for now
  }

  /**
   * Hybrid search: Another implementation that satisfies the same declarative spec
   * 
   * Combines keyword and semantic matching.
   * Still satisfies: "returns all messages where match(m, query) == true"
   */
  private hybridMatch(message: Message, query: string): boolean {
    // Combines keyword and semantic matching
    // Still satisfies: "returns all messages where match(m, query) == true"
    return this.keywordMatch(message, query) || this.semanticMatch(message, query);
  }

  /**
   * Add message to searchable collection
   * 
   * Used by MessageService to index messages for search.
   * See MessageService.ts line 130 for integration.
   */
  addMessage(message: Message): void {
    this.messages.push(message);
  }
}

/**
 * Example usage demonstrating that the declarative specification
 * allows implementation changes without affecting callers:
 * 
 * // Setup with actual Message objects
 * const searchService = new SearchService();
 * 
 * // Add messages using actual Message constructor
 * const msg1 = new Message('msg1', 'Hello world', new Date(), 'user1', 'channel1', null);
 * const msg2 = new Message('msg2', 'Hello there', new Date(), 'user2', 'channel1', null);
 * const msg3 = new Message('msg3', 'Goodbye', new Date(), 'user1', 'channel1', null);
 * 
 * searchService.addMessage(msg1);
 * searchService.addMessage(msg2);
 * searchService.addMessage(msg3);
 * 
 * // Search works the same regardless of implementation
 * const results = searchService.search("hello");
 * // Returns [msg1, msg2] - both contain "hello"
 * 
 * // Whether searchService uses keywordMatch(), semanticMatch(), or hybridMatch()
 * // internally doesn't matter - the specification guarantees:
 * // "returns all messages m where match(m, query) == true"
 * 
 * // To switch to semantic search, just change line 67 from:
 * // return this.keywordMatch(message, query);
 * // to:
 * // return this.semanticMatch(message, query);
 * // All callers continue to work without changes!
 */
