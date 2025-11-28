/**
 * Unit tests for toast utilities
 */

import Toast from 'react-native-toast-message';
import { showSuccessToast, showErrorToast, showInfoToast } from '../toast';

// Mock react-native-toast-message
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
  },
  BaseToast: 'BaseToast',
  ErrorToast: 'ErrorToast',
}));

describe('Toast Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('showSuccessToast', () => {
    it('should call Toast.show with success type', () => {
      showSuccessToast('Success message');

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Success message',
        text2: undefined,
        visibilityTime: 3000,
      });
    });

    it('should include message in text1', () => {
      showSuccessToast('Operation completed');

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text1: 'Operation completed',
        })
      );
    });

    it('should include description in text2 when provided', () => {
      showSuccessToast('Success', 'Details here');

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text2: 'Details here',
        })
      );
    });

    it('should use 3000ms visibility time', () => {
      showSuccessToast('Success');

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          visibilityTime: 3000,
        })
      );
    });
  });

  describe('showErrorToast', () => {
    it('should call Toast.show with error type', () => {
      showErrorToast('Error message');

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Error message',
        text2: undefined,
        visibilityTime: 4000,
      });
    });

    it('should include message in text1', () => {
      showErrorToast('Operation failed');

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text1: 'Operation failed',
        })
      );
    });

    it('should include description in text2 when provided', () => {
      showErrorToast('Error', 'Error details');

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text2: 'Error details',
        })
      );
    });

    it('should use 4000ms visibility time (longer than success)', () => {
      showErrorToast('Error');

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          visibilityTime: 4000,
        })
      );
    });
  });

  describe('showInfoToast', () => {
    it('should call Toast.show with info type', () => {
      showInfoToast('Info message');

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'info',
        text1: 'Info message',
        text2: undefined,
        visibilityTime: 3000,
      });
    });

    it('should include message in text1', () => {
      showInfoToast('Important information');

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text1: 'Important information',
        })
      );
    });

    it('should include description in text2 when provided', () => {
      showInfoToast('Info', 'Additional context');

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text2: 'Additional context',
        })
      );
    });

    it('should use 3000ms visibility time', () => {
      showInfoToast('Info');

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          visibilityTime: 3000,
        })
      );
    });
  });

  describe('Toast behavior', () => {
    it('should handle success toast without description', () => {
      showSuccessToast('Note saved');

      expect(Toast.show).toHaveBeenCalledTimes(1);
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          text1: 'Note saved',
          text2: undefined,
        })
      );
    });

    it('should handle error toast without description', () => {
      showErrorToast('Failed to save');

      expect(Toast.show).toHaveBeenCalledTimes(1);
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text1: 'Failed to save',
          text2: undefined,
        })
      );
    });

    it('should handle info toast without description', () => {
      showInfoToast('Processing...');

      expect(Toast.show).toHaveBeenCalledTimes(1);
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          text1: 'Processing...',
          text2: undefined,
        })
      );
    });
  });
});
