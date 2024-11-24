// import React, {useEffect, useRef, useState} from 'react';
// import {View, Text, StyleSheet} from 'react-native';
// import {RNCamera} from 'react-native-camera';
// import * as tf from '@tensorflow/tfjs';
// import '@tensorflow/tfjs-react-native';
// import * as cocoSsd from '@tensorflow-models/coco-ssd';

// interface Detection {
//   class: string;
//   score: number;
//   bbox: [number, number, number, number]; // Bounding box
// }

// const ObstacleDetector = () => {
//   const cameraRef = useRef<RNCamera>(null);
//   const [isModelReady, setIsModelReady] = useState(false);
//   const [detections, setDetections] = useState<Detection[]>([]);

//   useEffect(() => {
//     const loadModel = async () => {
//       await tf.ready();
//       const model = await cocoSsd.load();
//       setIsModelReady(true);
//       detectObjects(model);
//     };

//     loadModel();
//   }, []);

//   const detectObjects = async (model: cocoSsd.ObjectDetection) => {
//     if (!cameraRef.current) return;

//     const loop = async () => {
//       if (!cameraRef.current) return;

//       const photo = await cameraRef.current.takePictureAsync({
//         quality: 0.5, // กำหนดคุณภาพของรูปภาพ
//       });

//       const imageTensor = tf.browser.fromPixels(photo);
//       const predictions = await model.detect(imageTensor);
//       setDetections(predictions);

//       requestAnimationFrame(loop);
//     };

//     loop();
//   };

//   return (
//     <View style={styles.container}>
//       <RNCamera
//         ref={cameraRef}
//         style={styles.camera}
//         type={RNCamera.Constants.Type.back}
//         captureAudio={false}
//       />
//       {isModelReady ? (
//         <View style={styles.overlay}>
//           {detections.map((det: Detection, index) => (
//             <Text key={index} style={styles.text}>
//               {det.class} - {Math.round(det.score * 100)}%
//             </Text>
//           ))}
//         </View>
//       ) : (
//         <Text style={styles.loadingText}>Loading model...</Text>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   camera: {
//     flex: 1,
//   },
//   overlay: {
//     position: 'absolute',
//     top: 10,
//     left: 10,
//     right: 10,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     padding: 10,
//     borderRadius: 5,
//   },
//   text: {
//     color: '#fff',
//     fontSize: 16,
//     marginBottom: 5,
//   },
//   loadingText: {
//     position: 'absolute',
//     top: '50%',
//     alignSelf: 'center',
//     fontSize: 18,
//     color: '#fff',
//   },
// });

// export default ObstacleDetector;
