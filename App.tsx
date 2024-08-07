import React from 'react';
import {TamaguiProvider, View, createTamagui} from '@tamagui/core';
import {config} from '@tamagui/config/v3';
import {SpeechScreen} from './src/screens';
import Maps from './src/components/Maps';

const tamaguiConfig = createTamagui(config);

type Conf = typeof tamaguiConfig;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}

export default () => {
  return (
    <TamaguiProvider config={tamaguiConfig}>
      <SpeechScreen />
      <Maps />
    </TamaguiProvider>
  );
};
