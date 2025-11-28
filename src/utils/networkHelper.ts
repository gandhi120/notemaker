/**
 * Network State Monitoring Helper
 * Monitors network connectivity and provides network status
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { makeAutoObservable } from 'mobx';

/**
 * Network State Store (Observable)
 * Provides reactive network status for the app
 */
class NetworkStateStore {
  isConnected: boolean = true;
  isInternetReachable: boolean | null = null;
  connectionType: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.initializeNetworkMonitoring();
  }

  /**
   * Initialize network state monitoring
   * Sets up listener for network state changes
   */
  private initializeNetworkMonitoring() {
    // Subscribe to network state changes
    NetInfo.addEventListener((state: NetInfoState) => {
      this.updateNetworkState(state);
    });

    // Get initial network state
    NetInfo.fetch().then((state: NetInfoState) => {
      this.updateNetworkState(state);
    });
  }

  /**
   * Update network state from NetInfo
   * @param state - NetInfo state object
   */
  private updateNetworkState(state: NetInfoState) {
    this.isConnected = state.isConnected ?? false;
    this.isInternetReachable = state.isInternetReachable;
    this.connectionType = state.type;

    if (__DEV__) {
      console.log('🌐 Network State Changed:', {
        isConnected: this.isConnected,
        isInternetReachable: this.isInternetReachable,
        type: this.connectionType,
      });
    }
  }

  /**
   * Check if device has internet connectivity
   * @returns true if connected and internet is reachable
   */
  get hasInternetConnection(): boolean {
    return this.isConnected && this.isInternetReachable !== false;
  }
}

// Export singleton instance
export const networkState = new NetworkStateStore();

/**
 * Check current network connectivity
 * @returns Promise resolving to true if connected
 */
export const checkNetworkConnection = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  } catch (error) {
    console.error('❌ Error checking network connection:', error);
    return false;
  }
};

/**
 * Wait for network connection to be available
 * @param timeout - Max time to wait in milliseconds (default: 30000ms)
 * @returns Promise resolving to true if connection available
 */
export const waitForConnection = async (timeout: number = 30000): Promise<boolean> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const isConnected = await checkNetworkConnection();
    if (isConnected) {
      return true;
    }
    // Wait 1 second before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return false;
};
