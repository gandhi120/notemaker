import React from 'react';
import 'react-native-gesture-handler';
import { StoreProvider } from './src/stores/StoreProvider';
import RootNavigator from './src/navigation/RootNavigator';

function App(): React.JSX.Element {
  return (
    <StoreProvider>
      <RootNavigator />
    </StoreProvider>
  );
}

export default App;
