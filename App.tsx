import React, {useEffect, useState} from 'react';
import {TamaguiProvider, View, createTamagui} from '@tamagui/core';
import {config} from '@tamagui/config/v3';
import {SpeechScreen, SplashScreen} from './src/screens';
import Maps from './src/components/Maps';
import ObstacleDetectionPage from './src/screens/ObstacleDetectionPage';
import Tts from 'react-native-tts';
import {
  Button,
  GestureResponderEvent,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';

const tamaguiConfig = createTamagui(config);

type Conf = typeof tamaguiConfig;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}

export default () => {
  const [isObstacleDetection, setIsObstacleDetection] = useState(false);
  const [isShowSplash, setIsShowSplash] = useState(true);
  useEffect(() => {
    Tts.setDefaultLanguage('th-TH');
    Tts.setDefaultRate(0.5); // ความเร็วในการอ่านออกเสียง (0.5 = ปกติ)

    const onTtsFinish = () => {
      setIsShowSplash(false);
    };

    Tts.addEventListener('tts-finish', onTtsFinish);

    const speakMessage = () => {
      Tts.speak(
        'ยินดีต้อนรับสู่แอพ GuideEyes แนะนำวิธีการใช้งานเบื้องต้น การใช้งานมี 4 รูปแบบ ดังนี้ 1 คำสั่งป้ายรถ จะค้นหาป้ายรถเมล์ที่ใกล้ที่สุดให้คุณ 2 คำสั่งนำทาง แอพจะบอกการเดินทางไปป้ายรถเมล์ที่ใกล้ที่สุดให้คุณ 3 คำสั่งดูทาง แอพจะเปิดกล้องและบอกวัตถุสิ่งกีดขวางข้างหน้าให้คุณ 4 คำสั่งเลขสาย แอพจะเปิดกล้องและบอกเลขสายรถเมล์ให้คุณ',
      );
    };

    setTimeout(speakMessage, 1500);

    return () => {
      Tts.removeEventListener('tts-finish', onTtsFinish); // ลบ listener เมื่อ component ถูกทำลาย
      Tts.stop(); // หยุด TTS เมื่อ component ถูกทำลาย
    };
  }, []);

  const handleLongPress = (event: GestureResponderEvent) => {
    // Stop TTS and navigate immediately
    Tts.stop();
    setIsShowSplash(false);
  };

  return (
    <TamaguiProvider config={tamaguiConfig}>
      {isShowSplash ? (
        <SplashScreen />
      ) : isObstacleDetection ? (
        <ObstacleDetectionPage />
      ) : (
        <View style={styles.container}>
          <SpeechScreen />
          <Maps />
          <Button
            title="เปิดฟีเจอร์ตรวจจับสิ่งกีดขวาง"
            onPress={() => setIsObstacleDetection(true)}
          />
        </View>
      )}
    </TamaguiProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
