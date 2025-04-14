import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import {Button} from 'tamagui';
import {Mic} from '@tamagui/lucide-icons';
import Tts from 'react-native-tts';
import {useNavigation} from '@react-navigation/native';
import itemData from '../data/Bus_510.json';
import {StackNavigationProp} from '@react-navigation/stack';

const MicLocationMap: React.FC = () => {
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [results, setResults] = useState<string>('');
  const navigation = useNavigation<StackNavigationProp<any>>();

  useEffect(() => {
    const setupPermissions = async () => {
      await requestMicrophonePermission();
      Tts.setDefaultLanguage('th-TH');
      Tts.setDefaultRate(0.5);
    };

    setupPermissions();

    Voice.onSpeechResults = (e: any) => {
      const firstResult = e.value?.[0];
      if (firstResult) {
        setResults(firstResult);
        checkDestination(firstResult.trim().toLowerCase());
      }
    };

    Voice.onSpeechEnd = stopRecognition;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'ขออนุญาตใช้ไมโครโฟน',
            message: 'แอปต้องการใช้ไมโครโฟนเพื่อรับรู้เสียงพูด',
            buttonNeutral: 'ถามฉันทีหลัง',
            buttonNegative: 'ยกเลิก',
            buttonPositive: 'ตกลง',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('การอนุญาตใช้ไมโครโฟนถูกปฏิเสธ');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const startRecognition = async () => {
    setResults('');
    try {
      await Voice.start('th-TH');
      setIsRecognizing(true);
      Tts.speak('กรุณาพูดชื่อสถานที่');
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

  const checkDestination = (spokenText: string) => {
    // เปลี่ยนให้ตรวจสอบคำค้นหาโดยไม่คำนึงถึงตัวพิมพ์ใหญ่/พิมพ์เล็ก
    const matchedItem = itemData.find(
      (place: any) => place.name.toLowerCase() === spokenText.toLowerCase(),
    );

    if (matchedItem) {
      Tts.speak(`กำลังนำทางไปยัง ${matchedItem.name}`);
      navigation.navigate('MapNavigation', {destination: matchedItem});
    } else {
      Tts.speak('ไม่พบสถานที่ กรุณาลองใหม่');
      Alert.alert('แจ้งเตือน', 'ไม่พบสถานที่ กรุณาลองใหม่');
    }
  };

  return (
    <View style={styles.container}>
      <Button
        icon={<Mic size={100} color="white" />}
        style={{
          backgroundColor: isRecognizing ? 'red' : 'green',
          width: 300, // ขนาดปุ่มใหญ่ขึ้น
          height: 300,
          borderRadius: 250,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 150,
        }}
        color={'white'}
        iconAfter={undefined} // ไม่ต้องมี text
        onPress={startRecognition}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MicLocationMap;
