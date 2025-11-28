import Realm from 'realm';
import { Note } from './Note';

let realmInstance: Realm | null = null;

/**
 * Initialize Realm database
 * Schema version: 1 (initial release)
 */
export const initializeRealm = async (): Promise<Realm> => {
  if (realmInstance) {
    return realmInstance;
  }

  try {
    const config: Realm.Configuration = {
      schema: [Note],
      schemaVersion: 2, // v2: Added apiId field for API sync
      migration: (oldRealm, newRealm) => {
        // v1 -> v2: Add apiId field to existing notes
        if (oldRealm.schemaVersion < 2) {
          const oldNotes = oldRealm.objects<Note>('Note');
          const newNotes = newRealm.objects<Note>('Note');

          for (let i = 0; i < oldNotes.length; i++) {
            // Set apiId to null for existing notes
            // Will be populated when notes sync to API
            newNotes[i].apiId = null;
          }
          console.log(`✅ Migrated ${oldNotes.length} notes to schema v2`);
        }
      },
      deleteRealmIfMigrationNeeded: __DEV__, // Only in development
    };

    realmInstance = await Realm.open(config);
    console.log('✅ Realm initialized successfully');
    return realmInstance;
  } catch (error) {
    console.error('❌ Failed to initialize Realm:', error);
    throw error;
  }
};

/**
 * Get the current Realm instance
 * @throws Error if Realm is not initialized
 */
export const getRealm = (): Realm => {
  if (!realmInstance) {
    throw new Error('Realm not initialized. Call initializeRealm() first.');
  }
  return realmInstance;
};

/**
 * Close Realm connection
 */
export const closeRealm = (): void => {
  if (realmInstance && !realmInstance.isClosed) {
    realmInstance.close();
    realmInstance = null;
    console.log('✅ Realm closed successfully');
  }
};

/**
 * Clear all data from Realm (for testing/development)
 */
export const clearRealmData = (): void => {
  const realm = getRealm();
  realm.write(() => {
    realm.deleteAll();
    console.log('✅ Realm data cleared');
  });
};

export { Note };
