/**
 * Channel Model
 * Basic channel structure for Nexus
 */

export class Channel {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _description: string;
  private readonly _createdAt: Date;

  constructor(id: string, name: string, description: string = '') {
    if (!id || id.trim().length === 0) {
      throw new Error("Channel ID must be non-empty");
    }
    if (!name || name.trim().length === 0) {
      throw new Error("Channel name must be non-empty");
    }

    this._id = id;
    this._name = name;
    this._description = description;
    this._createdAt = new Date();
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get createdAt(): Date {
    return new Date(this._createdAt.getTime());
  }
}

