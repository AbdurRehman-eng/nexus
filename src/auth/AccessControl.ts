/**
 * Access Control System
 * 
 * This file demonstrates:
 * 7. Least privilege access control
 */

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
}

/**
 * Example usage demonstrating least privilege:
 * 
 * const accessControl = new AccessControl();
 * 
 * // Create a regular user with minimal permissions
 * const user = accessControl.registerUser('user1', 'Alice');
 * accessControl.grantPermission('user1', 'channel:read');
 * accessControl.grantPermission('user1', 'message:write');
 * 
 * // User can read channels and write messages
 * accessControl.requirePermission('user1', 'channel:read'); // OK
 * accessControl.requirePermission('user1', 'message:write'); // OK
 * 
 * // But cannot delete messages (least privilege)
 * accessControl.requirePermission('user1', 'message:delete'); // Throws error
 * 
 * // Admin has all permissions
 * const admin = accessControl.registerUser('admin1', 'Admin');
 * accessControl.grantPermission('admin1', 'admin:all');
 * accessControl.requirePermission('admin1', 'message:delete'); // OK
 */

