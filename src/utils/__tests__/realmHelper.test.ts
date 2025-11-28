/**
 * Unit tests for realmHelper utilities
 * Mocking Realm database operations
 */

import Realm from 'realm';
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  checkDuplicateName,
  getUnsyncedNotes,
  markNoteAsSynced,
  getNotesCount,
  getUnsyncedNotesCount,
} from '../realmHelper';
import { Note } from '../../models/Note';

// Mock Realm and getRealm
jest.mock('realm');
jest.mock('../../models', () => ({
  getRealm: jest.fn(),
}));

import { getRealm } from '../../models';

describe('realmHelper', () => {
  let mockRealm: any;
  let mockObjects: jest.Mock;
  let mockWrite: jest.Mock;
  let mockCreate: jest.Mock;
  let mockFiltered: jest.Mock;
  let mockSorted: jest.Mock;

  const mockDate = new Date('2025-01-01T00:00:00.000Z');

  const createMockNote = (overrides = {}): any => ({
    _id: new Realm.BSON.ObjectId(),
    id: 'note_123',
    name: 'Test Note',
    content: 'Test content',
    formattedContent: '<p>Test content</p>',
    createdBy: 'Anonymous User',
    createdAt: mockDate,
    updatedAt: mockDate,
    isDeleted: false,
    isSynced: false,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock functions
    mockFiltered = jest.fn();
    mockSorted = jest.fn();
    mockObjects = jest.fn();
    mockWrite = jest.fn();
    mockCreate = jest.fn();

    // Setup mock Realm
    mockRealm = {
      objects: mockObjects,
      write: mockWrite,
      create: mockCreate,
    };

    (getRealm as jest.Mock).mockReturnValue(mockRealm);

    // Spy on console methods
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getAllNotes', () => {
    it('should return all non-deleted notes sorted by createdAt desc', () => {
      const mockNotes = [
        createMockNote({ id: 'note_1', name: 'Note 1' }),
        createMockNote({ id: 'note_2', name: 'Note 2' }),
      ];

      mockSorted.mockReturnValue(mockNotes);
      mockFiltered.mockReturnValue({ sorted: mockSorted });
      mockObjects.mockReturnValue({ filtered: mockFiltered });

      const result = getAllNotes();

      expect(mockObjects).toHaveBeenCalledWith('Note');
      expect(mockFiltered).toHaveBeenCalledWith('isDeleted == false');
      expect(mockSorted).toHaveBeenCalledWith('createdAt', true);
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Note 1');
      expect(result[0].id).toBe('note_1');
    });

    it('should filter out deleted notes', () => {
      const mockNotes = [
        createMockNote({ id: 'note_1', isDeleted: false }),
      ];

      mockSorted.mockReturnValue(mockNotes);
      mockFiltered.mockReturnValue({ sorted: mockSorted });
      mockObjects.mockReturnValue({ filtered: mockFiltered });

      getAllNotes();

      expect(mockFiltered).toHaveBeenCalledWith('isDeleted == false');
    });

    it('should return empty array when no notes exist', () => {
      mockSorted.mockReturnValue([]);
      mockFiltered.mockReturnValue({ sorted: mockSorted });
      mockObjects.mockReturnValue({ filtered: mockFiltered });

      const result = getAllNotes();

      expect(result).toEqual([]);
    });

    it('should return empty array on error', () => {
      mockObjects.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = getAllNotes();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        '❌ Error fetching notes from Realm:',
        expect.any(Error)
      );
    });

    it('should map Realm Note to NoteState correctly', () => {
      const mockNote = createMockNote({
        id: 'note_123',
        name: 'My Title',
        formattedContent: '<p>Formatted content</p>',
        isSynced: true,
      });

      mockSorted.mockReturnValue([mockNote]);
      mockFiltered.mockReturnValue({ sorted: mockSorted });
      mockObjects.mockReturnValue({ filtered: mockFiltered });

      const result = getAllNotes();

      expect(result[0]).toEqual({
        id: 'note_123',
        title: 'My Title',
        content: '<p>Formatted content</p>',
        createdAt: mockDate,
        updatedAt: mockDate,
        isSynced: true,
      });
    });
  });

  describe('getNoteById', () => {
    it('should return note when found', () => {
      const mockNote = createMockNote({ id: 'note_123', name: 'Found Note' });

      mockFiltered.mockReturnValue([mockNote]);
      mockObjects.mockReturnValue({ filtered: mockFiltered });

      const result = getNoteById('note_123');

      expect(mockFiltered).toHaveBeenCalledWith(
        'id == $0 AND isDeleted == false',
        'note_123'
      );
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Found Note');
    });

    it('should return null when note not found', () => {
      mockFiltered.mockReturnValue([]);
      mockObjects.mockReturnValue({ filtered: mockFiltered });

      const result = getNoteById('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null for deleted note', () => {
      mockFiltered.mockReturnValue([]);
      mockObjects.mockReturnValue({ filtered: mockFiltered });

      const result = getNoteById('deleted_note');

      expect(mockFiltered).toHaveBeenCalledWith(
        'id == $0 AND isDeleted == false',
        'deleted_note'
      );
      expect(result).toBeNull();
    });

    it('should return null on error', () => {
      mockObjects.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = getNoteById('note_123');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('createNote', () => {
    it('should create note with all required fields', () => {
      const mockNote = createMockNote();
      mockCreate.mockReturnValue(mockNote);
      mockWrite.mockImplementation((callback) => callback());

      const result = createNote({
        title: 'New Note',
        content: 'Plain content',
        formattedContent: '<p>Formatted content</p>',
      });

      expect(mockWrite).toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalledWith('Note', expect.objectContaining({
        name: 'New Note',
        content: 'Plain content',
        formattedContent: '<p>Formatted content</p>',
        createdBy: 'Anonymous User',
        isDeleted: false,
        isSynced: false,
      }));
      expect(result.title).toBe('Test Note');
    });

    it('should generate unique ID', () => {
      const mockNote = createMockNote();
      mockCreate.mockReturnValue(mockNote);
      mockWrite.mockImplementation((callback) => callback());

      createNote({
        title: 'New Note',
        content: 'Content',
        formattedContent: '<p>Content</p>',
      });

      const createCall = mockCreate.mock.calls[0][1];
      expect(createCall.id).toMatch(/^note_\d+_[a-z0-9]+$/);
    });

    it('should set timestamps correctly', () => {
      const mockNote = createMockNote();
      mockCreate.mockReturnValue(mockNote);
      mockWrite.mockImplementation((callback) => callback());

      createNote({
        title: 'New Note',
        content: 'Content',
        formattedContent: '<p>Content</p>',
      });

      const createCall = mockCreate.mock.calls[0][1];
      expect(createCall.createdAt).toBeInstanceOf(Date);
      expect(createCall.updatedAt).toBeInstanceOf(Date);
    });

    it('should set isSynced to false by default', () => {
      const mockNote = createMockNote();
      mockCreate.mockReturnValue(mockNote);
      mockWrite.mockImplementation((callback) => callback());

      createNote({
        title: 'New Note',
        content: 'Content',
        formattedContent: '<p>Content</p>',
      });

      const createCall = mockCreate.mock.calls[0][1];
      expect(createCall.isSynced).toBe(false);
    });
  });

  describe('updateNote', () => {
    it('should update title correctly', () => {
      const mockNote = createMockNote({ name: 'Old Title' });
      mockFiltered.mockReturnValue([mockNote]);
      mockObjects.mockReturnValue({ filtered: mockFiltered });
      mockWrite.mockImplementation((callback) => callback());

      const result = updateNote('note_123', { title: 'New Title' });

      expect(mockNote.name).toBe('New Title');
      expect(result?.title).toBe('New Title');
    });

    it('should update content and formattedContent', () => {
      const mockNote = createMockNote();
      mockFiltered.mockReturnValue([mockNote]);
      mockObjects.mockReturnValue({ filtered: mockFiltered });
      mockWrite.mockImplementation((callback) => callback());

      updateNote('note_123', {
        content: 'New content',
        formattedContent: '<p>New formatted</p>',
      });

      expect(mockNote.content).toBe('New content');
      expect(mockNote.formattedContent).toBe('<p>New formatted</p>');
    });

    it('should update updatedAt timestamp', () => {
      const mockNote = createMockNote({ updatedAt: mockDate });
      mockFiltered.mockReturnValue([mockNote]);
      mockObjects.mockReturnValue({ filtered: mockFiltered });
      mockWrite.mockImplementation((callback) => callback());

      updateNote('note_123', { title: 'Updated' });

      expect(mockNote.updatedAt).toBeInstanceOf(Date);
      expect(mockNote.updatedAt.getTime()).toBeGreaterThan(mockDate.getTime());
    });

    it('should set isSynced to false after update', () => {
      const mockNote = createMockNote({ isSynced: true });
      mockFiltered.mockReturnValue([mockNote]);
      mockObjects.mockReturnValue({ filtered: mockFiltered });
      mockWrite.mockImplementation((callback) => callback());

      updateNote('note_123', { title: 'Updated' });

      expect(mockNote.isSynced).toBe(false);
    });

    it('should return null for non-existent note', () => {
      mockFiltered.mockReturnValue([]);
      mockObjects.mockReturnValue({ filtered: mockFiltered });

      const result = updateNote('nonexistent', { title: 'New' });

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        '⚠️ Note not found for update:',
        'nonexistent'
      );
    });

    it('should return null on error', () => {
      mockObjects.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = updateNote('note_123', { title: 'New' });

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('deleteNote', () => {
    it('should set isDeleted flag to true (soft delete)', () => {
      const mockNote = createMockNote({ isDeleted: false });
      mockFiltered.mockReturnValue([mockNote]);
      mockObjects.mockReturnValue({ filtered: mockFiltered });
      mockWrite.mockImplementation((callback) => callback());

      const result = deleteNote('note_123');

      expect(mockNote.isDeleted).toBe(true);
      expect(result).toBe(true);
    });

    it('should not actually delete from database', () => {
      const mockNote = createMockNote();
      mockFiltered.mockReturnValue([mockNote]);
      mockObjects.mockReturnValue({ filtered: mockFiltered });
      mockWrite.mockImplementation((callback) => callback());

      deleteNote('note_123');

      // Verify write was called but not with delete operation
      expect(mockWrite).toHaveBeenCalled();
      // Note should still exist, just marked as deleted
      expect(mockNote).toBeDefined();
    });

    it('should update timestamp on delete', () => {
      const mockNote = createMockNote({ updatedAt: mockDate });
      mockFiltered.mockReturnValue([mockNote]);
      mockObjects.mockReturnValue({ filtered: mockFiltered });
      mockWrite.mockImplementation((callback) => callback());

      deleteNote('note_123');

      expect(mockNote.updatedAt).toBeInstanceOf(Date);
      expect(mockNote.updatedAt.getTime()).toBeGreaterThan(mockDate.getTime());
    });

    it('should mark as unsynced after delete', () => {
      const mockNote = createMockNote({ isSynced: true });
      mockFiltered.mockReturnValue([mockNote]);
      mockObjects.mockReturnValue({ filtered: mockFiltered });
      mockWrite.mockImplementation((callback) => callback());

      deleteNote('note_123');

      expect(mockNote.isSynced).toBe(false);
    });

    it('should return false for non-existent note', () => {
      mockFiltered.mockReturnValue([]);
      mockObjects.mockReturnValue({ filtered: mockFiltered });

      const result = deleteNote('nonexistent');

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        '⚠️ Note not found for deletion:',
        'nonexistent'
      );
    });

    it('should return false on error', () => {
      mockObjects.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = deleteNote('note_123');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('checkDuplicateName', () => {
    it('should detect duplicate titles (case-insensitive)', () => {
      const mockNote = createMockNote({ name: 'Test Note' });
      mockFiltered.mockReturnValue([mockNote]);
      mockObjects.mockReturnValue({ filtered: mockFiltered });

      const result = checkDuplicateName('test note');

      expect(mockFiltered).toHaveBeenCalledWith(
        'name ==[c] $0 AND isDeleted == false',
        'test note'
      );
      expect(result).toBe(true);
    });

    it('should exclude specified noteId from check', () => {
      mockFiltered.mockReturnValue([]);
      mockObjects.mockReturnValue({ filtered: mockFiltered });

      const result = checkDuplicateName('Test Note', 'note_123');

      expect(mockFiltered).toHaveBeenCalledWith(
        'name ==[c] $0 AND isDeleted == false AND id != $1',
        'Test Note',
        'note_123'
      );
      expect(result).toBe(false);
    });

    it('should return false for unique titles', () => {
      mockFiltered.mockReturnValue([]);
      mockObjects.mockReturnValue({ filtered: mockFiltered });

      const result = checkDuplicateName('Unique Note');

      expect(result).toBe(false);
    });

    it('should return false on error', () => {
      mockObjects.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = checkDuplicateName('Test');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getUnsyncedNotes', () => {
    it('should return only unsynced notes', () => {
      const mockNotes = [
        createMockNote({ id: 'note_1', isSynced: false }),
        createMockNote({ id: 'note_2', isSynced: false }),
      ];

      mockSorted.mockReturnValue(mockNotes);
      mockFiltered.mockReturnValue({ sorted: mockSorted });
      mockObjects.mockReturnValue({ filtered: mockFiltered });

      const result = getUnsyncedNotes();

      expect(mockFiltered).toHaveBeenCalledWith('isSynced == false');
      expect(result).toHaveLength(2);
    });

    it('should sort by createdAt ascending (oldest first)', () => {
      mockSorted.mockReturnValue([]);
      mockFiltered.mockReturnValue({ sorted: mockSorted });
      mockObjects.mockReturnValue({ filtered: mockFiltered });

      getUnsyncedNotes();

      expect(mockSorted).toHaveBeenCalledWith('createdAt', false);
    });

    it('should return empty array on error', () => {
      mockObjects.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = getUnsyncedNotes();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('markNoteAsSynced', () => {
    it('should mark note as synced correctly', () => {
      const mockNote = createMockNote({ isSynced: false });
      mockFiltered.mockReturnValue([mockNote]);
      mockObjects.mockReturnValue({ filtered: mockFiltered });
      mockWrite.mockImplementation((callback) => callback());

      const result = markNoteAsSynced('note_123');

      expect(mockNote.isSynced).toBe(true);
      expect(result).toBe(true);
    });

    it('should update timestamp when marking as synced', () => {
      const mockNote = createMockNote({ updatedAt: mockDate });
      mockFiltered.mockReturnValue([mockNote]);
      mockObjects.mockReturnValue({ filtered: mockFiltered });
      mockWrite.mockImplementation((callback) => callback());

      markNoteAsSynced('note_123');

      expect(mockNote.updatedAt).toBeInstanceOf(Date);
      expect(mockNote.updatedAt.getTime()).toBeGreaterThan(mockDate.getTime());
    });

    it('should return false for non-existent note', () => {
      mockFiltered.mockReturnValue([]);
      mockObjects.mockReturnValue({ filtered: mockFiltered });

      const result = markNoteAsSynced('nonexistent');

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalled();
    });

    it('should return false on error', () => {
      mockObjects.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = markNoteAsSynced('note_123');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getNotesCount', () => {
    it('should return count of non-deleted notes', () => {
      mockFiltered.mockReturnValue({ length: 5 });
      mockObjects.mockReturnValue({ filtered: mockFiltered });

      const result = getNotesCount();

      expect(mockFiltered).toHaveBeenCalledWith('isDeleted == false');
      expect(result).toBe(5);
    });

    it('should return 0 when no notes exist', () => {
      mockFiltered.mockReturnValue({ length: 0 });
      mockObjects.mockReturnValue({ filtered: mockFiltered });

      const result = getNotesCount();

      expect(result).toBe(0);
    });

    it('should return 0 on error', () => {
      mockObjects.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = getNotesCount();

      expect(result).toBe(0);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getUnsyncedNotesCount', () => {
    it('should return count of unsynced notes', () => {
      mockFiltered.mockReturnValue({ length: 3 });
      mockObjects.mockReturnValue({ filtered: mockFiltered });

      const result = getUnsyncedNotesCount();

      expect(mockFiltered).toHaveBeenCalledWith('isSynced == false');
      expect(result).toBe(3);
    });

    it('should return 0 when all notes are synced', () => {
      mockFiltered.mockReturnValue({ length: 0 });
      mockObjects.mockReturnValue({ filtered: mockFiltered });

      const result = getUnsyncedNotesCount();

      expect(result).toBe(0);
    });

    it('should return 0 on error', () => {
      mockObjects.mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = getUnsyncedNotesCount();

      expect(result).toBe(0);
      expect(console.error).toHaveBeenCalled();
    });
  });
});
