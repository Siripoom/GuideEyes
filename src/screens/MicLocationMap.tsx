import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import {Button} from 'tamagui';
import {Mic} from '@tamagui/lucide-icons';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import BackButton from '../components/BackButton';
import Geolocation from 'react-native-geolocation-service';

import itemData from '../data/Bus_97.json';

type Stop = {id: number; name: string; latitude: number; longitude: number};
type Direction = 'outbound' | 'inbound' | null;

const OUTBOUND_RANGE = {min: 1, max: 59}; // ไป นนทบุรี
const INBOUND_RANGE = {min: 60, max: 120}; // ไป อนุสาวรีย์ชัยสมรภูมิ
const ARRIVAL_THRESHOLD_M = 20; // ระยะที่ถือว่า "ยืนอยู่ที่ป้ายแล้ว"

const MicLocationMap: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [userLoc, setUserLoc] = useState<{lat: number; lng: number} | null>(
    null,
  );
  const [selectedDirection, setSelectedDirection] = useState<Direction>(null);
  const [pendingDirection, setPendingDirection] = useState<Direction>(null);
  const watchIdRef = useRef<number | null>(null);
  const isMounted = useRef(true);

  const stops: Stop[] = useMemo(
    () =>
      (itemData as any[]).map(p => ({
        id: Number(p.id),
        name: String(p.name),
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
      })),
    [],
  );

  useEffect(() => {
    isMounted.current = true;

    (async () => {
      try {
        Tts.setDefaultLanguage('th-TH');
      } catch {}
      Tts.setDefaultRate(0.7);
      Tts.speak(
        'พูดว่า ขาออก นนทบุรี หรือ ขาเข้า อนุสาวรีย์ชัยสมรภูมิ เพื่อเลือกทิศทาง',
      );

      const granted = await ensureLocationPermission();
      if (granted) startWatchLocation();
      else
        Tts.speak('กรุณาอนุญาตการเข้าถึงตำแหน่ง และเปิดบริการตำแหน่งในเครื่อง');
    })();

    Voice.onSpeechResults = (e: any) => {
      const first = e?.value?.[0]?.trim().toLowerCase();
      if (!first) return;
      handleSpokenDirection(first);
    };
    Voice.onSpeechEnd = stopRecognition;

    return () => {
      isMounted.current = false;
      stopWatchLocation();
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  useEffect(() => {
    if (userLoc && pendingDirection) {
      const dir = pendingDirection;
      setPendingDirection(null);
      proceedFindNearest(dir);
    }
  }, [userLoc, pendingDirection]);

  const ensureLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const res = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);
      const fine = res[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
      const coarse = res[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION];
      return (
        fine === PermissionsAndroid.RESULTS.GRANTED ||
        coarse === PermissionsAndroid.RESULTS.GRANTED
      );
    } else {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      return auth === 'granted';
    }
  };

  const startWatchLocation = () => {
    if (watchIdRef.current != null) return;

    watchIdRef.current = Geolocation.watchPosition(
      pos => {
        if (!isMounted.current) return;
        setUserLoc({lat: pos.coords.latitude, lng: pos.coords.longitude});
      },
      err => {
        console.warn('watchPosition error:', err);
        if (err?.code === 2)
          Tts.speak('ไม่สามารถดึงตำแหน่งได้ โปรดเปิดบริการตำแหน่งของเครื่อง');
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 1,
        interval: 2000,
        fastestInterval: 1000,
      },
    );

    Geolocation.getCurrentPosition(
      pos => {
        if (!isMounted.current) return;
        setUserLoc({lat: pos.coords.latitude, lng: pos.coords.longitude});
      },
      err => console.warn('getCurrentPosition error:', err),
      {enableHighAccuracy: true, timeout: 20000, maximumAge: 0},
    );
  };

  const stopWatchLocation = () => {
    if (watchIdRef.current != null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // ====== Voice control ======
  const startRecognition = async () => {
    try {
      await Voice.start('th-TH');
      setIsRecognizing(true);
      if (!userLoc) {
        Tts.speak(
          'กำลังดึงตำแหน่งปัจจุบัน กรุณาพูดเลือกทิศทางได้เลย ระบบจะทำงานให้อัตโนมัติเมื่อได้ตำแหน่ง',
        );
      }
    } catch (e) {
      console.error(e);
      Tts.speak('ไม่สามารถเริ่มฟังได้');
    }
  };

  const stopRecognition = async () => {
    try {
      await Voice.stop();
    } catch {}
    setIsRecognizing(false);
  };

  const handleSpokenDirection = (spoken: string) => {
    const isOutbound = /ขาออก/.test(spoken) || /นนทบุรี/.test(spoken);
    const isInbound =
      /ขาเข้า/.test(spoken) || /อนุสาวรีย์ชัยสมรภูมิ|อนุสาวรีย์/.test(spoken);

    if (isOutbound && !isInbound) {
      setSelectedDirection('outbound');
      Tts.speak('เลือกไปทางขาออก นนทบุรี');
      if (!userLoc) {
        setPendingDirection('outbound');
        return;
      }
      proceedFindNearest('outbound');
    } else if (isInbound && !isOutbound) {
      setSelectedDirection('inbound');
      Tts.speak('เลือกไปทางขาเข้า อนุสาวรีย์ชัยสมรภูมิ');
      if (!userLoc) {
        setPendingDirection('inbound');
        return;
      }
      proceedFindNearest('inbound');
    } else {
      Tts.speak(
        'ได้ยินไม่ชัด กรุณาพูดว่า ขาออก นนทบุรี หรือ ขาเข้า อนุสาวรีย์ชัยสมรภูมิ',
      );
    }
  };

  // ====== Nearest stop logic ======
  const proceedFindNearest = (dir: Exclude<Direction, null>) => {
    if (!userLoc) {
      Tts.speak('ยังไม่ทราบตำแหน่งปัจจุบัน กำลังดึงข้อมูลตำแหน่ง');
      return;
    }

    const range = dir === 'outbound' ? OUTBOUND_RANGE : INBOUND_RANGE;

    const candidates = stops.filter(
      s => s.id >= range.min && s.id <= range.max,
    );
    if (candidates.length === 0) {
      Tts.speak('ไม่พบข้อมูลป้ายสำหรับทิศทางที่เลือก');
      return;
    }

    // 1) ป้ายที่ใกล้ที่สุดของ "ฝั่งที่เลือก"
    const nearestInChosen = findNearestStop(
      userLoc.lat,
      userLoc.lng,
      candidates,
    );

    // 2) ป้ายที่ใกล้ที่สุด "รวมทุกฝั่ง"
    const nearestOverall = findNearestStop(userLoc.lat, userLoc.lng, stops);

    // 3) ถ้าอยู่ใกล้ป้ายรวมทุกฝั่งและป้ายนั้นอยู่ในฝั่งที่เลือก และอยู่ในรัศมี ARRIVAL_THRESHOLD_M -> พูดว่า "ยืนอยู่ป้ายแล้ว" และจบ
    if (nearestOverall && isStopInRange(nearestOverall.id, range)) {
      const dToOverall = distanceMeters(
        userLoc.lat,
        userLoc.lng,
        nearestOverall.latitude,
        nearestOverall.longitude,
      );
      if (dToOverall <= ARRIVAL_THRESHOLD_M) {
        Tts.speak(
          dir === 'outbound'
            ? 'คุณยืนอยู่ป้ายขาออกแล้ว'
            : 'คุณยืนอยู่ป้ายขาเข้าแล้ว',
        );
        return; // ไม่ต้องนำทางต่อ
      }
    }

    // 4) แจ้งเตือนถ้าป้ายที่ใกล้ที่สุดรวมทุกฝั่งอยู่ "คนละฝั่ง"
    const isOpposite =
      nearestOverall && !isStopInRange(nearestOverall.id, range);
    if (isOpposite) {
      const oppMsg =
        dir === 'outbound'
          ? 'ตอนนี้ป้ายที่คุณยืนอยู่เป็นฝั่งขาเข้า ฝั่งขาออกอยู่ฝั่งตรงข้ามถนน'
          : 'ตอนนี้ป้ายที่คุณยืนอยู่เป็นฝั่งขาออก ฝั่งขาเข้าอยู่ฝั่งตรงข้ามถนน';
      Tts.speak(oppMsg);
    }

    // 5) ถ้าไม่ยืนตรงป้ายที่ถูกต้อง ให้บอกชื่อป้ายฝั่งที่เลือก และ (ถ้าคุณยังต้องการ) ส่งไป MapNavigation
    if (nearestInChosen) {
      Tts.speak(`ป้ายที่ใกล้ที่สุดคือ ${nearestInChosen.name}`);
      navigation.replace('MapNavigation', {
        destination: nearestInChosen,
        userLocation: userLoc,
        direction: dir,
        oppositeSide: isOpposite,
      });
    } else {
      Tts.speak('ไม่พบป้ายที่ใกล้ที่สุด');
    }
  };

  const isStopInRange = (id: number, range: {min: number; max: number}) =>
    id >= range.min && id <= range.max;

  const findNearestStop = (
    lat: number,
    lng: number,
    list: Stop[],
  ): Stop | null => {
    let best: Stop | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const s of list) {
      const d = distanceMeters(lat, lng, s.latitude, s.longitude);
      if (d < bestDist) {
        bestDist = d;
        best = s;
      }
    }
    return best;
  };

  const distanceMeters = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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
          alignSelf: 'center',
          marginTop: 150,
        }}
        color={'white'}
        onPress={startRecognition}
      />
      <BackButton />
    </View>
  );
};

const styles = StyleSheet.create({container: {flex: 1}});
export default MicLocationMap;
