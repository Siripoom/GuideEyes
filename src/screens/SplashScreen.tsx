import React, {Component} from 'react';
import {Text, StyleSheet, View} from 'react-native';

export const SplashScreen = () => {
  return (
    <View style={styles.mainView}>
      <Text style={styles.textCenter}> GuideEyes </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  mainView: {
    flex: 1,
  },
  textCenter: {
    alignSelf: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    fontSize: 50,
  },
});
