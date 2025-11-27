import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RootStackScreenProps } from '../../navigation/types';

type HomeScreenProps = RootStackScreenProps<'Home'>;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const handleGoToNotes = () => {
    // Navigate to Drawer which will open MyNotesScreen by default
    navigation.navigate('Drawer', {
      screen: 'NotesStack',
      params: {
        screen: 'MyNotes',
      },
    });
  };

  return (
    <View style={styles.container} testID="home-screen">
      <Text style={styles.title} testID="home-title">Welcome to NoteMaker</Text>
      <Text style={styles.subtitle} testID="home-subtitle">Your smart note-taking companion</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleGoToNotes}
        testID="home-navigate-button"
      >
        <Text style={styles.buttonText} testID="home-navigate-button-text">Go to My Notes</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
