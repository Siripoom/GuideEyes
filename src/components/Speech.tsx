import React, {useState, useEffect} from 'react';
import {
  View,
  PermissionsAndroid,
  Platform,
  Text,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import {log} from '@tensorflow/tfjs';
import {Button} from 'tamagui';
import Tts from 'react-native-tts';

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
    Tts.setDefaultLanguage('th-TH');
    Tts.setDefaultRate(0.5); // ความเร็วในการอ่านออกเสียง (0.5 = ปกติ)
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
          Alert.alert('ค้นหาป้ายรถเมล์ที่ใกล้ที่สุด');
          Tts.speak('กำลังค้นหาป้ายรถเมล์ที่ใกล้ที่สุด');
          break;
        case 'นำทาง':
          Alert.alert('เดินทางไปรถเมล์ที่ใกล้ที่สุด');
          break;
        // case 'ดูทาง':
        //   Alert.alert('เปิดกล้องเรียบร้อย');

        //   break;
        // case 'เลขสาย':
        //   Alert.alert('เปิดกล้องเรียบร้อย');
        //   break;
        case 'เปิดกล้อง':
          Alert.alert('เปิดกล้องเรียบร้อย');
          Tts.speak('เปิดกล้องเรียบร้อย');
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
        alignSelf="center"
        style={{
          backgroundColor: 'green',
          width: 300,
          height: 300,
          borderRadius: 200,
          marginBottom: 10,
        }}
        size="$10"
        color={'white'}
        onPress={isRecognizing ? stopRecognition : startRecognition}>
        {isRecognizing ? 'หยุดการรับรู้' : 'เริ่มการรับรู้'}
      </Button>
      {/* <Button
        title={isRecognizing ? 'หยุดการรับรู้' : 'เริ่มการรับรู้'}
        onPress={isRecognizing ? stopRecognition : startRecognition}
      /> */}
      {results.map((result, index) => (
        <Text key={index}>{result}</Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  mainView: {
    marginTop: 10,
  },
});
