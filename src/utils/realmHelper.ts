import Realm from 'realm';
import { getRealm } from '../models';
import { Note } from '../models/Note';
import { NoteState } from '../types';

// Re-export getRealm and Realm for use in other modules
export { getRealm, Realm };

/**
 * Convert Realm Note object to app NoteState
 */
const mapRealmNoteToState = (realmNote: Note): NoteState => {
  return {
    id: realmNote.id,
    apiId: realmNote.apiId,
    title: realmNote.name,
    name: realmNote.name, // Include name field for API compatibility
    content: realmNote.content, // Plain text content
    formattedContent: realmNote.formattedContent, // HTML formatted content
    createdAt: realmNote.createdAt,
    updatedAt: realmNote.updatedAt,
    isSynced: realmNote.isSynced,
  };
};

/**
 * Get all active (non-deleted) notes, sorted by newest first
 */
export const getAllNotes = (): NoteState[] => {
  try {
    const realm = getRealm();
    const notes = realm
      .objects<Note>('Note')
      .filtered('isDeleted == false')
      .sorted('createdAt', true); // Descending order (newest first)

    return Array.from(notes).map(mapRealmNoteToState);
  } catch (error) {
    console.error('❌ Error fetching notes from Realm:', error);
    return [];
  }
};

/**
 * Get paginated notes from Realm
 * @param page - Page number (1-indexed)
 * @param limit - Number of notes per page
 * @returns Paginated notes array
 */
export const getPaginatedNotes = (page: number = 1, limit: number = 20): NoteState[] => {
  try {
    const realm = getRealm();
    const offset = (page - 1) * limit;

    const allNotes = realm
      .objects<Note>('Note')
      .filtered('isDeleted == false')
      .sorted('createdAt', true); // Descending order (newest first)

    // Slice the results for pagination
    const paginatedNotes = allNotes.slice(offset, offset + limit);

    return Array.from(paginatedNotes).map(mapRealmNoteToState);
  } catch (error) {
    console.error('❌ Error fetching paginated notes from Realm:', error);
    return [];
  }
};

/**
 * Get total count of active notes
 */
export const getTotalNotesCount = (): number => {
  try {
    const realm = getRealm();
    return realm.objects<Note>('Note').filtered('isDeleted == false').length;
  } catch (error) {
    console.error('❌ Error getting total notes count:', error);
    return 0;
  }
};

/**
 * Get a single note by ID
 */
export const getNoteById = (noteId: string): NoteState | null => {
  try {
    const realm = getRealm();
    const note = realm
      .objects<Note>('Note')
      .filtered('id == $0 AND isDeleted == false', noteId)[0];

    return note ? mapRealmNoteToState(note) : null;
  } catch (error) {
    console.error('❌ Error fetching note by ID:', error);
    return null;
  }
};

/**
 * Create a new note in Realm
 */
export const createNote = (noteData: {
  title: string;
  content: string;
  formattedContent: string;
}): NoteState => {
  const realm = getRealm();
  let newNote: Note;

  realm.write(() => {
    const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    newNote = realm.create<Note>('Note', {
      _id: new Realm.BSON.ObjectId(),
      id: noteId,
      name: noteData.title,
      content: noteData.content,
      formattedContent: noteData.formattedContent,
      createdBy: 'Anonymous User',
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
      isSynced: false, // Not synced to server yet
    });
  });

  return mapRealmNoteToState(newNote!);
};

/**
 * Update an existing note
 */
export const updateNote = (
  noteId: string,
  updates: {
    title?: string;
    content?: string;
    formattedContent?: string;
  }
): NoteState | null => {
  try {
    const realm = getRealm();
    const note = realm
      .objects<Note>('Note')
      .filtered('id == $0 AND isDeleted == false', noteId)[0];

    if (!note) {
      console.warn('⚠️ Note not found for update:', noteId);
      return null;
    }

    realm.write(() => {
      if (updates.title !== undefined) {
        note.name = updates.title;
      }
      if (updates.content !== undefined) {
        note.content = updates.content;
      }
      if (updates.formattedContent !== undefined) {
        note.formattedContent = updates.formattedContent;
      }
      note.updatedAt = new Date();
      note.isSynced = false; // Mark as unsynced after update
    });

    return mapRealmNoteToState(note);
  } catch (error) {
    console.error('❌ Error updating note:', error);
    return null;
  }
};

/**
 * Soft delete a note (sets isDeleted flag)
 */
export const deleteNote = (noteId: string): boolean => {
  try {
    const realm = getRealm();
    const note = realm
      .objects<Note>('Note')
      .filtered('id == $0 AND isDeleted == false', noteId)[0];

    if (!note) {
      console.warn('⚠️ Note not found for deletion:', noteId);
      return false;
    }

    realm.write(() => {
      note.isDeleted = true;
      note.updatedAt = new Date();
      note.isSynced = false; // Mark as unsynced to propagate deletion to server
    });

    console.log('✅ Note soft deleted:', noteId);
    return true;
  } catch (error) {
    console.error('❌ Error deleting note:', error);
    return false;
  }
};

/**
 * Check if a note name already exists (case-insensitive)
 * Excludes the specified noteId (for update validation)
 */
export const checkDuplicateName = (
  name: string,
  excludeNoteId?: string
): boolean => {
  try {
    const realm = getRealm();
    let query = 'name ==[c] $0 AND isDeleted == false'; // [c] = case insensitive
    const params: any[] = [name];

    if (excludeNoteId) {
      query += ' AND id != $1';
      params.push(excludeNoteId);
    }

    const existingNote = realm
      .objects<Note>('Note')
      .filtered(query, ...params)[0];

    return !!existingNote;
  } catch (error) {
    console.error('❌ Error checking duplicate name:', error);
    return false;
  }
};

/**
 * Get all unsynced notes (for sync queue)
 */
export const getUnsyncedNotes = (): NoteState[] => {
  try {
    const realm = getRealm();
    const notes = realm
      .objects<Note>('Note')
      .filtered('isSynced == false')
      .sorted('createdAt', false); // Ascending order (oldest first for sync)

    return Array.from(notes).map(mapRealmNoteToState);
  } catch (error) {
    console.error('❌ Error fetching unsynced notes:', error);
    return [];
  }
};

/**
 * Mark a note as synced and store API ID
 */
export const markNoteAsSynced = (noteId: string, apiId?: string): boolean => {
  try {
    const realm = getRealm();
    const note = realm.objects<Note>('Note').filtered('id == $0', noteId)[0];

    if (!note) {
      console.warn('⚠️ Note not found for sync update:', noteId);
      return false;
    }

    realm.write(() => {
      note.isSynced = true;
      note.updatedAt = new Date();
      if (apiId) {
        note.apiId = apiId; // Store API's _id for future operations
      }
    });

    console.log('✅ Note marked as synced:', noteId, apiId ? `(API ID: ${apiId})` : '');
    return true;
  } catch (error) {
    console.error('❌ Error marking note as synced:', error);
    return false;
  }
};

/**
 * Get API ID for a local note ID
 */
export const getApiIdByLocalId = (noteId: string): string | null => {
  try {
    const realm = getRealm();
    const note = realm.objects<Note>('Note').filtered('id == $0', noteId)[0];

    if (!note) {
      console.warn('⚠️ Note not found:', noteId);
      return null;
    }

    return note.apiId || null;
  } catch (error) {
    console.error('❌ Error getting API ID:', error);
    return null;
  }
};

/**
 * Get total note count (excluding deleted)
 */
export const getNotesCount = (): number => {
  try {
    const realm = getRealm();
    return realm.objects<Note>('Note').filtered('isDeleted == false').length;
  } catch (error) {
    console.error('❌ Error getting notes count:', error);
    return 0;
  }
};

/**
 * Get unsynced notes count
 */
export const getUnsyncedNotesCount = (): number => {
  try {
    const realm = getRealm();
    return realm.objects<Note>('Note').filtered('isSynced == false').length;
  } catch (error) {
    console.error('❌ Error getting unsynced notes count:', error);
    return 0;
  }
};
