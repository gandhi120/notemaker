import React, { useEffect, useState } from 'react';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StoreProvider } from './src/stores/StoreProvider';
import RootNavigator from './src/navigation/RootNavigator';
import { initializeRealm } from './src/models';
import { getAllNotes } from './src/utils/realmHelper';
import { RootStackParamList } from './src/navigation/types';
import syncService from './src/services/syncService';
import { networkState } from './src/utils/networkHelper';

function App(): React.JSX.Element {
  const [isRealmReady, setIsRealmReady] = useState(false);
  const [realmError, setRealmError] = useState<string | null>(null);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Home');

  useEffect(() => {
    const setupRealm = async () => {
      try {
        await initializeRealm();

        // Check if user has any notes to determine initial route
        const notes = getAllNotes();
        const hasNotes = notes.length > 0;

        // If user has notes, navigate directly to Drawer (My Notes)
        // If no notes, show Welcome screen (Home)
        setInitialRoute(hasNotes ? 'Drawer' : 'Home');
        setIsRealmReady(true);

        // Start background sync after realm initialization (non-blocking)
        startBackgroundSync();
      } catch (error) {
        console.error('Failed to initialize Realm:', error);
        setRealmError('Failed to initialize database');
      }
    };

    setupRealm();
  }, []);

  // Background sync on app start
  const startBackgroundSync = async () => {
    try {
      // Wait a bit to let the app fully initialize
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if online before syncing
      if (networkState.hasInternetConnection) {
        console.log('🔄 Starting background sync on app start...');
        const syncedCount = await syncService.syncUnsyncedNotes();
        console.log(`✅ Background sync complete: ${syncedCount} notes synced`);
      } else {
        console.log('📴 Offline - skipping background sync on app start');
      }
    } catch (error) {
      console.error('❌ Background sync failed on app start:', error);
    }
  };

  if (realmError) {
    return (
      <View style={styles.errorContainer} testID="app-error-container">
        <Text style={styles.errorText} testID="app-error-text">❌ {realmError}</Text>
        <Text style={styles.errorSubtext} testID="app-error-subtext">Please restart the app</Text>
      </View>
    );
  }

  if (!isRealmReady) {
    return (
      <View style={styles.loadingContainer} testID="app-loading-container">
        <ActivityIndicator size="large" color="#007AFF" testID="app-loading-indicator" />
        <Text style={styles.loadingText} testID="app-loading-text">Initializing...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <RootNavigator initialRouteName={initialRoute} />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default App;
