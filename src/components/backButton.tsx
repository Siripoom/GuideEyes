import React from 'react';
import {View, StyleSheet, Text, TouchableOpacity} from 'react-native';

import Tts from 'react-native-tts';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';

const BackButton: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();

  return (
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => {
        Tts.stop();
        navigation.navigate('MicController');
      }}>
      <Text style={styles.backButtonText}>ย้อนกลับ</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF3333',
    padding: 50,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 50,
    fontWeight: 'bold',
  },
});

export default BackButton;
