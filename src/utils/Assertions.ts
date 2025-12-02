/**
 * Assertions for Debugging
 * 
 * This file demonstrates:
 * 5. Assertions for debugging (e.g., checking embedding dimensions)
 */

import { Message } from '../models/Message';

/**
 * Assertion: Check embedding dimensions
 * 
 * Embeddings must be exactly 1536 dimensions for semantic search to work.
 * This assertion catches bugs early in development.
 */
export function validateEmbedding(embedding: number[] | null): void {
  if (embedding === null) {
    return; // Null embeddings are allowed (optional field)
  }

  // Assertion: Embedding must be exactly 1536 dimensions
  console.assert(
    embedding.length === 1536,
    `Invalid embedding dimension: expected 1536, got ${embedding.length}`
  );

  // Additional assertion: All values should be numbers
  console.assert(
    embedding.every(val => typeof val === 'number' && !isNaN(val)),
    "Embedding contains invalid values (NaN or non-number)"
  );

  // Additional assertion: Values should be in reasonable range
  // (Embeddings are typically normalized, so values should be between -1 and 1)
  console.assert(
    embedding.every(val => val >= -10 && val <= 10),
    "Embedding values out of expected range"
  );
}

/**
 * Assertion: Check message invariants
 * 
 * Validates that a message satisfies its representation invariants.
 */
export function assertMessageInvariants(message: Message): void {
  // RI: Message ID must be non-empty
  console.assert(
    message.id && message.id.trim().length > 0,
    "Message ID must be non-empty"
  );

  // RI: Content must be non-empty
  console.assert(
    message.content && message.content.trim().length > 0,
    "Message content must be non-empty"
  );

  // RI: Timestamp must be valid Date
  console.assert(
    message.timestamp instanceof Date && !isNaN(message.timestamp.getTime()),
    "Message timestamp must be a valid Date"
  );

  // RI: Sender ID must be valid
  console.assert(
    message.senderId && message.senderId.trim().length > 0,
    "Sender ID must be non-empty"
  );

  // RI: Channel ID must be valid
  console.assert(
    message.channelId && message.channelId.trim().length > 0,
    "Channel ID must be non-empty"
  );

  // RI: If threadId exists, it must be non-empty
  if (message.threadId !== null) {
    console.assert(
      message.threadId.trim().length > 0,
      "Thread ID must be non-empty if present"
    );
  }

  // RI: Embedding must be exactly 1536 dimensions if present
  if (message.embedding !== null) {
    console.assert(
      message.embedding.length === 1536,
      `Embedding must be exactly 1536 dimensions, got ${message.embedding.length}`
    );
  }
}

/**
 * Assertion: Check search query validity
 */
export function assertSearchQuery(query: string): void {
  console.assert(
    typeof query === 'string',
    `Search query must be a string, got ${typeof query}`
  );

  console.assert(
    query.length > 0,
    "Search query must be non-empty"
  );

  console.assert(
    query.length <= 1000,
    `Search query too long: ${query.length} characters (max 1000)`
  );
}

/**
 * Assertion: Check thread structure validity
 */
export function assertThreadStructure(
  threadId: string,
  parentMessage: Message | null,
  replyMessage: Message
): void {
  // Assertion: Parent message must exist if threadId is provided
  console.assert(
    parentMessage !== null,
    `Parent message not found for thread ID: ${threadId}`
  );

  if (parentMessage) {
    // Assertion: Reply must be in the same channel as parent
    console.assert(
      replyMessage.channelId === parentMessage.channelId,
      `Reply channel (${replyMessage.channelId}) must match parent channel (${parentMessage.channelId})`
    );

    // Assertion: Reply timestamp must be after parent timestamp
    console.assert(
      replyMessage.timestamp.getTime() >= parentMessage.timestamp.getTime(),
      "Reply timestamp must be after or equal to parent timestamp"
    );
  }
}

/**
 * Assertion: Check user permissions
 */
export function assertUserPermission(
  userId: string,
  permission: string,
  hasPermission: boolean
): void {
  console.assert(
    userId && userId.trim().length > 0,
    "User ID must be non-empty"
  );

  console.assert(
    permission && permission.trim().length > 0,
    "Permission must be non-empty"
  );

  console.assert(
    hasPermission,
    `User ${userId} does not have permission: ${permission}`
  );
}

/**
 * Assertion: Check channel access
 */
export function assertChannelAccess(
  userId: string,
  channelId: string,
  hasAccess: boolean
): void {
  console.assert(
    hasAccess,
    `User ${userId} does not have access to channel ${channelId}`
  );
}

/**
 * Development-only assertion helper
 * 
 * In production, assertions are typically disabled for performance.
 * This helper allows conditional assertion execution.
 */
export function devAssert(condition: boolean, message: string): void {
  if (process.env.NODE_ENV !== 'production') {
    console.assert(condition, message);
  }
}

/**
 * Example usage in message creation:
 * 
 * const message = new Message(...);
 * assertMessageInvariants(message);
 * validateEmbedding(message.embedding);
 * 
 * Example usage in search:
 * 
 * assertSearchQuery(query);
 * const results = searchService.search(query);
 * 
 * Example usage in threading:
 * 
 * assertThreadStructure(threadId, parentMessage, replyMessage);
 */

