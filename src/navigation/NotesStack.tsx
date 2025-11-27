import React from 'react';
import { StatusBar } from 'react-native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotesStackParamList } from './types';
import MyNotesScreen from '../views/screens/MyNotesScreen';
import NoteEditorScreen from '../views/screens/NoteEditorScreen';

const Stack = createStackNavigator<NotesStackParamList>();

const NotesStack: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <Stack.Navigator
        initialRouteName="MyNotes"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
            elevation: 0,
            shadowOpacity: 0,
            height: 56 + insets.top,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerStatusBarHeight: insets.top,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      >
        <Stack.Screen
          name="MyNotes"
          component={MyNotesScreen}
          options={{ title: 'My Notes', headerTestID: 'mynotes-header' }}
        />
        <Stack.Screen
          name="NoteEditor"
          component={NoteEditorScreen}
          options={{ title: 'Note Editor', headerTestID: 'editor-header' }}
        />
      </Stack.Navigator>
    </>
  );
};

export default NotesStack;
