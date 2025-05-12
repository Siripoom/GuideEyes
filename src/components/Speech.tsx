import React, {useState, useEffect} from 'react';
import {
  View,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import {Button} from 'tamagui';
import {Mic} from '@tamagui/lucide-icons';
import Tts from 'react-native-tts';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
// import { RootStackParamList } from '../navigations';

export const Speech: React.FC = () => {
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [results, setResults] = useState<string>('');
  const navigation = useNavigation<StackNavigationProp<any>>();

  useEffect(() => {
    const setupPermissionsAndTTS = async () => {
      await requestMicrophonePermission();
      await requestLocationPermission();
      Tts.setDefaultLanguage('th-TH');
      Tts.setDefaultRate(0.5);
    };

    setupPermissionsAndTTS();

    Voice.onSpeechResults = (e: any) => {
      const firstResult = e.value?.[0];
      if (firstResult) {
        setResults(firstResult);
        handleCommands(firstResult.trim().toLowerCase());
      }
    };

    Voice.onSpeechEnd = stopRecognition;

    return () => {
      Voice.removeAllListeners();
      Voice.destroy();
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

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Access Required',
            message:
              'This app needs to access your location to display it on the map.',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('การอนุญาตตำแหน่งถูกปฏิเสธ');
        }
      } catch (error) {
        console.error('Permission error:', error);
      }
    }
  };

  const startRecognition = async () => {
    setResults('');
    try {
      await Voice.start('th-TH', {
        RECOGNIZER_ENGINE: 'services',
        EXTRA_PARTIAL_RESULTS: true,
      });
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

  const handleCommands = (cleanedResult: string) => {
    switch (cleanedResult) {
      case 'ป้ายรถ':
        navigation.navigate('Map');
        break;
      case 'นำทาง':
        navigation.replace('MicLocationMap');
        break;
      case 'ดูทาง':
        navigation.replace('Camera');
        break;
      case 'เลขสาย':
        Tts.speak('เลขสาย');
        break;
      case 'ยกเลิก':
        Tts.speak('ทำการยกเลิก');
        Tts.stop();
        navigation.replace('MicController');
        break;
      default:
        Tts.speak('คำสั่งไม่รู้จัก');
    }
  };

  return (
    <View style={styles.container}>
      <Button
        icon={<Mic size={100} color="white" />}
        style={{
          backgroundColor: isRecognizing ? 'red' : 'green',
          width: 300,
          height: 300,
          borderRadius: 250,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 150,
        }}
        color={'white'}
        iconAfter={undefined}
        onPress={startRecognition}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
  },
});

export default Speech;
