import Realm from 'realm';

/**
 * Realm Note Schema
 * Matches the TDD_React_Native.md specification (Section 6: Data & Offline Sync)
 */
export class Note extends Realm.Object<Note> {
  _id!: Realm.BSON.ObjectId;
  id!: string; // Custom string ID for app logic
  apiId?: string; // Server's MongoDB _id (set after successful sync to API)
  name!: string; // Note title (max 50 chars)
  content!: string; // Plain text content (max 500 chars)
  formattedContent!: string; // HTML formatted content
  createdBy!: string; // User identifier (default: "Anonymous User")
  createdAt!: Date;
  updatedAt!: Date;
  isDeleted!: boolean; // Soft delete flag
  isSynced!: boolean; // Sync status flag

  static schema: Realm.ObjectSchema = {
    name: 'Note',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      id: { type: 'string', indexed: true },
      apiId: { type: 'string', optional: true, indexed: true }, // Optional - populated after API sync
      name: { type: 'string', indexed: true }, // Indexed for search/duplicate check
      content: 'string',
      formattedContent: 'string',
      createdBy: { type: 'string', default: 'Anonymous User' },
      createdAt: { type: 'date', indexed: true }, // Indexed for sorting
      updatedAt: 'date',
      isDeleted: { type: 'bool', default: false, indexed: true }, // Indexed for filtering
      isSynced: { type: 'bool', default: false, indexed: true }, // Indexed for sync queries
    },
  };
}
