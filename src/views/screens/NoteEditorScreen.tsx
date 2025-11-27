import React, { useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';
import Toast from 'react-native-toast-message';
import { NotesStackScreenProps } from '../../navigation/types';
import { useNotesStore } from '../../stores/StoreProvider';
import { RichTextEditor } from '../../components/RichTextEditor';
import { SaveNoteModal } from '../../components/SaveNoteModal';
import { NoteEditorViewModel } from '../../viewmodels/NoteEditorViewModel';

type NoteEditorScreenProps = NotesStackScreenProps<'NoteEditor'>;

const NoteEditorScreen: React.FC<NoteEditorScreenProps> = observer(({ navigation, route }) => {
  const { noteId } = route.params;
  const notesStore = useNotesStore();
  const insets = useSafeAreaInsets();

  // Create ViewModel instance
  const viewModel = useMemo(
    () => new NoteEditorViewModel(notesStore, noteId),
    [notesStore, noteId]
  );

  // Initialize ViewModel on mount
  useEffect(() => {
    viewModel.initialize();
    return () => {
      viewModel.cleanup();
    };
  }, [viewModel]);

  // Handle back button press with unsaved changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!viewModel.hasUnsavedChanges) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: "Don't leave", style: 'cancel', onPress: () => {} },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              viewModel.resetUnsavedChanges();
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, viewModel]);

  const handleSave = async (noteTitle: string) => {
    const success = await viewModel.saveNote(noteTitle);
    if (success) {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.editorContainer}>
        <RichTextEditor
          initialContent={viewModel.content}
          onContentChange={viewModel.handleContentChange}
          placeholder="Start typing your note..."
        />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Text style={styles.charCount}>
          {viewModel.characterCount}/500
        </Text>
        <TouchableOpacity
          style={[styles.saveButton, !viewModel.canSave && styles.saveButtonDisabled]}
          onPress={viewModel.handleSavePress}
          disabled={!viewModel.canSave}
        >
          <Text style={styles.saveButtonText}>
            {viewModel.isEditing ? 'Update' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <SaveNoteModal
        visible={viewModel.showSaveModal}
        initialTitle={viewModel.title}
        onSave={handleSave}
        onCancel={viewModel.cancelSave}
      />

      <Toast />
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  editorContainer: {
    flex: 1,
    padding: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  charCount: {
    fontSize: 14,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NoteEditorScreen;
