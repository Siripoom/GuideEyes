// Camera.tsx
import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import Tts from 'react-native-tts';
import axios from 'axios';
import Config from 'react-native-config';

// ใช้ API Key จาก .env file
const GOOGLE_VISION_API_KEY =
  Config.GOOGLE_VISION_API_KEY || 'AIzaSyDL24tbIFnNVaRsSZM9bpoN54NtyTKIj74';

const CameraComponent = () => {
  const device = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();
  const camera = useRef<Camera>(null);
  const isFocused = useIsFocused();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setupCamera();
    setupTTS();
  }, []);

  useEffect(() => {
    // ตรวจจับอัตโนมัติทุก 5 วินาที
    if (isReady && isFocused) {
      const interval = setInterval(() => {
        detectObject();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isReady, isFocused]);

  const setupCamera = async () => {
    try {
      let permission = hasPermission;
      if (!permission) {
        permission = await requestPermission();
      }

      if (!permission) {
        setError('ไม่ได้รับอนุญาตให้ใช้กล้อง');
        return;
      }

      setIsReady(true);
    } catch (err) {
      console.error('Camera setup error:', err);
      setError('ไม่สามารถเปิดกล้องได้');
    }
  };

  const setupTTS = () => {
    try {
      Tts.setDefaultLanguage('th-TH');
      Tts.setDefaultRate(0.7);
      Tts.speak('กล้องพร้อมตรวจจับสิ่งกีดขวาง');
    } catch (err) {
      console.error('TTS setup error:', err);
    }
  };

  const detectObject = async () => {
    if (isProcessing || !camera.current) return;

    try {
      setIsProcessing(true);
      Tts.speak('กำลังตรวจจับ');

      // ถ่ายรูป
      const photo = await camera.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });

      // แปลงรูปเป็น base64
      const response = await fetch(`file://${photo.path}`);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          resolve(base64data.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // เรียก Google Vision API
      const visionResponse = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
        {
          requests: [
            {
              image: {
                content: base64,
              },
              features: [
                {type: 'OBJECT_LOCALIZATION', maxResults: 10},
                {type: 'LABEL_DETECTION', maxResults: 10},
              ],
            },
          ],
        },
      );

      const objects =
        visionResponse.data.responses[0].localizedObjectAnnotations || [];
      const labels = visionResponse.data.responses[0].labelAnnotations || [];

      analyzeDetections(objects, labels);
    } catch (error) {
      console.error('Detection error:', error);
      Tts.speak('ไม่สามารถตรวจจับได้ กรุณาลองใหม่');
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeDetections = (objects: any[], labels: any[]) => {
    // กรองเฉพาะวัตถุที่เป็นสิ่งกีดขวาง
    const relevantObjects = [
      'Person',
      'Car',
      'Bicycle',
      'Motorcycle',
      'Bus',
      'Truck',
      'Chair',
      'Table',
      'Bench',
      'Dog',
      'Cat',
      'Tree',
      'Pole',
      'Traffic light',
      'Stop sign',
      'Door',
      'Window',
      'Stair',
      'Bottle',
      'Cup',
      'Bag',
      'Suitcase',
      'Box',
      'Trash can',
    ];

    const detectedObstacles = objects.filter(
      obj => obj.score > 0.5 && relevantObjects.includes(obj.name),
    );

    if (detectedObstacles.length === 0) {
      // ถ้าไม่พบวัตถุ ให้ดูจาก labels
      const obstacleLabels = labels.filter(
        label =>
          label.score > 0.7 &&
          [
            'Street',
            'Road',
            'Sidewalk',
            'Path',
            'Walkway',
            'Stairs',
            'Obstacle',
          ].some(keyword =>
            label.description.toLowerCase().includes(keyword.toLowerCase()),
          ),
      );

      if (obstacleLabels.length > 0) {
        Tts.speak(`พบ ${translateLabel(obstacleLabels[0].description)}`);
      } else {
        Tts.speak('ทางเดินปลอดภัย');
      }
      return;
    }

    // จัดเรียงตามขนาดและตำแหน่ง
    detectedObstacles.sort((a, b) => {
      const aArea = calculateArea(a.boundingPoly);
      const bArea = calculateArea(b.boundingPoly);
      return bArea - aArea;
    });

    // สร้างข้อความแจ้งเตือน
    const messages = detectedObstacles.slice(0, 3).map(obj => {
      const position = getObjectPosition(obj.boundingPoly);
      const distance = estimateDistance(obj.boundingPoly);
      const objName = translateObjectName(obj.name);

      return `${objName} ${position} ${distance}`;
    });

    Tts.speak(`ระวัง! พบ ${messages.join(' และ ')}`);
  };

  const calculateArea = (boundingPoly: any) => {
    if (!boundingPoly || !boundingPoly.normalizedVertices) return 0;
    const vertices = boundingPoly.normalizedVertices;
    const width = Math.abs(vertices[1].x - vertices[0].x);
    const height = Math.abs(vertices[2].y - vertices[0].y);
    return width * height;
  };

  const getObjectPosition = (boundingPoly: any) => {
    if (!boundingPoly || !boundingPoly.normalizedVertices) return 'ข้างหน้า';

    const vertices = boundingPoly.normalizedVertices;
    const centerX = (vertices[0].x + vertices[2].x) / 2;

    if (centerX < 0.33) return 'ด้านซ้าย';
    if (centerX > 0.66) return 'ด้านขวา';
    return 'ตรงหน้า';
  };

  const estimateDistance = (boundingPoly: any) => {
    const area = calculateArea(boundingPoly);

    if (area > 0.4) return 'ใกล้มาก';
    if (area > 0.2) return 'ใกล้';
    if (area > 0.1) return 'ระยะกลาง';
    return 'ไกล';
  };

  const translateObjectName = (name: string): string => {
    const translations: {[key: string]: string} = {
      Person: 'คน',
      Car: 'รถยนต์',
      Bicycle: 'จักรยาน',
      Motorcycle: 'รถจักรยานยนต์',
      Bus: 'รถบัส',
      Truck: 'รถบรรทุก',
      Chair: 'เก้าอี้',
      Table: 'โต๊ะ',
      Bench: 'ม้านั่ง',
      Dog: 'สุนัข',
      Cat: 'แมว',
      Tree: 'ต้นไม้',
      Pole: 'เสา',
      'Traffic light': 'ไฟจราจร',
      'Stop sign': 'ป้ายหยุด',
      Door: 'ประตู',
      Window: 'หน้าต่าง',
      Stair: 'บันได',
      Stairs: 'บันได',
      Bottle: 'ขวด',
      Cup: 'แก้ว',
      Bag: 'กระเป๋า',
      Suitcase: 'กระเป๋าเดินทาง',
      Box: 'กล่อง',
      'Trash can': 'ถังขยะ',
    };
    return translations[name] || name;
  };

  const translateLabel = (label: string): string => {
    const translations: {[key: string]: string} = {
      Street: 'ถนน',
      Road: 'ถนน',
      Sidewalk: 'ทางเท้า',
      Path: 'ทางเดิน',
      Walkway: 'ทางเดิน',
      Stairs: 'บันได',
      Obstacle: 'สิ่งกีดขวาง',
    };

    // ค้นหาคำที่ตรงกัน
    for (const [eng, thai] of Object.entries(translations)) {
      if (label.toLowerCase().includes(eng.toLowerCase())) {
        return thai;
      }
    }
    return label;
  };

  const goBack = () => {
    Tts.stop();
    navigation.navigate('MicController');
  };

  // แสดง error
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={setupCamera}>
          <Text style={styles.buttonText}>ลองใหม่</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButtonError} onPress={goBack}>
          <Text style={styles.buttonText}>กลับหน้าหลัก</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // กำลังโหลด
  if (!isReady || !device) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.text}>กำลังเปิดกล้อง...</Text>
      </View>
    );
  }

  // แสดงกล้อง
  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        {isFocused && (
          <Camera
            ref={camera}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            photo={true}
            enableZoomGesture={false}
            onError={error => {
              console.error('Camera error:', error);
              setError('กล้องเกิดข้อผิดพลาด');
            }}
          />
        )}
      </View>

      <TouchableOpacity
        style={[styles.detectButton, isProcessing && styles.processingButton]}
        onPress={detectObject}
        disabled={isProcessing}>
        <Text style={styles.detectButtonText}>
          {isProcessing ? 'กำลังตรวจจับ...' : 'ตรวจจับ'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Text style={styles.backButtonText}>กลับหน้าหลัก</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  text: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  detectButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0, 150, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingButton: {
    backgroundColor: 'rgba(255, 165, 0, 0.7)',
  },
  detectButtonText: {
    color: 'white',
    fontSize: 50,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 5,
  },
  backButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(220, 20, 60, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 50,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 5,
  },
  retryButton: {
    marginTop: 20,
    alignSelf: 'center',
    backgroundColor: 'blue',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 25,
  },
  backButtonError: {
    marginTop: 20,
    alignSelf: 'center',
    backgroundColor: 'red',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default CameraComponent;
