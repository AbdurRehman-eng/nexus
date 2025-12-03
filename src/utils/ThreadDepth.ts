/**
 * Thread Depth Computation
 * 
 * This file demonstrates:
 * 4. Using recursion to compute thread depth
 * 
 * This file shows how recursion is used in the actual Nexus codebase
 * to compute thread depth using real Message objects from MessageService.
 */

import { Message } from '../models/Message';
import { MessageService } from '../services/MessageService';

/**
 * Thread structure: A message can have replies, which can have their own replies.
 * This forms a tree structure that requires recursion to traverse.
 * 
 * Example thread:
 *   Message A (depth 0)
 *     └─ Message B (depth 1)
 *         └─ Message C (depth 2)
 *             └─ Message D (depth 3)
 */

export interface ThreadNode {
  message: Message;
  replies: ThreadNode[];
}

/**
 * Recursive function to compute the depth of a thread tree.
 * 
 * Base case: If the thread has no replies, depth is 0 (just the root message).
 * Recursive case: Depth is 1 + the maximum depth of any child thread.
 * 
 * This function is used in Nexus to determine how deeply nested a conversation
 * thread is, which helps with UI rendering and thread management.
 * 
 * @param thread The root of the thread tree
 * @returns The maximum depth of the thread (0 for a single message, 1 for a message with direct replies, etc.)
 */
export function getThreadDepth(thread: ThreadNode): number {
  // Base case: If there are no replies, the depth is 0
  // (The root message itself doesn't count toward depth)
  if (thread.replies.length === 0) {
    return 0;
  }

  // Recursive case: The depth is 1 (for this level) plus
  // the maximum depth of any child thread
  const childDepths = thread.replies.map(reply => getThreadDepth(reply));
  const maxChildDepth = Math.max(...childDepths);
  
  return 1 + maxChildDepth;
}

/**
 * Alternative recursive implementation: Count total messages in thread
 * 
 * This demonstrates another use of recursion for tree traversal.
 * Used in Nexus to show thread statistics (e.g., "5 messages in this thread").
 */
export function getThreadMessageCount(thread: ThreadNode): number {
  // Base case: The thread itself counts as 1 message
  let count = 1;

  // Recursive case: Add the count of all child threads
  for (const reply of thread.replies) {
    count += getThreadMessageCount(reply);
  }

  return count;
}

/**
 * Recursive function to find the deepest message in a thread
 * 
 * Returns the message that is furthest from the root.
 * Used in Nexus to find the most recent reply in a deeply nested thread.
 */
export function getDeepestMessage(thread: ThreadNode): Message {
  // Base case: If no replies, this is the deepest message
  if (thread.replies.length === 0) {
    return thread.message;
  }

  // Recursive case: Find the deepest message in each child thread,
  // then return the one from the deepest child
  const deepestReplies = thread.replies.map(reply => getDeepestMessage(reply));
  
  // Find which child thread has the maximum depth
  let maxDepth = -1;
  let deepestMessage = thread.message;

  for (const reply of thread.replies) {
    const depth = getThreadDepth(reply);
    if (depth > maxDepth) {
      maxDepth = depth;
      deepestMessage = getDeepestMessage(reply);
    }
  }

  return deepestMessage;
}

/**
 * Recursive function to flatten a thread into an array of messages
 * 
 * This demonstrates depth-first traversal using recursion.
 * Used in Nexus to convert thread structure into a flat list for display.
 */
export function flattenThread(thread: ThreadNode): Message[] {
  const messages: Message[] = [];

  // Add the root message
  messages.push(thread.message);

  // Recursively add all replies (depth-first)
  for (const reply of thread.replies) {
    messages.push(...flattenThread(reply));
  }

  return messages;
}

/**
 * Build thread structure from MessageService
 * 
 * This function demonstrates how recursion is used with actual Nexus components.
 * It takes messages from MessageService and builds a ThreadNode tree structure.
 */
export function buildThreadFromMessages(
  rootMessageId: string,
  messageService: MessageService
): ThreadNode | null {
  const rootMessage = messageService.getMessage(rootMessageId);
  if (!rootMessage) {
    return null;
  }

  // Base case: If this message has no replies, return a leaf node
  const thread: ThreadNode = {
    message: rootMessage,
    replies: []
  };

  // Recursive case: Find all messages that reply to this one
  // and recursively build their thread structures
  // Uses actual MessageService.getRepliesForMessage() method
  const replies = messageService.getRepliesForMessage(rootMessageId);
  for (const reply of replies) {
    const replyThread = buildThreadFromMessages(reply.id, messageService);
    if (replyThread) {
      thread.replies.push(replyThread);
    }
  }

  return thread;
}

/**
 * Example usage in Nexus:
 * 
 * // Get messages from MessageService
 * const messageService = new MessageService();
 * messageService.addValidUser('user1');
 * messageService.addValidChannel('channel1');
 * 
 * // Create a thread
 * const parent = new Message('msg1', 'Question?', new Date(), 'user1', 'channel1', null);
 * messageService.addMessage(parent);
 * 
 * const reply1 = new Message('msg2', 'Answer', new Date(), 'user1', 'channel1', 'msg1');
 * messageService.addMessage(reply1);
 * 
 * const reply2 = new Message('msg3', 'Follow-up', new Date(), 'user1', 'channel1', 'msg2');
 * messageService.addMessage(reply2);
 * 
 * // Build thread structure (would use buildThreadFromMessages in real implementation)
 * const thread: ThreadNode = {
 *   message: parent,
 *   replies: [{
 *     message: reply1,
 *     replies: [{
 *       message: reply2,
 *       replies: []
 *     }]
 *   }]
 * };
 * 
 * // Use recursion to compute depth
 * const depth = getThreadDepth(thread); // Returns 2
 * const count = getThreadMessageCount(thread); // Returns 3
 * const deepest = getDeepestMessage(thread); // Returns reply2
 * const flattened = flattenThread(thread); // Returns [parent, reply1, reply2]
 */

/**
 * Why recursion is necessary:
 * 
 * 1. Thread structure is inherently recursive (tree-like)
 * 2. Iterative solutions would require maintaining a stack manually
 * 3. Recursion naturally matches the problem structure
 * 4. Base case is clear: leaf nodes (messages with no replies)
 * 5. Recursive case is clear: process children and combine results
 * 6. Used in actual Nexus MessageService integration for thread management
 */
