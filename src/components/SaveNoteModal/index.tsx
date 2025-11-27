import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { styles } from './styles';

interface SaveNoteModalProps {
  visible: boolean;
  initialTitle?: string;
  onSave: (title: string) => void | Promise<void>;
  onCancel: () => void;
  testID?: string;
}

export const SaveNoteModal: React.FC<SaveNoteModalProps> = ({
  visible,
  initialTitle = '',
  onSave,
  onCancel,
  testID,
}) => {
  const [title, setTitle] = useState(initialTitle);

  const handleSave = async () => {
    if (title.trim()) {
      await onSave(title.trim());
      setTitle('');
    }
  };

  const handleCancel = () => {
    setTitle(initialTitle);
    onCancel();
  };

  React.useEffect(() => {
    if (visible) {
      setTitle(initialTitle);
    }
  }, [visible, initialTitle]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
      testID={testID}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
        testID="modal-overlay"
      >
        <View style={styles.modalContainer} testID="modal-container">
          <Text style={styles.title} testID="modal-title">Save Note</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter note title"
            placeholderTextColor="#999999"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            autoFocus
            testID="modal-title-input"
          />

          <View style={styles.buttonContainer} testID="modal-button-container">
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              testID="modal-cancel-button"
            >
              <Text style={styles.cancelButtonText} testID="modal-cancel-button-text">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={!title.trim()}
              testID="modal-save-button"
            >
              <Text style={styles.saveButtonText} testID="modal-save-button-text">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
