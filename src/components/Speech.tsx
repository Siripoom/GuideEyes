import React, {useState} from 'react';
import {View, Button, PermissionsAndroid, Platform, Text} from 'react-native';
import Voice from '@react-native-voice/voice';

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
      await Voice.start('th-TH');
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

  Voice.onSpeechResults = (e: any) => {
    setResults(e.value);
  };

  Voice.onSpeechError = (e: any) => {
    console.error(e);
  };

  React.useEffect(() => {
    requestMicrophonePermission();
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  return (
    <View>
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
