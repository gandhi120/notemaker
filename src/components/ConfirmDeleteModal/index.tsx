import React from 'react';
import {Modal, View, Text, TouchableOpacity} from 'react-native';
import {styles} from './styles';

interface ConfirmDeleteModalProps {
  visible: boolean;
  noteTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  visible,
  noteTitle,
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      testID="confirm-delete-modal">
      <View style={styles.backdrop} testID="delete-modal-backdrop">
        <View style={styles.container} testID="delete-modal-container">
          <Text style={styles.title} testID="delete-modal-title">
            Delete Note
          </Text>

          <Text style={styles.message} testID="delete-modal-message">
            Are you sure you want to delete "{noteTitle}"?
          </Text>

          <Text style={styles.warning} testID="delete-modal-warning">
            This action cannot be undone.
          </Text>

          <View style={styles.buttonContainer} testID="delete-modal-button-container">
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.7}
              testID="delete-modal-cancel-button">
              <Text style={styles.cancelButtonText} testID="delete-modal-cancel-button-text">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={onConfirm}
              activeOpacity={0.7}
              testID="delete-modal-confirm-button">
              <Text style={styles.deleteButtonText} testID="delete-modal-delete-button-text">Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmDeleteModal;
