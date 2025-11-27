import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NotesStackParamList } from './types';
import MyNotesScreen from '../views/screens/MyNotesScreen';
import NoteEditorScreen from '../views/screens/NoteEditorScreen';

const Stack = createStackNavigator<NotesStackParamList>();

const NotesStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="MyNotes"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="MyNotes"
        component={MyNotesScreen}
        options={{ title: 'My Notes' }}
      />
      <Stack.Screen
        name="NoteEditor"
        component={NoteEditorScreen}
        options={{ title: 'Note Editor' }}
      />
    </Stack.Navigator>
  );
};

export default NotesStack;
