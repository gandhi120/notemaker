import React, { useState, useEffect } from 'react';
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
import { showSuccessToast, showErrorToast } from '../../config/toast';

type NoteEditorScreenProps = NotesStackScreenProps<'NoteEditor'>;

const NoteEditorScreen: React.FC<NoteEditorScreenProps> = observer(({ navigation, route }) => {
  const { noteId } = route.params;
  const notesStore = useNotesStore();
  const isEditing = !!noteId;
  const insets = useSafeAreaInsets();

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load existing note if editing
  useEffect(() => {
    if (isEditing && noteId) {
      notesStore.selectNote(noteId);
      const note = notesStore.selectedNote;
      if (note) {
        setContent(note.content);
        setTitle(note.title);
      }
    }
  }, [isEditing, noteId, notesStore]);

  // Handle back button press with unsaved changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasUnsavedChanges) {
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
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, hasUnsavedChanges]);

  const handleContentChange = (html: string) => {
    setContent(html);
    setHasUnsavedChanges(true);
  };

  const handleSavePress = () => {
    if (!content.trim()) {
      showErrorToast('Cannot save empty note', 'Please add some content before saving.');
      return;
    }

    if (content.length > 500) {
      showErrorToast('Content too long', 'Note content cannot exceed 500 characters.');
      return;
    }

    setShowSaveModal(true);
  };

  const handleSave = async (noteTitle: string) => {
    if (!noteTitle.trim()) {
      showErrorToast('Title required', 'Please enter a note title.');
      return;
    }

    if (noteTitle.length > 50) {
      showErrorToast('Title too long', 'Note title cannot exceed 50 characters.');
      return;
    }

    // Check for duplicate names using Realm (excluding current note if editing)
    const isDuplicate = notesStore.checkDuplicateName(noteTitle, noteId);

    if (isDuplicate) {
      showErrorToast(
        'Duplicate title',
        'A note with this title already exists. Please choose another title.'
      );
      return;
    }

    try {
      if (isEditing && noteId) {
        // Update existing note in Realm
        notesStore.updateNote(noteId, {
          title: noteTitle,
          content: content,
          updatedAt: new Date(),
        });
        showSuccessToast('Note updated successfully!');
      } else {
        // Create new note in Realm
        const newNote = {
          id: `note_${Date.now()}`,
          title: noteTitle,
          content: content,
          createdAt: new Date(),
          updatedAt: new Date(),
          isSynced: false,
        };
        notesStore.addNote(newNote);
        showSuccessToast('Note saved successfully!');
      }

      setHasUnsavedChanges(false);
      setShowSaveModal(false);

      // Reload notes from Realm before navigating back
      await notesStore.loadNotes();
      navigation.goBack();
    } catch (error) {
      showErrorToast('Save failed', 'An error occurred while saving the note.');
      console.error('Save error:', error);
    }
  };

  const handleCancel = () => {
    setShowSaveModal(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.editorContainer}>
        <RichTextEditor
          initialContent={content}
          onContentChange={handleContentChange}
          placeholder="Start typing your note..."
        />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Text style={styles.charCount}>
          {content.replace(/<[^>]*>/g, '').length}/500
        </Text>
        <TouchableOpacity
          style={[styles.saveButton, !content.trim() && styles.saveButtonDisabled]}
          onPress={handleSavePress}
          disabled={!content.trim()}
        >
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Update' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <SaveNoteModal
        visible={showSaveModal}
        initialTitle={title}
        onSave={handleSave}
        onCancel={handleCancel}
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
