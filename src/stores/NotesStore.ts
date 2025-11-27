import { makeAutoObservable } from 'mobx';
import { NoteState } from '../types';

export class NotesStore {
  notes: NoteState[] = [];
  isLoading = false;
  error: string | null = null;
  selectedNoteId: string | null = null;

  constructor() {
    makeAutoObservable(this);
    // Add mock data for testing
    this.loadMockData();
  }

  // Mock data loader for testing Phase 3
  private loadMockData() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    this.notes = [
      {
        id: 'note_1',
        title: 'Meeting Notes',
        content: '<p><b>Discussed</b> project timeline and <u>deliverables</u> for Q4 2025.</p>',
        createdAt: now,
        updatedAt: now,
        isSynced: true,
      },
      {
        id: 'note_2',
        title: 'Shopping List',
        content: '<p>Milk<br/>Eggs<br/>Bread<br/>Coffee</p>',
        createdAt: yesterday,
        updatedAt: yesterday,
        isSynced: false,
      },
      {
        id: 'note_3',
        title: 'Book Ideas',
        content: '<p><i>1984</i> by George Orwell<br/><b>Brave New World</b> by Aldous Huxley</p>',
        createdAt: lastWeek,
        updatedAt: lastWeek,
        isSynced: true,
      },
    ];
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

  // Actions
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
    this.notes.unshift(note);
  }

  updateNote(noteId: string, updates: Partial<NoteState>) {
    const index = this.notes.findIndex(n => n.id === noteId);
    if (index !== -1) {
      this.notes[index] = { ...this.notes[index], ...updates };
    }
  }

  deleteNote(noteId: string) {
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
