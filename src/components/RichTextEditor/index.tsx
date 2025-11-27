import React, { useRef } from 'react';
import { View } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { styles } from './styles';

interface RichTextEditorProps {
  initialContent?: string;
  onContentChange?: (html: string) => void;
  placeholder?: string;
  testID?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialContent = '',
  onContentChange,
  placeholder = 'Start typing your note...',
  testID = 'rich-text-editor',
}) => {
  const richText = useRef<RichEditor>(null);

  const handleContentChange = (html: string) => {
    if (onContentChange) {
      onContentChange(html);
    }
  };

  return (
    <View style={styles.container} testID={testID}>
      <RichToolbar
        editor={richText}
        actions={[
          actions.setBold,
          actions.setItalic,
          actions.setUnderline,
          actions.insertBulletsList,
          actions.insertOrderedList,
          actions.heading1,
          actions.heading2,
          actions.setStrikethrough,
          actions.undo,
          actions.redo,
        ]}
        iconTint="#000000"
        selectedIconTint="#2095F2"
        disabledIconTint="#bfbfbf"
        testID={`${testID}-toolbar`}
      />
      <RichEditor
        ref={richText}
        onChange={handleContentChange}
        placeholder={placeholder}
        initialContentHTML={initialContent}
        style={styles.editor}
        androidHardwareAccelerationDisabled={true}
        initialFocus={true}
        testID={`${testID}-webview`}
      />
    </View>
  );
};
