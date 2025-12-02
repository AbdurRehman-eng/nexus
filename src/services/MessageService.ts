/**
 * Message Service
 * 
 * This file demonstrates:
 * 6. Partition testing for addMessage()
 */

import { Message } from '../models/Message';
import { assertMessageInvariants } from '../utils/Assertions';

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
  private validChannelIds: Set<string> = new Set();

  /**
   * addMessage(message: Message): void
   * 
   * Partition test cases:
   * 
   * Partition 1: Content length
   *   - Empty content (should fail)
   *   - Short content (1-10 chars) (should succeed)
   *   - Normal content (11-1000 chars) (should succeed)
   *   - Long content (1001-10000 chars) (should succeed)
   *   - Very long content (>10000 chars) (should fail or truncate)
   * 
   * Partition 2: User validity
   *   - Valid user ID (should succeed)
   *   - Invalid user ID (empty string) (should fail)
   *   - Non-existent user ID (should fail)
   * 
   * Partition 3: Channel validity
   *   - Valid channel ID (should succeed)
   *   - Invalid channel ID (empty string) (should fail)
   *   - Non-existent channel ID (should fail)
   * 
   * Partition 4: Thread relationship
   *   - Root message (threadId = null) (should succeed)
   *   - Valid thread reply (threadId references existing message) (should succeed)
   *   - Invalid thread reply (threadId references non-existent message) (should fail)
   * 
   * Partition 5: Embedding
   *   - With valid embedding (1536 dimensions) (should succeed)
   *   - Without embedding (null) (should succeed)
   *   - With invalid embedding (wrong dimensions) (should fail)
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
    
    // Debug assertion (only in development)
    assertMessageInvariants(message);
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
}

/**
 * Example test cases demonstrating partition testing:
 * 
 * // Partition 1: Content length
 * test('addMessage with empty content should fail', () => {
 *   const service = new MessageService();
 *   const message = new Message(..., '', ...);
 *   expect(() => service.addMessage(message)).toThrow();
 * });
 * 
 * test('addMessage with short content should succeed', () => {
 *   const service = new MessageService();
 *   service.addValidUser('user1');
 *   service.addValidChannel('channel1');
 *   const message = new Message(..., 'Hi', ...);
 *   expect(() => service.addMessage(message)).not.toThrow();
 * });
 * 
 * // Partition 2: User validity
 * test('addMessage with invalid user should fail', () => {
 *   const service = new MessageService();
 *   const message = new Message(..., 'user999', ...);
 *   expect(() => service.addMessage(message)).toThrow();
 * });
 * 
 * // Partition 3: Channel validity
 * test('addMessage with invalid channel should fail', () => {
 *   const service = new MessageService();
 *   service.addValidUser('user1');
 *   const message = new Message(..., 'channel999', ...);
 *   expect(() => service.addMessage(message)).toThrow();
 * });
 * 
 * // Partition 4: Thread relationship
 * test('addMessage with valid thread reply should succeed', () => {
 *   const service = new MessageService();
 *   service.addValidUser('user1');
 *   service.addValidChannel('channel1');
 *   const parent = new Message('msg1', ..., null);
 *   service.addMessage(parent);
 *   const reply = new Message('msg2', ..., 'msg1');
 *   expect(() => service.addMessage(reply)).not.toThrow();
 * });
 * 
 * // Partition 5: Embedding
 * test('addMessage with invalid embedding should fail', () => {
 *   const service = new MessageService();
 *   service.addValidUser('user1');
 *   service.addValidChannel('channel1');
 *   const message = new Message(..., null, [1, 2, 3]); // Wrong dimension
 *   expect(() => service.addMessage(message)).toThrow();
 * });
 */

