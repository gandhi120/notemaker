/**
 * Sync Status Component
 * Shows sync status (online/offline, syncing, sync errors)
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { observer } from 'mobx-react-lite';
import { networkState } from '../../utils/networkHelper';
import syncService from '../../services/syncService';

interface SyncStatusProps {
  showDetails?: boolean; // Show detailed sync info
}

export const SyncStatus: React.FC<SyncStatusProps> = observer(({ showDetails = false }) => {
  const isOnline = networkState.hasInternetConnection;
  const isSyncing = syncService.isSyncing;
  const hasErrors = syncService.syncErrors.length > 0;

  // Don't show anything if online and not syncing
  if (isOnline && !isSyncing && !hasErrors && !showDetails) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Offline Indicator */}
      {!isOnline && (
        <View style={[styles.statusBar, styles.offlineBar]}>
          <Text style={styles.statusText}>📴 Offline Mode</Text>
        </View>
      )}

      {/* Syncing Indicator */}
      {isSyncing && (
        <View style={[styles.statusBar, styles.syncingBar]}>
          <ActivityIndicator size="small" color="#FFFFFF" style={styles.spinner} />
          <Text style={styles.statusText}>Syncing...</Text>
        </View>
      )}

      {/* Sync Errors */}
      {hasErrors && (
        <View style={[styles.statusBar, styles.errorBar]}>
          <Text style={styles.statusText}>
            ⚠️ {syncService.syncErrors.length} sync error(s)
          </Text>
        </View>
      )}

      {/* Detailed Info */}
      {showDetails && !isSyncing && !hasErrors && (
        <View style={[styles.statusBar, styles.detailsBar]}>
          <Text style={styles.detailsText}>
            {isOnline ? '🌐 Online' : '📴 Offline'}
            {syncService.lastSyncTime &&
              ` • Last sync: ${formatSyncTime(syncService.lastSyncTime)}`
            }
          </Text>
        </View>
      )}
    </View>
  );
});

/**
 * Format last sync time as relative time
 */
const formatSyncTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else {
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  }
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  offlineBar: {
    backgroundColor: '#FF9800', // Orange
  },
  syncingBar: {
    backgroundColor: '#2196F3', // Blue
  },
  errorBar: {
    backgroundColor: '#F44336', // Red
  },
  detailsBar: {
    backgroundColor: '#E0E0E0', // Light gray
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsText: {
    color: '#424242',
    fontSize: 12,
    fontWeight: '500',
  },
  spinner: {
    marginRight: 8,
  },
});
