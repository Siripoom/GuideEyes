import React from 'react';
import {TamaguiProvider, createTamagui} from '@tamagui/core';
import {Button} from 'tamagui';
import {config} from '@tamagui/config/v3';
import {SpeechScreen} from './src/screens';
// you usually export this from a tamagui.config.ts file

const tamaguiConfig = createTamagui(config);
// TypeScript types across all Tamagui APIs

type Conf = typeof tamaguiConfig;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}
export default () => {
  return (
    <TamaguiProvider config={tamaguiConfig}>
      {/* your app here */}
      {/* <Button theme="blue">Hello world</Button> */}
      <SpeechScreen />
    </TamaguiProvider>
  );
};
