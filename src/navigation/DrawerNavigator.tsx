import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DrawerParamList } from './types';
import HomeScreen from '../views/screens/HomeScreen';
import NotesStack from './NotesStack';

const Drawer = createDrawerNavigator<DrawerParamList>();

const DrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
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
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          drawerLabel: 'Home',
        }}
      />
      <Drawer.Screen
        name="NotesStack"
        component={NotesStack}
        options={{
          title: 'Notes',
          drawerLabel: 'My Notes',
          headerShown: false,
        }}
      />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
