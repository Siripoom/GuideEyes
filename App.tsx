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
  // const device = useCameraDevice('back');
  // const {hasPermission} = useCameraPermission();

  // if (!hasPermission) return <PermissionsPage />;
  // if (device == null) return <NoCameraDeviceError />;
  return (
    <TamaguiProvider config={tamaguiConfig}>
      <SpeechScreen />
      <Maps />
      {/* <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} />  It's don't work*/}
    </TamaguiProvider>
  );
};
