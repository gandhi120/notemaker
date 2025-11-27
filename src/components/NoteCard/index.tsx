import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import moment from 'moment';
import { NoteState } from '../../types';
import { styles } from './styles';

interface NoteCardProps {
  note: NoteState;
  onPress: () => void;
  onDelete?: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onPress, onDelete }) => {
  const handleDelete = (e: any) => {
    // Stop event propagation to prevent card press
    e?.stopPropagation?.();
    if (onDelete) {
      onDelete();
    }
  };
  const stripHtmlTags = (html: string): string => {
    return html.replace(/<[^>]*>/g, '');
  };

  const getPreview = (content: string): string => {
    const plainText = stripHtmlTags(content);
    return plainText.length > 100
      ? plainText.substring(0, 100) + '...'
      : plainText;
  };

  const formatDate = (date: Date): string => {
    const now = moment();
    const noteDate = moment(date);

    if (now.diff(noteDate, 'days') === 0) {
      return noteDate.format('h:mm A');
    } else if (now.diff(noteDate, 'days') === 1) {
      return 'Yesterday';
    } else if (now.diff(noteDate, 'days') < 7) {
      return noteDate.format('dddd');
    } else {
      return noteDate.format('MMM D, YYYY');
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7} testID={`note-card-${note.id}`}>
      <View style={styles.header} testID={`note-card-header-${note.id}`}>
        <Text style={styles.title} numberOfLines={1} testID={`note-card-title-${note.id}`}>
          {note.title}
        </Text>
        <View style={styles.headerRight} testID={`note-card-header-right-${note.id}`}>
          {!note.isSynced && <View style={styles.unsyncedIndicator} testID={`note-card-unsynced-${note.id}`} />}
          {onDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              activeOpacity={0.7}
              testID={`note-card-delete-${note.id}`}>
              <Text style={styles.deleteButtonText} testID={`note-card-delete-text-${note.id}`}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.preview} numberOfLines={2} testID={`note-card-preview-${note.id}`}>
        {getPreview(note.content)}
      </Text>

      <View style={styles.footer} testID={`note-card-footer-${note.id}`}>
        <Text style={styles.date} testID={`note-card-date-${note.id}`}>{formatDate(note.updatedAt)}</Text>
      </View>
    </TouchableOpacity>
  );
};
