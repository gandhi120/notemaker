import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';
import Toast from 'react-native-toast-message';
import { NotesStackScreenProps } from '../../navigation/types';
import { useNotesStore } from '../../stores/StoreProvider';
import { NoteCard } from '../../components/NoteCard';
import { EmptyNotesView } from '../../components/EmptyNotesView';
import { NoteState } from '../../types';

type MyNotesScreenProps = NotesStackScreenProps<'MyNotes'>;

const MyNotesScreen: React.FC<MyNotesScreenProps> = observer(({ navigation }) => {
  const notesStore = useNotesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  // Filter notes by search query
  const filteredNotes = notesStore.notes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNotePress = (noteId: string) => {
    navigation.navigate('NoteEditor', { noteId });
  };

  const handleCreateNote = () => {
    navigation.navigate('NoteEditor', {});
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh (in real app, this would fetch from API/Realm)
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderNoteCard = ({ item }: { item: NoteState }) => (
    <NoteCard note={item} onPress={() => handleNotePress(item.id)} />
  );

  const renderEmptyState = () => {
    if (searchQuery) {
      return (
        <EmptyNotesView
          message={`No notes found for "${searchQuery}"`}
        />
      );
    }
    return (
      <EmptyNotesView
        message="No notes yet. Tap the + button to create your first note!"
      />
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search notes..."
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      {notesStore.unsyncedNotesCount > 0 && (
        <View style={styles.syncBadge}>
          <Text style={styles.syncBadgeText}>
            {notesStore.unsyncedNotesCount} unsynced
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredNotes}
        renderItem={renderNoteCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          filteredNotes.length === 0 ? styles.emptyContainer : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 20 + insets.bottom }]}
        onPress={handleCreateNote}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

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
