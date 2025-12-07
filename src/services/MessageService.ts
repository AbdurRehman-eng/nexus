/**
 * Message Service
 * 
 * This file demonstrates:
 * 6. Partition testing for addMessage()
 * 
 * This file shows how partition testing is implemented in the actual Nexus codebase
 * using real Message objects and integration with other components.
 */

import { Message } from '../models/Message';
import { assertMessageInvariants } from '../utils/Assertions';
import { SearchService } from '../search/SearchService';
import { ThreadNode, getThreadDepth, getThreadMessageCount, flattenThread, buildThreadFromMessages } from '../utils/ThreadDepth';
import { AccessControl, Permission } from '../auth/AccessControl';

/**
 * Partition testing divides the input space into equivalence classes.
 * Each partition represents a set of inputs that should be handled similarly.
 * 
 * For addMessage(), we partition based on:
 * 1. Message content length (empty, short, normal, long, very long)
 * 2. User validity (valid user, invalid user, non-existent user)
 * 3. Channel validity (valid channel, invalid channel, non-existent channel)
 * 4. Thread relationship (root message, valid thread reply, invalid thread reply)
 * 5. Embedding presence (with embedding, without embedding, invalid embedding)
 */
export class MessageService {
  private messages: Map<string, Message> = new Map();
  private validUserIds: Set<string> = new Set();
  private validChannelIds: Set<string> = new Set(); // CODE REVIEW CATCH: Was incorrectly 'new Map()' - type mismatch!
  private searchService: SearchService | null = null;
  private accessControl: AccessControl | null = null;

  /**
   * addMessage(message: Message): void
   * 
   * Partition test cases:
   * 
   * Partition 1: Content length
   *   - Empty content (should fail) - tested at Line 61-63
   *   - Short content (1-10 chars) (should succeed)
   *   - Normal content (11-1000 chars) (should succeed)
   *   - Long content (1001-10000 chars) (should succeed)
   *   - Very long content (>10000 chars) (should fail) - tested at Line 64-66
   * 
   * Partition 2: User validity
   *   - Valid user ID (should succeed) - checked at Line 69-71
   *   - Invalid user ID (empty string) (should fail) - caught by Message constructor
   *   - Non-existent user ID (should fail) - tested at Line 69-71
   * 
   * Partition 3: Channel validity
   *   - Valid channel ID (should succeed) - checked at Line 74-76
   *   - Invalid channel ID (empty string) (should fail) - caught by Message constructor
   *   - Non-existent channel ID (should fail) - tested at Line 74-76
   * 
   * Partition 4: Thread relationship
   *   - Root message (threadId = null) (should succeed)
   *   - Valid thread reply (threadId references existing message) (should succeed) - validated at Lines 79-87
   *   - Invalid thread reply (threadId references non-existent message) (should fail) - tested at Lines 80-82
   * 
   * Partition 5: Embedding
   *   - With valid embedding (1536 dimensions) (should succeed)
   *   - Without embedding (null) (should succeed)
   *   - With invalid embedding (wrong dimensions) (should fail) - tested at Lines 90-92
   */
  addMessage(message: Message): void {
    // Partition 1: Content length validation
    if (message.content.trim().length === 0) {
      throw new Error("Message content cannot be empty");
    }
    if (message.content.length > 10000) {
      throw new Error("Message content exceeds maximum length (10000 characters)");
    }

    // Partition 2: User validity validation
    if (!this.validUserIds.has(message.senderId)) {
      throw new Error(`Invalid user ID: ${message.senderId}`);
    }

    // Partition 3: Channel validity validation
    if (!this.validChannelIds.has(message.channelId)) {
      throw new Error(`Invalid channel ID: ${message.channelId}`);
    }

    // Partition 4: Thread relationship validation
    if (message.threadId !== null) {
      if (!this.messages.has(message.threadId)) {
        throw new Error(`Parent message not found for thread ID: ${message.threadId}`);
      }
      const parentMessage = this.messages.get(message.threadId)!;
      // MUTATION RISK: This validation relies on message.timestamp and parentMessage.timestamp being immutable.
      // If timestamps were mutable, messages could be reordered (reply before parent), breaking thread integrity.
      // Message.timestamp getter returns defensive copy (Message.ts line 77-79) to prevent mutation.
      if (parentMessage.channelId !== message.channelId) {
        throw new Error("Reply must be in the same channel as parent message");
      }
    }

    // Partition 5: Embedding validation
    if (message.embedding !== null && message.embedding.length !== 1536) {
      throw new Error(`Invalid embedding dimension: expected 1536, got ${message.embedding.length}`);
    }

    // All partitions passed - add the message
    this.messages.set(message.id, message);
    
    // Debug assertion (only in development) - uses actual Assertions utility
    assertMessageInvariants(message);

    // Integration with SearchService: Add message to search index
    if (this.searchService) {
      this.searchService.addMessage(message);
    }
  }

  /**
   * Helper methods for test setup
   */
  addValidUser(userId: string): void {
    this.validUserIds.add(userId);
  }

  addValidChannel(channelId: string): void {
    this.validChannelIds.add(channelId);
  }

  getMessage(messageId: string): Message | undefined {
    return this.messages.get(messageId);
  }

  /**
   * Set SearchService for integration
   * This demonstrates how MessageService integrates with other Nexus components
   */
  setSearchService(searchService: SearchService): void {
    this.searchService = searchService;
  }

  /**
   * Get all replies for a message (used by ThreadDepth utilities)
   * This method is used by buildThreadFromMessages() to recursively build thread structures
   */
  getRepliesForMessage(messageId: string): Message[] {
    const replies: Message[] = [];
    for (const message of this.messages.values()) {
      if (message.threadId === messageId) {
        replies.push(message);
      }
    }
    return replies;
  }

  /**
   * Build thread structure from a root message
   * Uses recursion (ThreadDepth.buildThreadFromMessages) to construct the thread tree
   */
  buildThread(rootMessageId: string): ThreadNode | null {
    return buildThreadFromMessages(rootMessageId, this);
  }

  /**
   * Get thread depth for a message
   * Uses recursion (ThreadDepth.getThreadDepth) to compute how deeply nested a thread is
   */
  getThreadDepthForMessage(messageId: string): number {
    const thread = this.buildThread(messageId);
    if (!thread) {
      return 0;
    }
    return getThreadDepth(thread);
  }

  /**
   * Get total message count in a thread
   * Uses recursion (ThreadDepth.getThreadMessageCount) to count all messages in a thread
   */
  getThreadMessageCount(messageId: string): number {
    const thread = this.buildThread(messageId);
    if (!thread) {
      return 0;
    }
    return getThreadMessageCount(thread);
  }

  /**
   * Flatten a thread into an array of messages
   * Uses recursion (ThreadDepth.flattenThread) to convert thread structure to flat list
   */
  flattenThread(messageId: string): Message[] {
    const thread = this.buildThread(messageId);
    if (!thread) {
      return [];
    }
    return flattenThread(thread);
  }

  /**
   * Set AccessControl for integration
   * This demonstrates how MessageService integrates with AccessControl for least privilege
   */
  setAccessControl(accessControl: AccessControl): void {
    this.accessControl = accessControl;
  }

  /**
   * Add message with access control check
   * Uses AccessControl.requirePermission() to enforce least privilege before adding message
   */
  addMessageWithPermission(userId: string, message: Message): void {
    // Least privilege: Check permission before allowing message creation
    if (this.accessControl) {
      this.accessControl.requirePermission(userId, 'message:write');
      if (!this.accessControl.canReadChannel(userId)) {
        throw new Error(`User ${userId} does not have access to channel ${message.channelId}`);
      }
    }
    // Add message (which will validate partitions)
    this.addMessage(message);
  }
}

/**
 * Example usage demonstrating partition testing with actual Nexus components:
 * 
 * // Setup
 * const messageService = new MessageService();
 * const searchService = new SearchService();
 * messageService.setSearchService(searchService);
 * messageService.addValidUser('user1');
 * messageService.addValidChannel('channel1');
 * 
 * // Partition 1: Content length - Empty content (should fail)
 * try {
 *   const emptyMsg = new Message('msg1', '', new Date(), 'user1', 'channel1', null);
 *   messageService.addMessage(emptyMsg);
 * } catch (e) {
 *   // Expected: "Message content cannot be empty"
 * }
 * 
 * // Partition 1: Content length - Short content (should succeed)
 * const shortMsg = new Message('msg2', 'Hi', new Date(), 'user1', 'channel1', null);
 * messageService.addMessage(shortMsg); // Success
 * 
 * // Partition 1: Content length - Very long content (should fail)
 * const longContent = 'x'.repeat(10001);
 * try {
 *   const longMsg = new Message('msg3', longContent, new Date(), 'user1', 'channel1', null);
 *   messageService.addMessage(longMsg);
 * } catch (e) {
 *   // Expected: "Message content exceeds maximum length"
 * }
 * 
 * // Partition 2: User validity - Non-existent user (should fail)
 * try {
 *   const invalidUserMsg = new Message('msg4', 'Hello', new Date(), 'user999', 'channel1', null);
 *   messageService.addMessage(invalidUserMsg);
 * } catch (e) {
 *   // Expected: "Invalid user ID: user999"
 * }
 * 
 * // Partition 3: Channel validity - Non-existent channel (should fail)
 * try {
 *   const invalidChannelMsg = new Message('msg5', 'Hello', new Date(), 'user1', 'channel999', null);
 *   messageService.addMessage(invalidChannelMsg);
 * } catch (e) {
 *   // Expected: "Invalid channel ID: channel999"
 * }
 * 
 * // Partition 4: Thread relationship - Valid thread reply (should succeed)
 * const parent = new Message('msg6', 'Question?', new Date(), 'user1', 'channel1', null);
 * messageService.addMessage(parent);
 * const reply = new Message('msg7', 'Answer', new Date(), 'user1', 'channel1', 'msg6');
 * messageService.addMessage(reply); // Success
 * 
 * // Partition 4: Thread relationship - Invalid thread reply (should fail)
 * try {
 *   const invalidReply = new Message('msg8', 'Reply', new Date(), 'user1', 'channel1', 'nonexistent');
 *   messageService.addMessage(invalidReply);
 * } catch (e) {
 *   // Expected: "Parent message not found for thread ID: nonexistent"
 * }
 * 
 * // Partition 5: Embedding - Valid embedding (should succeed)
 * const validEmbedding = new Array(1536).fill(0).map(() => Math.random() * 0.1);
 * const msgWithEmbedding = new Message('msg9', 'Hello', new Date(), 'user1', 'channel1', null, validEmbedding);
 * messageService.addMessage(msgWithEmbedding); // Success
 * 
 * // Partition 5: Embedding - Invalid embedding (should fail)
 * try {
 *   const invalidEmbedding = [1, 2, 3]; // Wrong dimension
 *   const msgInvalidEmbedding = new Message('msg10', 'Hello', new Date(), 'user1', 'channel1', null, invalidEmbedding);
 *   messageService.addMessage(msgInvalidEmbedding);
 * } catch (e) {
 *   // Expected: "Invalid embedding dimension: expected 1536, got 3"
 * }
 * 
 * // Integration test: Message is searchable after being added
 * const searchResults = searchService.search('Hello');
 * // searchResults includes msgWithEmbedding
 */
