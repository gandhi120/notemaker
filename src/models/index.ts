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
      schemaVersion: 1,
      migration: () => {
        // Handle schema migrations here when version changes
        // Currently on version 1, no migrations needed
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
