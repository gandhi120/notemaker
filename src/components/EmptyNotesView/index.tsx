import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles';

interface EmptyNotesViewProps {
  message?: string;
}

export const EmptyNotesView: React.FC<EmptyNotesViewProps> = ({
  message = 'No notes yet. Tap the + button to create your first note!',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📝</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};
