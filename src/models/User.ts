/**
 * User Model
 * Basic user structure for Nexus
 */

export class User {
  private readonly _id: string;
  private readonly _username: string;
  private readonly _email: string;
  private readonly _createdAt: Date;

  constructor(id: string, username: string, email: string) {
    if (!id || id.trim().length === 0) {
      throw new Error("User ID must be non-empty");
    }
    if (!username || username.trim().length === 0) {
      throw new Error("Username must be non-empty");
    }
    if (!email || email.trim().length === 0) {
      throw new Error("Email must be non-empty");
    }

    this._id = id;
    this._username = username;
    this._email = email;
    this._createdAt = new Date();
  }

  get id(): string {
    return this._id;
  }

  get username(): string {
    return this._username;
  }

  get email(): string {
    return this._email;
  }

  get createdAt(): Date {
    return new Date(this._createdAt.getTime());
  }
}

