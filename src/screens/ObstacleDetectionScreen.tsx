import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Text,
  BackHandler,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import ObstacleDetector from '../components/ObstacleDetector';
import Tts from 'react-native-tts';

// ตั้งสถานะสำหรับการพูดข้อความให้ผู้ใช้
interface ObstacleInfo {
  name: string;
  distance: string;
  timestamp: number;
}

const ObstacleDetectionScreen = () => {
  const navigation = useNavigation();
  const [detectedObstacles, setDetectedObstacles] = useState<ObstacleInfo[]>(
    [],
  );

  // จัดการกับการกดปุ่มย้อนกลับ
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.goBack();
        return true;
      },
    );

    // ตั้งค่า TTS เมื่อเปิดหน้าจอ
    Tts.setDefaultLanguage('th-TH');
    Tts.setDefaultRate(0.5);
    Tts.speak('เริ่มโหมดตรวจจับสิ่งกีดขวาง กด 2 ครั้งเพื่อกลับหน้าหลัก');

    return () => {
      // หยุดเสียงและล้างการฟังปุ่มกลับเมื่อออกจากหน้าจอ
      Tts.stop();
      backHandler.remove();
    };
  }, [navigation]);

  // จัดการเมื่อตรวจพบสิ่งกีดขวาง
  const handleObstacleDetected = (obstacleName: string, distance: string) => {
    const timestamp = Date.now();

    // ปรับปรุงรายการสิ่งกีดขวางที่ตรวจพบ
    setDetectedObstacles(prev => {
      const filtered = prev.filter(
        obs => obs.name !== obstacleName || timestamp - obs.timestamp > 3000,
      );
      return [...filtered, {name: obstacleName, distance, timestamp}].slice(-5); // เก็บแค่ 5 รายการล่าสุด
    });
  };

  // ฟังก์ชันสำหรับกลับไปหน้าหลัก
  const goBack = () => {
    Tts.speak('กลับหน้าหลัก');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* แสดงการตรวจจับสิ่งกีดขวาง */}
      <ObstacleDetector onObstacleDetected={handleObstacleDetected} />

      {/* ปุ่มย้อนกลับด้านล่าง */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={goBack}
        activeOpacity={0.7}>
        <Text style={styles.backButtonText}>กลับหน้าหลัก (กด 2 ครั้ง)</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ObstacleDetectionScreen;
