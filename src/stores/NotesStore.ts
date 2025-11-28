import { makeAutoObservable, runInAction } from 'mobx';
import { NoteState } from '../types';
import * as RealmHelper from '../utils/realmHelper';
import notesService from '../services/notesService';

export class NotesStore {
  notes: NoteState[] = [];
  isLoading = false;
  error: string | null = null;
  selectedNoteId: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  // Getter for selected note
  get selectedNote(): NoteState | undefined {
    return this.notes.find(note => note.id === this.selectedNoteId);
  }

  // Getter for synced notes count
  get syncedNotesCount(): number {
    return this.notes.filter(note => note.isSynced).length;
  }

  // Getter for unsynced notes count
  get unsyncedNotesCount(): number {
    return this.notes.filter(note => !note.isSynced).length;
  }

  // Load all notes from Realm
  async loadNotes() {
    this.setLoading(true);
    this.clearError();

    try {
      const realmNotes = RealmHelper.getAllNotes();
      runInAction(() => {
        this.notes = realmNotes;
        this.isLoading = false;
      });
      console.log(`✅ Loaded ${realmNotes.length} notes from Realm`);
    } catch (error) {
      runInAction(() => {
        this.error = 'Failed to load notes';
        this.isLoading = false;
      });
      console.error('❌ Error loading notes:', error);
    }
  }

  // Create a new note (Offline-first with API sync)
  async createNote(noteData: {
    title: string;
    content: string;
    formattedContent?: string;
  }) {
    this.setLoading(true);
    this.clearError();

    try {
      // Use content as formattedContent if not provided
      const formattedContent = noteData.formattedContent || noteData.content;

      // Step 1: Save to Realm immediately (optimistic UI)
      const newNote = RealmHelper.createNote({
        title: noteData.title,
        content: noteData.content,
        formattedContent,
      });

      runInAction(() => {
        this.notes.unshift(newNote); // Add to beginning
        this.isLoading = false;
      });

      console.log('✅ Note created in Realm:', newNote.id);

      // Step 2: Sync to API in background
      this.syncNoteToAPI(newNote.id, {
        name: noteData.title,
        content: noteData.content,
        formattedContent,
      });

      return newNote;
    } catch (error) {
      runInAction(() => {
        this.error = 'Failed to create note';
        this.isLoading = false;
      });
      console.error('❌ Error creating note:', error);
      throw error;
    }
  }

  // Sync note to API (background operation)
  private async syncNoteToAPI(
    noteId: string,
    data: { name: string; content: string; formattedContent: string }
  ) {
    try {
      const response = await notesService.createNote(data);
      const apiId = response.data._id;
      console.log('✅ Note synced to API:', apiId);

      // Mark as synced in Realm and store API ID
      RealmHelper.markNoteAsSynced(noteId, apiId);

      // Update local state
      runInAction(() => {
        const index = this.notes.findIndex(n => n.id === noteId);
        if (index !== -1) {
          this.notes[index].isSynced = true;
        }
      });
    } catch (error) {
      console.error('❌ Failed to sync note to API (will retry):', error);
      // Note remains with isSynced = false for later retry
    }
  }

  // Update an existing note (Offline-first with API sync)
  async updateNoteData(
    noteId: string,
    updates: {
      title?: string;
      content?: string;
      formattedContent?: string;
    }
  ) {
    this.setLoading(true);
    this.clearError();

    try {
      // Step 1: Update in Realm immediately (optimistic UI)
      const updatedNote = RealmHelper.updateNote(noteId, updates);

      if (updatedNote) {
        runInAction(() => {
          const index = this.notes.findIndex(n => n.id === noteId);
          if (index !== -1) {
            this.notes[index] = updatedNote;
          }
          this.isLoading = false;
        });
        console.log('✅ Note updated in Realm:', noteId);

        // Step 2: Sync to API in background
        this.syncUpdateToAPI(noteId, updates);

        return updatedNote;
      } else {
        throw new Error('Note not found');
      }
    } catch (error) {
      runInAction(() => {
        this.error = 'Failed to update note';
        this.isLoading = false;
      });
      console.error('❌ Error updating note:', error);
      throw error;
    }
  }

  // Sync note update to API (background operation)
  private async syncUpdateToAPI(
    noteId: string,
    updates: {
      title?: string;
      content?: string;
      formattedContent?: string;
    }
  ) {
    try {
      // Get API ID for this note
      const apiId = RealmHelper.getApiIdByLocalId(noteId);

      if (!apiId) {
        console.warn('⚠️ Cannot sync update - note not synced to API yet:', noteId);
        return;
      }

      // Update title if provided
      if (updates.title) {
        await notesService.updateNoteTitle(apiId, { title: updates.title });
        console.log('✅ Note title synced to API:', apiId);
      }

      // Update content if provided
      if (updates.content || updates.formattedContent) {
        await notesService.updateNoteContent(apiId, {
          content: updates.content || '',
          formattedContent: updates.formattedContent || updates.content || '',
        });
        console.log('✅ Note content synced to API:', apiId);
      }

      // Mark as synced
      RealmHelper.markNoteAsSynced(noteId, apiId);

      runInAction(() => {
        const index = this.notes.findIndex(n => n.id === noteId);
        if (index !== -1) {
          this.notes[index].isSynced = true;
        }
      });
    } catch (error) {
      console.error('❌ Failed to sync update to API (will retry):', error);
    }
  }

  // Delete a note (Offline-first soft delete with API sync)
  async deleteNoteData(noteId: string) {
    this.setLoading(true);
    this.clearError();

    try {
      // Step 1: Soft delete in Realm immediately (optimistic UI)
      const success = RealmHelper.deleteNote(noteId);

      if (success) {
        runInAction(() => {
          this.notes = this.notes.filter(n => n.id !== noteId);
          this.isLoading = false;
        });
        console.log('✅ Note soft deleted in Realm:', noteId);

        // Step 2: Sync deletion to API in background
        this.syncDeleteToAPI(noteId);

        return true;
      } else {
        throw new Error('Note not found');
      }
    } catch (error) {
      runInAction(() => {
        this.error = 'Failed to delete note';
        this.isLoading = false;
      });
      console.error('❌ Error deleting note:', error);
      throw error;
    }
  }

  // Sync note deletion to API (background operation)
  private async syncDeleteToAPI(noteId: string) {
    try {
      // Get API ID for this note
      const apiId = RealmHelper.getApiIdByLocalId(noteId);

      if (!apiId) {
        console.warn('⚠️ Cannot sync deletion - note not synced to API yet:', noteId);
        // Note was never synced to API, just delete locally
        return;
      }

      await notesService.deleteNote(apiId);
      console.log('✅ Note deletion synced to API:', apiId);

      // Permanently remove from Realm after successful API deletion
      // (Already soft deleted, this is for cleanup)
    } catch (error) {
      console.error('❌ Failed to sync deletion to API (will retry):', error);
      // Note remains soft deleted locally, will retry sync later
    }
  }

  // Check if a note name already exists
  checkDuplicateName(name: string, excludeNoteId?: string): boolean {
    return RealmHelper.checkDuplicateName(name, excludeNoteId);
  }

  // Actions (legacy methods for compatibility with existing screens)
  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  setError(error: string | null) {
    this.error = error;
  }

  setNotes(notes: NoteState[]) {
    this.notes = notes;
  }

  selectNote(noteId: string | null) {
    this.selectedNoteId = noteId;
  }

  addNote(note: NoteState) {
    // Legacy method - use createNote instead
    this.notes.unshift(note);
  }

  updateNote(noteId: string, updates: Partial<NoteState>) {
    // Legacy method for screen compatibility
    const index = this.notes.findIndex(n => n.id === noteId);
    if (index !== -1) {
      this.notes[index] = { ...this.notes[index], ...updates };
    }
  }

  deleteNote(noteId: string) {
    // Legacy method - use deleteNoteData instead
    this.notes = this.notes.filter(n => n.id !== noteId);
  }

  clearError() {
    this.error = null;
  }

  reset() {
    this.notes = [];
    this.isLoading = false;
    this.error = null;
    this.selectedNoteId = null;
  }
}
