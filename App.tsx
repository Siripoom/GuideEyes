import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import AppNavigation from './src/navigations/AppNavigation';
import {TamaguiProvider, createTamagui} from '@tamagui/core';
import {config} from '@tamagui/config';

const tamaguiConfig = createTamagui(config);

const App = () => {
  return (
    <TamaguiProvider config={tamaguiConfig}>
      <NavigationContainer>
        <AppNavigation />
      </NavigationContainer>
    </TamaguiProvider>
  );
};

export default App;
