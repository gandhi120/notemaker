import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

export const toastConfig = {
  success: (props: any) => {
    return (
      <BaseToast
        text1={props.text1}
        text2={props.text2}
        onPress={props.onPress}
        style={{
          borderLeftColor: '#34C759',
          borderLeftWidth: 5,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 16,
          fontWeight: '700',
        }}
        text2Style={{
          fontSize: 14,
        }}
      />
    );
  },
  error: (props: any) => {
    return (
      <ErrorToast
        text1={props.text1}
        text2={props.text2}
        onPress={props.onPress}
        style={{
          borderLeftColor: '#FF3B30',
          borderLeftWidth: 5,
        }}
        text1Style={{
          fontSize: 16,
          fontWeight: '700',
        }}
        text2Style={{
          fontSize: 14,
        }}
      />
    );
  },
  info: (props: any) => {
    return (
      <BaseToast
        text1={props.text1}
        text2={props.text2}
        onPress={props.onPress}
        style={{
          borderLeftColor: '#007AFF',
          borderLeftWidth: 5,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 16,
          fontWeight: '700',
        }}
        text2Style={{
          fontSize: 14,
        }}
      />
    );
  },
};

export const showSuccessToast = (message: string, description?: string) => {
  Toast.show({
    type: 'success',
    text1: message,
    text2: description,
    visibilityTime: 3000,
  });
};

export const showErrorToast = (message: string, description?: string) => {
  Toast.show({
    type: 'error',
    text1: message,
    text2: description,
    visibilityTime: 4000,
  });
};

export const showInfoToast = (message: string, description?: string) => {
  Toast.show({
    type: 'info',
    text1: message,
    text2: description,
    visibilityTime: 3000,
  });
};
