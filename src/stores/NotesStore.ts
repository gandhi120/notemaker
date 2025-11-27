import { makeAutoObservable, runInAction } from 'mobx';
import { NoteState } from '../types';
import * as RealmHelper from '../utils/realmHelper';

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

  // Create a new note
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

      const newNote = RealmHelper.createNote({
        title: noteData.title,
        content: noteData.content,
        formattedContent,
      });

      runInAction(() => {
        this.notes.unshift(newNote); // Add to beginning
        this.isLoading = false;
      });

      console.log('✅ Note created:', newNote.id);
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

  // Update an existing note
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
      const updatedNote = RealmHelper.updateNote(noteId, updates);

      if (updatedNote) {
        runInAction(() => {
          const index = this.notes.findIndex(n => n.id === noteId);
          if (index !== -1) {
            this.notes[index] = updatedNote;
          }
          this.isLoading = false;
        });
        console.log('✅ Note updated:', noteId);
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

  // Delete a note (soft delete)
  async deleteNoteData(noteId: string) {
    this.setLoading(true);
    this.clearError();

    try {
      const success = RealmHelper.deleteNote(noteId);

      if (success) {
        runInAction(() => {
          this.notes = this.notes.filter(n => n.id !== noteId);
          this.isLoading = false;
        });
        console.log('✅ Note deleted:', noteId);
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
