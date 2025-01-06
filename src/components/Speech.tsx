import React, {useState, useEffect} from 'react';
import {
  View,
  PermissionsAndroid,
  Platform,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import {Button} from 'tamagui';
import {Mic} from '@tamagui/lucide-icons';
import Tts from 'react-native-tts';
import Maps from './Maps';
import item from '../data/item.json';
import MapNavigate from './Map_Navigate';

export const Speech: React.FC = () => {
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [results, setResults] = useState<string>(''); // Use a single result for simplicity
  const [showMaps, setShowMaps] = useState<boolean>(false); // State to control Maps functionality
  const [showMapNavigate, setShowMapsNavigate] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false); // สถานะการรอชื่อ item
  const [destinationItem, setDestinationItem] = useState<any>(null);

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
    setResults(''); // Clear previous result
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

  useEffect(() => {
    requestMicrophonePermission();
    Tts.setDefaultLanguage('th-TH');
    Tts.setDefaultRate(0.5); // ความเร็วในการอ่านออกเสียง (0.5 = ปกติ)

    // Set up Voice events
    Voice.onSpeechResults = (e: any) => {
      const firstResult = e.value && e.value[0]; // Always pick the first result
      if (firstResult) {
        setResults(firstResult);
        handleSpeechResult(firstResult);
      }
    };
    Voice.onSpeechEnd = () => {
      stopRecognition(); // Automatically stop when speech ends
    };
    Voice.onSpeechError = (e: any) => {
      console.error(e);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const stopRecognition = async () => {
    try {
      await Voice.stop();
      setIsRecognizing(false);
    } catch (e) {
      console.error(e);
    }
  };

  console.log(results);

  const handleSpeechResult = (result: string) => {
    switch (result) {
      case 'ป้ายรถ':
        setShowMaps(true); // Enable Maps functionality
        break;
      case 'เปิดกล้อง':
        Alert.alert('เปิดกล้องเรียบร้อย');
        Tts.speak('เปิดกล้องเรียบร้อย');
        break;
      case 'นำทาง':
        Tts.speak('กรุณาพูดชื่อสถานที่ที่ต้องการไป');
        setIsNavigating(true);
        if (isNavigating) {
          // ถ้าในขณะที่กำลังรอชื่อ item
          const foundItem = item.find(i => i.name === result); // ค้นหาว่าผู้ใช้พูดชื่อ item อะไร

          if (foundItem) {
            Tts.speak(`นำทางไปที่ ${foundItem}`); // พูดชื่อของ item
            setShowMapsNavigate(true); // แสดงแผนที่
            setDestinationItem(foundItem); // ส่ง item ไปที่ Maps
            setIsNavigating(false); // เสร็จสิ้นการรอ
          } else {
            Tts.speak('ไม่พบชื่อรายการที่ตรงกับคำที่คุณพูด');
          }
        }
        break;
      case 'ยกเลิก':
        setShowMaps(false);
        Tts.speak('ทำการยกเลิก');
        Tts.stop;
        break;
    }
  };

  console.log('Test ' + destinationItem);

  return (
    <View style={{flex: 1}}>
      {showMaps && <Maps />}
      {showMapNavigate && <MapNavigate destinationItem={destinationItem} />}

      <View style={styles.mainView}>
        <Button
          icon={Mic}
          scaleIcon={10}
          alignSelf="center"
          style={{
            backgroundColor: isRecognizing ? 'red' : 'green',
            width: 300,
            height: 300,
            borderRadius: 200,
            marginBottom: 10,
          }}
          size="$6"
          color={'white'}
          onPress={startRecognition}>
          {/* Button starts recognition */}
        </Button>

        {/* Show recognition result */}
        <View style={styles.results}>
          <Text>{results}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainView: {
    marginTop: 10,
  },
  results: {
    marginTop: 10,
    alignItems: 'center',
  },
});

export default Speech;
