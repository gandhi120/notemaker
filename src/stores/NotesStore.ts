import { makeAutoObservable, runInAction } from 'mobx';
import { NoteState } from '../types';
import * as RealmHelper from '../utils/realmHelper';
import notesService from '../services/notesService';
import { networkState } from '../utils/networkHelper';

export class NotesStore {
  notes: NoteState[] = [];
  isLoading = false;
  error: string | null = null;
  selectedNoteId: string | null = null;

  // Pagination state
  currentPage: number = 1;
  pageSize: number = 20;
  hasMoreNotes: boolean = true;
  isLoadingMore: boolean = false;
  totalNotes: number = 0;

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

  // Load notes with pagination (API-first with Realm cache fallback)
  async loadNotes() {
    this.setLoading(true);
    this.clearError();

    // Reset pagination state for initial load
    runInAction(() => {
      this.currentPage = 1;
      this.hasMoreNotes = true;
      this.notes = [];
    });

    try {
      // Step 1: Load first page from Realm immediately for instant UI (cache)
      const realmNotes = RealmHelper.getPaginatedNotes(this.currentPage, this.pageSize);
      const totalCount = RealmHelper.getTotalNotesCount();

      runInAction(() => {
        this.notes = realmNotes;
        this.totalNotes = totalCount;
        this.hasMoreNotes = realmNotes.length >= this.pageSize;
      });
      console.log(`✅ Loaded page ${this.currentPage} (${realmNotes.length} notes) from Realm (cache)`);

      // Step 2: If online, fetch from API to get latest data
      if (networkState.hasInternetConnection) {
        console.log(`🌐 Fetching page ${this.currentPage} from API...`);

        try {
          const apiResponse = await notesService.getAllNotes(this.currentPage, this.pageSize);

          // Extract notes and pagination metadata
          const apiNotes = apiResponse.data.notes;
          const pagination = apiResponse.data.pagination;

          console.log(`✅ Fetched page ${pagination.currentPage} (${apiNotes.length} notes) from API`);

          // Step 3: Sync API notes to Realm (update local cache)
          this.syncApiNotesToRealm(apiNotes);

          // Step 4: Reload from Realm to get updated data
          const updatedNotes = RealmHelper.getPaginatedNotes(this.currentPage, this.pageSize);
          const updatedTotal = RealmHelper.getTotalNotesCount();

          runInAction(() => {
            this.notes = updatedNotes;
            this.totalNotes = pagination.totalNotes || updatedTotal;
            this.hasMoreNotes = pagination.hasNextPage;
            this.isLoading = false;
          });

          console.log(`✅ Page ${this.currentPage} synced (Total: ${this.totalNotes} notes)`);
        } catch (apiError) {
          // API fetch failed, but we already have cached data from Realm
          console.warn('⚠️ API fetch failed, using cached Realm data:', apiError);
          runInAction(() => {
            this.isLoading = false;
          });
        }
      } else {
        // Offline - use cached Realm data
        console.log('📴 Offline mode - using cached Realm data');
        runInAction(() => {
          this.isLoading = false;
        });
      }
    } catch (error) {
      runInAction(() => {
        this.error = 'Failed to load notes';
        this.isLoading = false;
      });
      console.error('❌ Error loading notes:', error);
    }
  }

  // Load more notes (pagination)
  async loadMoreNotes() {
    // Don't load if already loading or no more notes
    if (this.isLoadingMore || !this.hasMoreNotes || this.isLoading) {
      return;
    }

    runInAction(() => {
      this.isLoadingMore = true;
      this.currentPage++;
    });

    console.log(`🔄 Loading more notes - Page ${this.currentPage}...`);

    try {
      // Load next page from Realm first (instant UI)
      const realmNotes = RealmHelper.getPaginatedNotes(this.currentPage, this.pageSize);

      runInAction(() => {
        this.notes = [...this.notes, ...realmNotes];
        this.hasMoreNotes = realmNotes.length >= this.pageSize;
      });

      console.log(`✅ Loaded page ${this.currentPage} (${realmNotes.length} notes) from Realm`);

      // If online, fetch from API in background
      if (networkState.hasInternetConnection) {
        try {
          const apiResponse = await notesService.getAllNotes(this.currentPage, this.pageSize);
          const apiNotes = apiResponse.data.notes;
          const pagination = apiResponse.data.pagination;

          console.log(`✅ Fetched page ${pagination.currentPage} (${apiNotes.length} notes) from API`);

          // Sync to Realm
          this.syncApiNotesToRealm(apiNotes);

          // Reload this page from Realm to get updated data
          const updatedPageNotes = RealmHelper.getPaginatedNotes(this.currentPage, this.pageSize);
          const updatedTotal = RealmHelper.getTotalNotesCount();

          runInAction(() => {
            // Replace notes for current page
            const previousPagesCount = (this.currentPage - 1) * this.pageSize;
            this.notes = [
              ...this.notes.slice(0, previousPagesCount),
              ...updatedPageNotes,
            ];
            this.totalNotes = pagination.totalNotes || updatedTotal;
            this.hasMoreNotes = pagination.hasNextPage;
            this.isLoadingMore = false;
          });
        } catch (apiError) {
          console.warn('⚠️ API fetch failed for page, using cached data:', apiError);
          runInAction(() => {
            this.isLoadingMore = false;
          });
        }
      } else {
        runInAction(() => {
          this.isLoadingMore = false;
        });
      }
    } catch (error) {
      console.error('❌ Error loading more notes:', error);
      runInAction(() => {
        this.currentPage--; // Rollback page increment
        this.isLoadingMore = false;
      });
    }
  }

  // Sync API notes to Realm (update local cache with server data)
  private syncApiNotesToRealm(apiNotes: any[]) {
    try {
      // Guard against invalid input
      if (!Array.isArray(apiNotes)) {
        console.error('❌ syncApiNotesToRealm called with non-array:', apiNotes);
        return;
      }

      const realm = RealmHelper.getRealm();

      realm.write(() => {
        apiNotes.forEach((apiNote: any) => {
          // Find existing note in Realm by apiId
          const existingNotes = realm
            .objects('Note')
            .filtered('apiId == $0', apiNote._id);

          if (existingNotes.length > 0) {
            // Update existing note
            const existingNote = existingNotes[0] as any;
            existingNote.name = apiNote.name;
            existingNote.content = apiNote.content;
            // Use content as formattedContent if formattedContent is not provided
            existingNote.formattedContent = apiNote.formattedContent || apiNote.content;
            existingNote.updatedAt = new Date(apiNote.updatedAt);
            existingNote.isSynced = true;
            console.log(`✅ Updated note in Realm: ${existingNote.id}`);
          } else {
            // Create new note from API (not in local Realm yet)
            const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            realm.create('Note', {
              _id: new RealmHelper.Realm.BSON.ObjectId(),
              id: noteId,
              apiId: apiNote._id,
              name: apiNote.name,
              content: apiNote.content,
              // Use content as formattedContent if formattedContent is not provided
              formattedContent: apiNote.formattedContent || apiNote.content,
              createdBy: apiNote.createdBy || 'Anonymous User',
              createdAt: new Date(apiNote.createdAt),
              updatedAt: new Date(apiNote.updatedAt),
              isDeleted: apiNote.isDeleted || apiNote.deletedAt !== null || false,
              isSynced: true,
            });
            console.log(`✅ Created new note from API: ${noteId} (API ID: ${apiNote._id})`);
          }
        });
      });

      console.log(`✅ Synced ${apiNotes.length} API notes to Realm`);
    } catch (error) {
      console.error('❌ Error syncing API notes to Realm:', error);
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
