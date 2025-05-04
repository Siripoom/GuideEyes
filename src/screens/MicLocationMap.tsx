import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  Text,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import {Button} from 'tamagui';
import {Mic} from '@tamagui/lucide-icons';
import Tts from 'react-native-tts';
import {useNavigation} from '@react-navigation/native';
import itemData from '../data/Bus_97.json';
import {StackNavigationProp} from '@react-navigation/stack';
import BackButton from '../components/backButton';

const MicLocationMap: React.FC = () => {
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [results, setResults] = useState<string>('');
  const navigation = useNavigation<StackNavigationProp<any>>();

  useEffect(() => {
    const setup = async () => {
      Tts.setDefaultLanguage('th-TH');
      Tts.setDefaultRate(0.5);
      Tts.speak('กดปุ่มกลางหน้าจอเพื่อพูดชื่อสถานที่ๆ ต้องการไป');
    };

    setup();

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

  const startRecognition = async () => {
    setResults('');
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
          alignSelf: 'center',
          marginTop: 150,
        }}
        color={'white'}
        iconAfter={undefined} // ไม่ต้องมี text
        onPress={startRecognition}
      />
      <BackButton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MicLocationMap;
