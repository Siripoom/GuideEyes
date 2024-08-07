import React from 'react';
import {TamaguiProvider, View, createTamagui} from '@tamagui/core';
import {config} from '@tamagui/config/v3';
import {SpeechScreen} from './src/screens';
import MapView from 'react-native-maps';
import {StyleSheet} from 'react-native';

const tamaguiConfig = createTamagui(config);

type Conf = typeof tamaguiConfig;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}

export default () => {
  return (
    <TamaguiProvider config={tamaguiConfig}>
      <SpeechScreen />
      <View style={{flex: 1}}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        />
      </View>
    </TamaguiProvider>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
