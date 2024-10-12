// import React, {useEffect} from 'react';
// import {StyleSheet, View} from 'react-native';
// import {Camera, useCameraDevices} from 'react-native-vision-camera';

// const CameraScreen = () => {
//   const devices = useCameraDevices();
//   const device = devices.back;

//   useEffect(() => {
//     (async () => {
//       const permission = await Camera.requestCameraPermission();
//       if (permission === 'denied') {
//         console.log('Camera permission denied');
//       }
//     })();
//   }, []);

//   if (device == null) return <View style={styles.loading} />;

//   return (
//     <View style={styles.container}>
//       <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   loading: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

// export default CameraScreen;
