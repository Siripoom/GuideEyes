import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import * as tf from '@tensorflow/tfjs';
import {bundleResourceIO} from '@tensorflow/tfjs-react-native';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import Tts from 'react-native-tts';

interface Detection {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

interface ObstacleDetectorProps {
  onObstacleDetected?: (obstacle: string, distance: string) => void;
}

const ObstacleDetector: React.FC<ObstacleDetectorProps> = ({
  onObstacleDetected,
}) => {
  const cameraRef = useRef<RNCamera>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTtsReady, setIsTtsReady] = useState(false);
  const [lastSpokenTime, setLastSpokenTime] = useState(0);

  // ขอสิทธิ์การใช้กล้อง
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'อนุญาตให้แอพใช้กล้อง',
            message: 'แอพต้องการใช้กล้องเพื่อตรวจจับสิ่งกีดขวาง',
            buttonNeutral: 'ถามภายหลัง',
            buttonNegative: 'ยกเลิก',
            buttonPositive: 'ตกลง',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('ไม่ได้รับอนุญาตให้ใช้กล้อง');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  // ตั้งค่า TensorFlow.js และโหลดโมเดล
  useEffect(() => {
    const setupTfjs = async () => {
      await requestCameraPermission();

      // ตั้งค่า Text-to-Speech
      Tts.setDefaultLanguage('th-TH');
      Tts.setDefaultRate(0.5);

      Tts.addEventListener('tts-start', () => console.log('TTS Started'));
      Tts.addEventListener('tts-finish', () => console.log('TTS Finished'));
      Tts.addEventListener('tts-cancel', () => console.log('TTS Cancelled'));
      setIsTtsReady(true);

      try {
        // เริ่มต้น TensorFlow.js
        await tf.ready();
        console.log('TensorFlow.js is ready');

        // โหลดโมเดล COCO-SSD
        const model = await cocoSsd.load();
        console.log('COCO-SSD model loaded');

        setIsModelReady(true);

        // เริ่มการตรวจจับ
        if (model) {
          detectFrame(model);
        }
      } catch (error) {
        console.error('Failed to load the model:', error);
      }
    };

    setupTfjs();

    return () => {
      // ล้างข้อมูล TTS เมื่อ component unmount
      Tts.stop();
      ['tts-start', 'tts-finish', 'tts-cancel'].forEach(eventType => {
        Tts.removeAllListeners(eventType);
      });
    };
  }, []);

  // ประเมินระยะทางจากขนาดของกล่องที่ตรวจจับได้
  const estimateDistance = (
    width: number,
    height: number,
    viewWidth: number,
    viewHeight: number,
  ): string => {
    // คำนวณอัตราส่วนของพื้นที่วัตถุต่อพื้นที่ภาพ
    const objectArea = width * height;
    const viewArea = viewWidth * viewHeight;
    const ratio = objectArea / viewArea;

    // ประเมินระยะทางขั้นต้น (สามารถปรับเปลี่ยนตามความเหมาะสม)
    if (ratio > 0.4) {
      return 'ใกล้มาก';
    } else if (ratio > 0.2) {
      return 'ใกล้';
    } else if (ratio > 0.1) {
      return 'ปานกลาง';
    } else {
      return 'ไกล';
    }
  };

  // แปลชื่อประเภทวัตถุเป็นภาษาไทย
  const translateObjectClass = (className: string): string => {
    const translations: {[key: string]: string} = {
      person: 'คน',
      bicycle: 'จักรยาน',
      car: 'รถยนต์',
      motorcycle: 'มอเตอร์ไซค์',
      bus: 'รถเมล์',
      truck: 'รถบรรทุก',
      // traffic light: 'ไฟจราจร',
      // fire hydrant: 'หัวดับเพลิง',
      // stop sign: 'ป้ายหยุด',
      bench: 'ม้านั่ง',
      dog: 'สุนัข',
      cat: 'แมว',
    };

    return translations[className] || className;
  };

  // ทำการตรวจจับวัตถุจากเฟรมของกล้อง
  const detectFrame = async (model: cocoSsd.ObjectDetection) => {
    if (!cameraRef.current || isProcessing || !isModelReady) return;

    setIsProcessing(true);

    try {
      // ถ่ายภาพจากกล้อง
      const options = {quality: 0.5, base64: true};
      const data = await cameraRef.current.takePictureAsync(options);

      // แปลงภาพเป็น tensor
      const imgBuffer = tf.util.encodeString(data.base64!);
      const raw = tf.browser.fromPixels(data);
      const tensor = tf.expandDims(raw, 0);

      // ตรวจจับวัตถุในภาพ
      const predictions = await model.detect(tensor as any);

      // เก็บผลการตรวจจับ
      setDetections(predictions);

      // แจ้งเตือนเมื่อตรวจพบสิ่งกีดขวาง
      if (predictions.length > 0 && isTtsReady) {
        const currentTime = Date.now();
        // แจ้งเตือนทุกๆ 3 วินาที (ป้องกันเสียงพูดซ้ำๆ)
        if (currentTime - lastSpokenTime > 3000) {
          // เลือกการตรวจจับที่มีคะแนนสูงสุด
          const topDetection = predictions.sort((a, b) => b.score - a.score)[0];
          const viewWidth = 1080; // สมมติว่าความกว้างของภาพคือ 1080px
          const viewHeight = 1920; // สมมติว่าความสูงของภาพคือ 1920px

          const distance = estimateDistance(
            topDetection.bbox[2],
            topDetection.bbox[3],
            viewWidth,
            viewHeight,
          );

          const thaiClassName = translateObjectClass(topDetection.class);
          const messageToSpeak = `พบ${thaiClassName} ${distance}`;

          Tts.speak(messageToSpeak);
          setLastSpokenTime(currentTime);

          if (onObstacleDetected) {
            onObstacleDetected(thaiClassName, distance);
          }
        }
      }

      // ล้าง tensors
      tf.dispose([imgBuffer, raw, tensor]);
    } catch (error) {
      console.error('Error in detection:', error);
    } finally {
      setIsProcessing(false);
      // ทำการตรวจจับเฟรมถัดไป
      setTimeout(() => detectFrame(model), 1000);
    }
  };

  return (
    <View style={styles.container}>
      {isModelReady ? (
        <>
          <RNCamera
            ref={cameraRef}
            style={styles.camera}
            type={RNCamera.Constants.Type.back}
            captureAudio={false}
            androidCameraPermissionOptions={{
              title: 'อนุญาตให้แอพใช้กล้อง',
              message: 'แอพต้องการใช้กล้องเพื่อตรวจจับสิ่งกีดขวาง',
              buttonPositive: 'ตกลง',
              buttonNegative: 'ยกเลิก',
            }}
          />
          <View style={styles.overlay}>
            {detections.map((det, index) => {
              // คำนวณตำแหน่งของกรอบสี่เหลี่ยม
              const viewWidth = 1080; // สมมติว่าความกว้างของจอคือ 1080px
              const viewHeight = 1920; // สมมติว่าความสูงของจอคือ 1920px

              const x = (det.bbox[0] / viewWidth) * 100;
              const y = (det.bbox[1] / viewHeight) * 100;
              const width = (det.bbox[2] / viewWidth) * 100;
              const height = (det.bbox[3] / viewHeight) * 100;

              return (
                <View
                  key={index}
                  style={[
                    styles.boundingBox,
                    {
                      left: `${x}%`,
                      top: `${y}%`,
                      width: `${width}%`,
                      height: `${height}%`,
                    },
                  ]}
                />
              );
            })}
          </View>
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>กำลังโหลดโมเดล...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'red',
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});

export default ObstacleDetector;
