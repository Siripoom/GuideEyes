import React, {useEffect, useState} from 'react';
import {TamaguiProvider, View, createTamagui} from '@tamagui/core';
import {config} from '@tamagui/config/v3';
import {SpeechScreen, SplashScreen} from './src/screens';
import Maps from './src/components/Maps';
import Tts from 'react-native-tts';

const tamaguiConfig = createTamagui(config);

type Conf = typeof tamaguiConfig;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}

export default () => {
  // const device = useCameraDevice('back');
  // const {hasPermission} = useCameraPermission();

  // if (!hasPermission) return <PermissionsPage />;
  // if (device == null) return <NoCameraDeviceError />;
  const [isShowSplash, setIsShowSplash] = useState(true);
  useEffect(() => {
    Tts.setDefaultLanguage('th-TH');
    Tts.setDefaultRate(0.5); // ความเร็วในการอ่านออกเสียง (0.5 = ปกติ)

    // ฟัง event เมื่อการพูดเสร็จสิ้น
    const onTtsFinish = () => {
      setIsShowSplash(false);
    };

    Tts.addEventListener('tts-finish', onTtsFinish);

    const speakMessage = () => {
      Tts.speak(
        'ยินดีต้อนรับสู่แอพ GuideEyes แนะนำวิธีการใช้งานเบื้องต้น การใช้งานมี 4 รูปแบบ ดังนี้ 1 คำสั่งป้ายรถ จะค้นหาป้ายรถเมล์ที่ใกล้ที่สุดให้คุณ 2 คำสั่งนำทาง แอพจะบอกการเดินทางไปป้ายรถเมล์ที่ใกล้ที่สุดให้คุณ 3 คำสั่งดูทาง แอพจะเปิดกล้องและบอกวัตถุสิ่งกีดขวางข้างหน้าให้คุณ 4 คำสั่งเลขสาย แอพจะเปิดกล้องและบอกเลขสายรถเมล์ให้คุณ',
      );
    };

    setTimeout(speakMessage, 3000);

    return () => {
      Tts.removeEventListener('tts-finish', onTtsFinish); // ลบ listener เมื่อ component ถูกทำลาย
      Tts.stop(); // หยุด TTS เมื่อ component ถูกทำลาย
    };
  }, []);

  return (
    <TamaguiProvider config={tamaguiConfig}>
      {isShowSplash ? <SplashScreen /> : <SpeechScreen />}
      {!isShowSplash && <Maps />}
      {/* <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} />  It's don't work*/}
    </TamaguiProvider>
  );
};
