import React, { useEffect, useState } from 'react';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StoreProvider } from './src/stores/StoreProvider';
import RootNavigator from './src/navigation/RootNavigator';
import { initializeRealm } from './src/models';

function App(): React.JSX.Element {
  const [isRealmReady, setIsRealmReady] = useState(false);
  const [realmError, setRealmError] = useState<string | null>(null);

  useEffect(() => {
    const setupRealm = async () => {
      try {
        await initializeRealm();
        setIsRealmReady(true);
      } catch (error) {
        console.error('Failed to initialize Realm:', error);
        setRealmError('Failed to initialize database');
      }
    };

    setupRealm();
  }, []);

  if (realmError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>❌ {realmError}</Text>
        <Text style={styles.errorSubtext}>Please restart the app</Text>
      </View>
    );
  }

  if (!isRealmReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <RootNavigator />
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
