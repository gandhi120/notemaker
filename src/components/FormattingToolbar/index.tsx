import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { EditorBridge } from '@10play/tentap-editor';
import { styles } from './styles';

interface FormattingToolbarProps {
  editor: EditorBridge;
}

export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({ editor }) => {
  const toggleBold = () => {
    editor.toggleBold();
  };

  const toggleItalic = () => {
    editor.toggleItalic();
  };

  const toggleUnderline = () => {
    editor.toggleUnderline();
  };

  const toggleBulletList = () => {
    editor.toggleBulletList();
  };

  const toggleOrderedList = () => {
    editor.toggleOrderedList();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={toggleBold}>
        <Text style={styles.buttonText}>B</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={toggleItalic}>
        <Text style={[styles.buttonText, styles.italic]}>I</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={toggleUnderline}>
        <Text style={[styles.buttonText, styles.underline]}>U</Text>
      </TouchableOpacity>

      <View style={styles.separator} />

      <TouchableOpacity style={styles.button} onPress={toggleBulletList}>
        <Text style={styles.buttonText}>•</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={toggleOrderedList}>
        <Text style={styles.buttonText}>1.</Text>
      </TouchableOpacity>
    </View>
  );
};
