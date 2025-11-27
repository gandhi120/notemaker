import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DrawerParamList } from './types';
import NotesStack from './NotesStack';

const Drawer = createDrawerNavigator<DrawerParamList>();

const DrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      initialRouteName="NotesStack"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerActiveTintColor: '#007AFF',
        drawerInactiveTintColor: '#666',
      }}
    >
      <Drawer.Screen
        name="NotesStack"
        component={NotesStack}
        options={{
          title: 'Notes',
          drawerLabel: 'My Notes',
          headerShown: false,
          drawerItemStyle: { testID: 'drawer-mynotes' },
        }}
      />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
