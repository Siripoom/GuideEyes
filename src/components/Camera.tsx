import React, {useState, useRef} from 'react';
import {StyleSheet, View, Text, TouchableOpacity} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import {useIsFocused} from '@react-navigation/native';
import Tts from 'react-native-tts';

export const CameraComponent = () => {
  const device = useCameraDevice('back');
  const {hasPermission} = useCameraPermission();
  const camera = useRef<Camera>(null);
  const isFocused = useIsFocused();

  // ตั้งค่า TTS เมื่อคอมโพเนนต์โหลด
  React.useEffect(() => {
    Tts.setDefaultLanguage('th-TH');
    Tts.setDefaultRate(0.5);

    // ขอสิทธิ์กล้องทันทีที่โหลดคอมโพเนนต์
    Camera.requestCameraPermission();
  }, []);

  const detectObject = () => {
    const objects = ['คน', 'รถยนต์', 'รถจักรยานยนต์', 'ประตู', 'ทางเดิน'];
    const randomObject = objects[Math.floor(Math.random() * objects.length)];
    Tts.speak(`พบ ${randomObject} ข้างหน้า`);
  };

  // ถ้าไม่มีอุปกรณ์กล้อง แสดงข้อความรอ
  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>กำลังโหลดกล้อง...</Text>
      </View>
    );
  }

  // ถ้ามีอุปกรณ์กล้อง แสดงกล้องเลย
  return (
    <View style={styles.container}>
      {isFocused && (
        <>
          <Camera
            ref={camera}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
          />
          <TouchableOpacity style={styles.detectButton} onPress={detectObject}>
            <Text style={styles.buttonText}>ตรวจจับวัตถุ</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  text: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  detectButton: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default CameraComponent;
