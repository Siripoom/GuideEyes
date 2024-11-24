// src/pages/ObstacleDetectionPage.jsx
import React from 'react';
import {View, StyleSheet} from 'react-native';
// import ObstacleDetector from '../components/ObstacleDetector';

const ObstacleDetectionPage = () => {
  return <View style={styles.container}>{/* <ObstacleDetector /> */}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // พื้นหลังสีดำเพื่อให้เห็นการตรวจจับชัดเจน
  },
});

export default ObstacleDetectionPage;
