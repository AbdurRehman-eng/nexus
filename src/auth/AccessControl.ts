/**
 * Access Control System
 * 
 * This file demonstrates:
 * 7. Least privilege access control
 * 
 * This file shows how least privilege is implemented in the actual Nexus codebase
 * and integrated with MessageService and other components.
 */

import { MessageService } from '../services/MessageService';
import { Message } from '../models/Message';

/**
 * Least Privilege Principle:
 * Users should only be granted the minimum permissions necessary
 * to perform their required tasks.
 * 
 * This system implements fine-grained permissions that can be
 * granted individually, rather than all-or-nothing access.
 */

export type Permission =
  | 'channel:read'
  | 'channel:write'
  | 'channel:delete'
  | 'channel:manage'
  | 'message:read'
  | 'message:write'
  | 'message:delete'
  | 'message:edit'
  | 'user:read'
  | 'user:manage'
  | 'admin:all';

export interface User {
  id: string;
  username: string;
  permissions: Set<Permission>;
}

/**
 * AccessControl enforces least privilege by:
 * 1. Requiring explicit permission checks for each action
 * 2. Granting only specific permissions, not broad access
 * 3. Denying by default (no permission = no access)
 */
export class AccessControl {
  private users: Map<string, User> = new Map();

  /**
   * requirePermission: Enforces least privilege
   * 
   * Users must have the EXACT permission requested.
   * Having 'admin:all' grants all permissions, but regular users
   * must have the specific permission.
   * 
   * Used throughout Nexus before allowing operations.
   */
  requirePermission(userId: string, permission: Permission): void {
    const user = this.users.get(userId);
    
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Least privilege: Check for exact permission or admin override
    const hasPermission = 
      user.permissions.has(permission) || 
      user.permissions.has('admin:all');

    if (!hasPermission) {
      throw new Error(
        `Access denied: User ${userId} does not have permission '${permission}'`
      );
    }
  }

  /**
   * grantPermission: Grants a specific permission (least privilege)
   * 
   * Only grants the exact permission requested, not broader access.
   */
  grantPermission(userId: string, permission: Permission): void {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    user.permissions.add(permission);
  }

  /**
   * revokePermission: Revokes a specific permission
   * 
   * Implements least privilege by allowing fine-grained permission removal.
   */
  revokePermission(userId: string, permission: Permission): void {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    user.permissions.delete(permission);
  }

  /**
   * hasPermission: Checks if user has a specific permission
   * 
   * Returns true only if user has the exact permission or admin:all.
   */
  hasPermission(userId: string, permission: Permission): boolean {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }
    return user.permissions.has(permission) || user.permissions.has('admin:all');
  }

  /**
   * registerUser: Creates a new user with minimal default permissions
   * 
   * Least privilege: New users get NO permissions by default.
   * Permissions must be explicitly granted.
   */
  registerUser(userId: string, username: string): User {
    const user: User = {
      id: userId,
      username,
      permissions: new Set() // Least privilege: empty set by default
    };
    this.users.set(userId, user);
    return user;
  }

  /**
   * Example: Channel read access
   * 
   * Users need 'channel:read' to view messages in a channel.
   * They don't automatically get 'channel:write' or 'channel:delete'.
   */
  canReadChannel(userId: string): boolean {
    return this.hasPermission(userId, 'channel:read');
  }

  /**
   * Example: Message write access
   * 
   * Users need 'message:write' to send messages.
   * They don't automatically get 'message:delete' or 'message:edit'.
   */
  canWriteMessage(userId: string): boolean {
    return this.hasPermission(userId, 'message:write');
  }

  /**
   * Example: Message deletion
   * 
   * Users need 'message:delete' to delete messages.
   * Having 'message:write' doesn't grant delete permission.
   */
  canDeleteMessage(userId: string): boolean {
    return this.hasPermission(userId, 'message:delete');
  }

  /**
   * Secure message creation with permission check
   * 
   * This demonstrates how AccessControl integrates with MessageService
   * to enforce least privilege in actual Nexus operations.
   */
  createMessageSecurely(
    userId: string,
    messageService: MessageService,
    content: string,
    channelId: string,
    threadId: string | null = null
  ): Message {
    // Least privilege: Check for exact permission
    this.requirePermission(userId, 'message:write');
    
    // Additional check: User must have channel access
    if (!this.canReadChannel(userId)) {
      throw new Error(`User ${userId} does not have access to channel ${channelId}`);
    }

    // Create message with actual Message constructor
    const message = new Message(
      `msg-${Date.now()}`,
      content,
      new Date(),
      userId,
      channelId,
      threadId,
      null
    );

    // Add to MessageService (which will validate partitions)
    messageService.addMessage(message);
    
    return message;
  }

  /**
   * Secure message deletion with permission check
   * 
   * Demonstrates least privilege: delete permission is separate from write permission.
   */
  deleteMessageSecurely(
    userId: string,
    messageService: MessageService,
    messageId: string
  ): void {
    // Least privilege: Check for exact permission (different from write)
    this.requirePermission(userId, 'message:delete');
    
    const message = messageService.getMessage(messageId);
    if (!message) {
      throw new Error(`Message not found: ${messageId}`);
    }

    // Additional check: Users can only delete their own messages unless they have admin:all
    if (message.senderId !== userId && !this.hasPermission(userId, 'admin:all')) {
      throw new Error(`User ${userId} cannot delete message from user ${message.senderId}`);
    }

    // In real implementation, would remove from MessageService
    // messageService.deleteMessage(messageId);
  }
}

/**
 * Example usage demonstrating least privilege with actual Nexus components:
 * 
 * // Setup
 * const accessControl = new AccessControl();
 * const messageService = new MessageService();
 * messageService.addValidUser('user1');
 * messageService.addValidUser('user2');
 * messageService.addValidChannel('channel1');
 * 
 * // Create a regular user with minimal permissions (least privilege)
 * const user = accessControl.registerUser('user1', 'Alice');
 * accessControl.grantPermission('user1', 'channel:read');
 * accessControl.grantPermission('user1', 'message:write');
 * // Note: user1 does NOT have 'message:delete' permission
 * 
 * // User can read channels and write messages
 * accessControl.requirePermission('user1', 'channel:read'); // OK
 * accessControl.requirePermission('user1', 'message:write'); // OK
 * 
 * // User can create messages (integration with MessageService)
 * const message = accessControl.createMessageSecurely(
 *   'user1',
 *   messageService,
 *   'Hello, world!',
 *   'channel1',
 *   null
 * ); // Success
 * 
 * // But cannot delete messages (least privilege)
 * try {
 *   accessControl.deleteMessageSecurely('user1', messageService, message.id);
 * } catch (e) {
 *   // Expected: "Access denied: User user1 does not have permission 'message:delete'"
 * }
 * 
 * // Admin has all permissions
 * const admin = accessControl.registerUser('admin1', 'Admin');
 * accessControl.grantPermission('admin1', 'admin:all');
 * accessControl.requirePermission('admin1', 'message:delete'); // OK
 * 
 * // Admin can delete any message
 * accessControl.deleteMessageSecurely('admin1', messageService, message.id); // Success
 * 
 * // Demonstrate least privilege: user2 has no permissions by default
 * const user2 = accessControl.registerUser('user2', 'Bob');
 * try {
 *   accessControl.createMessageSecurely('user2', messageService, 'Hi', 'channel1', null);
 * } catch (e) {
 *   // Expected: "Access denied: User user2 does not have permission 'message:write'"
 * }
 */
