import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

// Initialize TensorFlow.js for React Native
tf.ready().then(() => {
  console.log('TensorFlow.js is ready');
});
