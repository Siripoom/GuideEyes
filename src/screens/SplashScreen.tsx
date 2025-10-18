import React, {useEffect} from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  GestureResponderEvent,
  Image,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useNavigation} from '@react-navigation/native';
import Tts from 'react-native-tts';

const SplashScreen = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();

  useEffect(() => {
    Tts.setDefaultLanguage('th-TH');
    Tts.setDefaultRate(0.7);

    const onTtsFinish = () => {
      if (navigation.isFocused()) {
        navigation.navigate('MicController');
      }
    };

    // เพิ่มการตรวจสอบ listener ก่อนที่จะเพิ่ม
    Tts.addEventListener('tts-finish', onTtsFinish);

    const speakMessage = () => {
      Tts.speak(
        'ยินดีต้อนรับสู่แอพ Guide Eyes แนะนำวิธีการใช้งานเบื้องต้น ' +
          'การใช้งานมี 4 รูปแบบ ดังนี้ ' +
          '1. คำสั่งป้ายรถ จะค้นหาป้ายรถเมล์ที่ใกล้ที่สุดให้คุณ ' +
          '2. คำสั่งนำทาง แอพจะบอกการเดินทางไปป้ายรถเมล์ที่ใกล้ที่สุดให้คุณ ' +
          '3. คำสั่งดูทาง แอพจะเปิดกล้องและบอกวัตถุสิ่งกีดขวางข้างหน้าให้คุณ ' +
          '4. คำสั่งเลขสาย แอพจะเปิดกล้องและบอกเลขสายรถเมล์ให้คุณ',
      );
    };

    setTimeout(speakMessage, 500);

    return () => {
      Tts.removeEventListener('tts-finish', onTtsFinish);
      Tts.stop();
    };
  }, []);

  const handleLongPress = (event: GestureResponderEvent) => {
    Tts.stop();
    Tts.removeAllListeners;
    navigation.navigate('MicController');
  };

  return (
    <TouchableWithoutFeedback
      onLongPress={handleLongPress}
      delayLongPress={500}>
      <View style={styles.container}>
        <Image
          source={require('../assets/icons/logo.png')}
          style={styles.logo}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#96b2bc',
  },
  text: {color: 'white', fontSize: 18},
  logo: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
  },
});

export default SplashScreen;
