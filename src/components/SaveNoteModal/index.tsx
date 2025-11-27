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
  onSave: (title: string) => void;
  onCancel: () => void;
}

export const SaveNoteModal: React.FC<SaveNoteModalProps> = ({
  visible,
  initialTitle = '',
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState(initialTitle);

  const handleSave = () => {
    if (title.trim()) {
      onSave(title.trim());
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
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Save Note</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter note title"
            placeholderTextColor="#999999"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            autoFocus
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={!title.trim()}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
