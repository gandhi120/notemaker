import { NavigatorScreenParams } from '@react-navigation/native';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { StackScreenProps } from '@react-navigation/stack';

// Root Stack
export type RootStackParamList = {
  Home: undefined;
  Drawer: NavigatorScreenParams<DrawerParamList>;
};

// Drawer Navigator
export type DrawerParamList = {
  NotesStack: NavigatorScreenParams<NotesStackParamList>;
};

// Notes Stack Navigator
export type NotesStackParamList = {
  MyNotes: undefined;
  NoteEditor: { noteId?: string };
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;

export type DrawerScreenPropsType<T extends keyof DrawerParamList> =
  DrawerScreenProps<DrawerParamList, T>;

export type NotesStackScreenProps<T extends keyof NotesStackParamList> =
  StackScreenProps<NotesStackParamList, T>;

// Navigation Prop Types (for useNavigation hook)
export type RootNavigationProp = RootStackScreenProps<'Home'>['navigation'];

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
