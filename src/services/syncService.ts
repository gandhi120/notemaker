/**
 * Background Sync Service
 * Handles syncing unsynced notes to the API with retry logic
 */

import { makeAutoObservable, runInAction } from 'mobx';
import * as RealmHelper from '../utils/realmHelper';
import notesService from './notesService';
import { networkState } from '../utils/networkHelper';
import { NoteState } from '../types';

/**
 * Retry Configuration
 */
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 10000, // 10 seconds
  BACKOFF_MULTIPLIER: 2,
};

/**
 * Sync Result Status
 */
export type SyncStatus = 'pending' | 'syncing' | 'success' | 'failed';

/**
 * Background Sync Service
 * Manages background synchronization of notes to API
 */
class SyncService {
  isSyncing: boolean = false;
  lastSyncTime: Date | null = null;
  syncErrors: string[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Sync all unsynced notes to API
   * @returns Number of notes successfully synced
   */
  async syncUnsyncedNotes(): Promise<number> {
    // Check network connectivity
    if (!networkState.hasInternetConnection) {
      console.log('⚠️ No internet connection - skipping sync');
      return 0;
    }

    // Prevent concurrent sync operations
    if (this.isSyncing) {
      console.log('⚠️ Sync already in progress - skipping');
      return 0;
    }

    runInAction(() => {
      this.isSyncing = true;
      this.syncErrors = [];
    });

    console.log('🔄 Starting background sync...');

    try {
      // Get all unsynced notes from Realm
      const unsyncedNotes = RealmHelper.getUnsyncedNotes();
      console.log(`📊 Found ${unsyncedNotes.length} unsynced notes`);

      let successCount = 0;

      // Sync each note
      for (const note of unsyncedNotes) {
        try {
          const synced = await this.syncSingleNote(note);
          if (synced) {
            successCount++;
          }
        } catch (error) {
          console.error(`❌ Failed to sync note ${note.id}:`, error);
          runInAction(() => {
            this.syncErrors.push(`Failed to sync note: ${note.name}`);
          });
        }
      }

      runInAction(() => {
        this.lastSyncTime = new Date();
        this.isSyncing = false;
      });

      console.log(`✅ Sync complete: ${successCount}/${unsyncedNotes.length} notes synced`);
      return successCount;
    } catch (error) {
      runInAction(() => {
        this.isSyncing = false;
        this.syncErrors.push('Sync operation failed');
      });
      console.error('❌ Background sync failed:', error);
      return 0;
    }
  }

  /**
   * Sync a single note to API with retry logic
   * @param note - Note to sync
   * @returns true if successfully synced
   */
  private async syncSingleNote(note: NoteState): Promise<boolean> {
    let retryCount = 0;
    let delay = RETRY_CONFIG.INITIAL_DELAY;

    while (retryCount <= RETRY_CONFIG.MAX_RETRIES) {
      try {
        // Check if note has apiId (already created on server)
        if (note.apiId) {
          // Update existing note on server
          await this.updateNoteOnServer(note);
        } else {
          // Create new note on server
          await this.createNoteOnServer(note);
        }

        return true;
      } catch (error: any) {
        retryCount++;

        if (retryCount > RETRY_CONFIG.MAX_RETRIES) {
          console.error(`❌ Max retries reached for note ${note.id}:`, error);
          return false;
        }

        // Exponential backoff
        console.log(`⚠️ Retry ${retryCount}/${RETRY_CONFIG.MAX_RETRIES} for note ${note.id} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * RETRY_CONFIG.BACKOFF_MULTIPLIER, RETRY_CONFIG.MAX_DELAY);
      }
    }

    return false;
  }

  /**
   * Create note on server
   * @param note - Local note to create
   */
  private async createNoteOnServer(note: NoteState): Promise<void> {
    console.log(`🔄 Creating note on server: ${note.id}`);

    const response = await notesService.createNote({
      name: note.name,
      content: note.content,
      formattedContent: note.formattedContent,
    });

    const apiId = response.data._id;
    console.log(`✅ Note created on server with API ID: ${apiId}`);

    // Update Realm with API ID and mark as synced
    RealmHelper.markNoteAsSynced(note.id, apiId);
  }

  /**
   * Update note on server (conflict resolution: server wins)
   * @param note - Local note to update
   */
  private async updateNoteOnServer(note: NoteState): Promise<void> {
    if (!note.apiId) {
      throw new Error('Cannot update note without API ID');
    }

    console.log(`🔄 Updating note on server: ${note.id} (API ID: ${note.apiId})`);

    try {
      // Fetch latest version from server (conflict resolution: server wins)
      const serverNote = await notesService.getNoteById(note.apiId);

      // Check if server version is newer
      const serverUpdatedAt = new Date(serverNote.data.updatedAt);
      const localUpdatedAt = note.updatedAt;

      if (serverUpdatedAt > localUpdatedAt) {
        console.log('⚠️ Server version is newer - applying server wins strategy');

        // Update local Realm with server data (server wins)
        RealmHelper.updateNote(note.id, {
          title: serverNote.data.name,
          content: serverNote.data.content,
          formattedContent: serverNote.data.formattedContent,
        });

        // Mark as synced
        RealmHelper.markNoteAsSynced(note.id, note.apiId);

        console.log(`✅ Local note updated with server version: ${note.id}`);
        return;
      }

      // Local version is newer or same - update server
      // Update title if needed
      await notesService.updateNoteTitle(note.apiId, {
        title: note.name,
      });

      // Update content if needed
      await notesService.updateNoteContent(note.apiId, {
        content: note.content,
        formattedContent: note.formattedContent,
      });

      console.log(`✅ Server note updated: ${note.apiId}`);

      // Mark as synced
      RealmHelper.markNoteAsSynced(note.id, note.apiId);
    } catch (error: any) {
      // If note not found on server (404), recreate it
      if (error.response?.status === 404) {
        console.log(`⚠️ Note not found on server - recreating: ${note.id}`);

        // Remove apiId and create as new note
        const response = await notesService.createNote({
          name: note.name,
          content: note.content,
          formattedContent: note.formattedContent,
        });

        const newApiId = response.data._id;
        RealmHelper.markNoteAsSynced(note.id, newApiId);

        console.log(`✅ Note recreated on server with new API ID: ${newApiId}`);
        return;
      }

      throw error;
    }
  }

  /**
   * Clear sync errors
   */
  clearErrors() {
    this.syncErrors = [];
  }

  /**
   * Reset sync service
   */
  reset() {
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.syncErrors = [];
  }
}

// Export singleton instance
export const syncService = new SyncService();
export default syncService;
