import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import moment from 'moment';
import { NoteState } from '../../types';
import { styles } from './styles';

interface NoteCardProps {
  note: NoteState;
  onPress: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onPress }) => {
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
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {note.title}
        </Text>
        {!note.isSynced && <View style={styles.unsyncedIndicator} />}
      </View>

      <Text style={styles.preview} numberOfLines={2}>
        {getPreview(note.content)}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.date}>{formatDate(note.updatedAt)}</Text>
      </View>
    </TouchableOpacity>
  );
};
