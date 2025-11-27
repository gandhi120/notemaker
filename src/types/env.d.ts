declare module 'react-native-config' {
  export interface NativeConfig {
    API_BASE_URL: string;
    API_TIMEOUT: string;
    RETRY_ATTEMPTS: string;
    SYNC_INTERVAL: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
