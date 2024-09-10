import React, {useState, useEffect} from 'react';
import {
  View,
  Button,
  PermissionsAndroid,
  Platform,
  Text,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import {log} from '@tensorflow/tfjs';

export const Speech: React.FC = () => {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'การขออนุญาตใช้ไมโครโฟน',
            message: 'แอปต้องการเข้าถึงไมโครโฟนของคุณเพื่อรับรู้เสียงพูด',
            buttonNeutral: 'ถามฉันทีหลัง',
            buttonNegative: 'ยกเลิก',
            buttonPositive: 'ตกลง',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('การอนุญาตใช้ไมโครโฟนได้รับการอนุมัติ');
        } else {
          console.log('การอนุญาตใช้ไมโครโฟนถูกปฏิเสธ');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const startRecognition = async () => {
    setResults([]);
    try {
      const data = await Voice.start('th-TH', {
        RECOGNIZER_ENGINE: 'services',
        EXTRA_PARTIAL_RESULTS: true,
      });
      console.log(data);
      setIsRecognizing(true);
    } catch (e) {
      console.error(e);
    }
  };

  const stopRecognition = async () => {
    try {
      await Voice.stop();
      setIsRecognizing(false);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    requestMicrophonePermission();
    Voice.onSpeechResults = (e: any) => {
      setResults(e.value);
      handleSpeechResults(e.value);
    };
    Voice.onSpeechError = (e: any) => {
      console.error(e);
    };
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const handleSpeechResults = (results: string[]) => {
    results.forEach(result => {
      switch (result) {
        case 'ป้ายรถ':
          console.log('1');
          break;
        case 'นำทาง':
          console.log('2');
          break;
        case 'ดูทาง':
          console.log('3');
          break;
        case 'เลขสาย':
          console.log('4');
          break;
        case 'เปิดกล้อง':
          Alert.alert('เปิดกล้องเรียบร้อย');
          break;
        default:
          console.log('No match found');
          break;
      }
    });
  };

  return (
    <View style={styles.mainView}>
      <Button
        title={isRecognizing ? 'หยุดการรับรู้' : 'เริ่มการรับรู้'}
        onPress={isRecognizing ? stopRecognition : startRecognition}
      />
      {results.map((result, index) => (
        <Text key={index}>{result}</Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  mainView: {
    marginTop: 50,
  },
});
