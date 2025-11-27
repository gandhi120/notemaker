import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { NotesStackScreenProps } from '../../navigation/types';
import { useNotesStore } from '../../stores/StoreProvider';
import { NoteCard } from '../../components/NoteCard';
import { EmptyNotesView } from '../../components/EmptyNotesView';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import { NoteState } from '../../types';
import { MyNotesViewModel } from '../../viewmodels/MyNotesViewModel';

type MyNotesScreenProps = NotesStackScreenProps<'MyNotes'>;

const MyNotesScreen: React.FC<MyNotesScreenProps> = observer(({ navigation }) => {
  const notesStore = useNotesStore();
  const insets = useSafeAreaInsets();

  // Delete confirmation state
  const [noteToDelete, setNoteToDelete] = useState<NoteState | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Create ViewModel instance
  const viewModel = useMemo(
    () => new MyNotesViewModel(notesStore),
    [notesStore]
  );

  // Initialize ViewModel on mount
  useEffect(() => {
    viewModel.initialize();
    return () => {
      viewModel.cleanup();
    };
  }, [viewModel]);

  // Reload notes when screen comes into focus (after creating/editing)
  useFocusEffect(
    React.useCallback(() => {
      viewModel.loadNotes();
    }, [viewModel])
  );

  const handleNotePress = (noteId: string) => {
    navigation.navigate('NoteEditor', { noteId });
  };

  const handleCreateNote = () => {
    navigation.navigate('NoteEditor', {});
  };

  const handleDeletePress = (note: NoteState) => {
    setNoteToDelete(note);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setNoteToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;

    setShowDeleteModal(false);

    // Optimistic UI - delete happens immediately
    const success = await viewModel.deleteNote(noteToDelete.id);

    if (success) {
      Toast.show({
        type: 'success',
        text1: 'Note deleted successfully',
        position: 'bottom',
        visibilityTime: 2000,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Failed to delete note',
        text2: 'Please try again',
        position: 'bottom',
        visibilityTime: 3000,
      });
    }

    setNoteToDelete(null);
  };

  const renderNoteCard = ({ item }: { item: NoteState }) => (
    <NoteCard
      note={item}
      onPress={() => handleNotePress(item.id)}
      onDelete={() => handleDeletePress(item)}
    />
  );

  const renderEmptyState = () => {
    if (viewModel.searchQuery) {
      return (
        <EmptyNotesView
          message={`No notes found for "${viewModel.searchQuery}"`}
        />
      );
    }
    return (
      <EmptyNotesView
        message="No notes yet. Tap the + button to create your first note!"
      />
    );
  };

  return (
    <View style={styles.container} testID="mynotes-screen">
      {/* Search Header - Fixed outside FlatList to prevent blur */}
      <View style={styles.headerContainer} testID="mynotes-header">
        <TextInput
          style={styles.searchInput}
          placeholder="Search notes..."
          placeholderTextColor="#999"
          value={viewModel.searchQuery}
          onChangeText={viewModel.setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          testID="mynotes-search-input"
        />
        {viewModel.unsyncedCount > 0 && (
          <View style={styles.syncBadge} testID="mynotes-sync-badge">
            <Text style={styles.syncBadgeText} testID="mynotes-sync-badge-text">
              {viewModel.unsyncedCount} unsynced
            </Text>
          </View>
        )}
      </View>

      {/* Notes List */}
      <FlatList
        data={viewModel.filteredNotes}
        renderItem={renderNoteCard}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          viewModel.filteredNotes.length === 0 ? styles.emptyContainer : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={viewModel.isRefreshing}
            onRefresh={viewModel.refreshNotes}
            tintColor="#007AFF"
          />
        }
        keyboardShouldPersistTaps="handled"
        testID="mynotes-list"
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 20 + insets.bottom }]}
        onPress={handleCreateNote}
        activeOpacity={0.8}
        testID="mynotes-fab"
      >
        <Text style={styles.fabIcon} testID="mynotes-fab-icon">+</Text>
      </TouchableOpacity>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        visible={showDeleteModal}
        noteTitle={noteToDelete?.title || ''}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />

      <Toast />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  searchInput: {
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
  },
  syncBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncBadgeText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
    lineHeight: 32,
  },
});

export default MyNotesScreen;
