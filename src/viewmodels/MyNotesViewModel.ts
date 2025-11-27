import { makeObservable, observable, action, computed } from 'mobx';
import { NotesStore } from '../stores/NotesStore';
import { NoteState } from '../types';

/**
 * ViewModel for MyNotesScreen
 * Handles business logic for note list, search, and actions
 */
export class MyNotesViewModel {
  @observable searchQuery: string = '';
  @observable debouncedSearchQuery: string = '';
  @observable isRefreshing: boolean = false;

  private notesStore: NotesStore;
  private searchDebounceTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_DELAY_MS = 300;

  constructor(notesStore: NotesStore) {
    makeObservable(this);
    this.notesStore = notesStore;
  }

  /**
   * Get loading state from store
   */
  @computed
  get isLoading(): boolean {
    return this.notesStore.isLoading;
  }

  /**
   * Get all notes from store
   */
  @computed
  get notes(): NoteState[] {
    return this.notesStore.notes;
  }

  /**
   * Filter notes based on debounced search query
   */
  @computed
  get filteredNotes(): NoteState[] {
    if (!this.debouncedSearchQuery.trim()) {
      return this.notes;
    }

    const query = this.debouncedSearchQuery.toLowerCase().trim();
    return this.notes.filter(note =>
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query)
    );
  }

  /**
   * Count of unsynced notes
   */
  @computed
  get unsyncedCount(): number {
    return this.notes.filter(note => !note.isSynced).length;
  }

  /**
   * Check if there are any notes
   */
  @computed
  get hasNotes(): boolean {
    return this.notes.length > 0;
  }

  /**
   * Check if search has results
   */
  @computed
  get hasSearchResults(): boolean {
    return this.filteredNotes.length > 0;
  }

  /**
   * Initialize view model - load notes from Realm
   */
  @action
  initialize = async () => {
    await this.loadNotes();
  };

  /**
   * Load notes from Realm
   */
  @action
  loadNotes = async () => {
    try {
      await this.notesStore.loadNotes();
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  /**
   * Refresh notes (pull-to-refresh)
   */
  @action
  refreshNotes = async () => {
    this.isRefreshing = true;
    try {
      await this.notesStore.loadNotes();
    } catch (error) {
      console.error('Failed to refresh notes:', error);
    } finally {
      this.isRefreshing = false;
    }
  };

  /**
   * Update search query with debounce
   */
  @action
  setSearchQuery = (query: string) => {
    this.searchQuery = query;

    // Clear previous timer
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    // If query is empty, update immediately
    if (!query.trim()) {
      this.debouncedSearchQuery = '';
      return;
    }

    // Set new timer for debounced search
    this.searchDebounceTimer = setTimeout(() => {
      this.updateDebouncedSearchQuery(query);
    }, this.DEBOUNCE_DELAY_MS);
  };

  /**
   * Update debounced search query (internal action)
   */
  @action
  private updateDebouncedSearchQuery = (query: string) => {
    this.debouncedSearchQuery = query;
  };

  /**
   * Clear search query
   */
  @action
  clearSearch = () => {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchQuery = '';
    this.debouncedSearchQuery = '';
  };

  /**
   * Delete a note (optimistic UI update)
   */
  @action
  deleteNote = async (noteId: string): Promise<boolean> => {
    try {
      // Use deleteNoteData for proper optimistic delete
      const success = await this.notesStore.deleteNoteData(noteId);
      return success;
    } catch (error) {
      console.error('Failed to delete note:', error);
      return false;
    }
  };

  /**
   * Get note by ID
   */
  getNoteById = (noteId: string): NoteState | undefined => {
    return this.notes.find(note => note.id === noteId);
  };

  /**
   * Format date for display
   */
  formatDate = (date: Date): string => {
    const now = new Date();
    const noteDate = new Date(date);
    const diffMs = now.getTime() - noteDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      // Format as date for older notes
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[noteDate.getMonth()];
      const day = noteDate.getDate();
      const year = noteDate.getFullYear();
      return `${day} ${month} ${year}`;
    }
  };

  /**
   * Get preview text from HTML content
   */
  getPreviewText = (htmlContent: string, maxLength: number = 100): string => {
    // Strip HTML tags
    const plainText = htmlContent.replace(/<[^>]*>/g, '').trim();

    if (plainText.length <= maxLength) {
      return plainText;
    }

    return plainText.substring(0, maxLength) + '...';
  };

  /**
   * Cleanup method
   */
  @action
  cleanup = () => {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchQuery = '';
    this.debouncedSearchQuery = '';
    this.isRefreshing = false;
  };
}
