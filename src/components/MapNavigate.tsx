import React, {useEffect, useState, useRef} from 'react';
import {View, StyleSheet, Alert} from 'react-native';
import MapView, {Marker, Polyline} from 'react-native-maps';
import Geolocation, {GeoPosition} from 'react-native-geolocation-service';
import Tts from 'react-native-tts';
import polyline from '@mapbox/polyline';
import {getDistance} from 'geolib';
import axios from 'axios';
import BackButton from './backButton';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {RootStackParamList} from '../navigations/AppNavigation';

const GOOGLE_API_KEY = 'AIzaSyDL24tbIFnNVaRsSZM9bpoN54NtyTKIj74';
const TRANSLATION_API_URL = 'https://api.mymemory.translated.net/get';
const PROXIMITY_THRESHOLD = 20;
const DESTINATION_THRESHOLD = 10;
// const OFF_ROUTE_THRESHOLD = 50;

const MapNavigation: React.FC = () => {
  const {params} = useRoute<RouteProp<RootStackParamList, 'MapNavigation'>>();
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, 'MapNavigation'>>();
  const {
    name: destName,
    latitude: destLat,
    longitude: destLng,
  } = params.destination;

  const [userLoc, setUserLoc] = useState<{lat: number; lng: number} | null>(
    null,
  );
  const [routePts, setRoutePts] = useState<
    {latitude: number; longitude: number}[]
  >([]);
  const stepsRef = useRef<any[]>([]);
  const lastSpokenIdxRef = useRef(-1);
  const arrivalSpokenRef = useRef(false);
  const speakingRef = useRef(false);
  const watchIdRef = useRef<number | null>(null);

  // ฟังก์ชันแปลข้อความอังกฤษ→ไทย
  const translateTextViaAPI = async (text: string): Promise<string> => {
    try {
      const response = await axios.get(TRANSLATION_API_URL, {
        params: {
          q: text,
          langpair: 'en|th',
        },
      });
      return response.data.responseData.translatedText || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  useEffect(() => {
    // TTS setup
    Tts.setDefaultLanguage('th-TH');
    Tts.setDefaultRate(0.5);
    Tts.addEventListener('tts-finish', () => {
      speakingRef.current = false;
    });

    // พูดชื่อปลายทางก่อนดึงเส้นทาง
    (async () => {
      speakingRef.current = true;
      const welcome = `นำทางไปยัง ${destName}`;
      Tts.speak(await translateTextViaAPI(welcome));
    })();

    // เริ่ม watchPosition
    watchIdRef.current = Geolocation.watchPosition(
      pos => handlePositionUpdate(pos),
      err => {
        console.warn(err);
        Alert.alert('ตำแหน่งผิดพลาด', err.message);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 5,
        interval: 3000,
        fastestInterval: 2000,
      },
    );

    return () => {
      if (watchIdRef.current !== null)
        Geolocation.clearWatch(watchIdRef.current);
      Tts.removeAllListeners('tts-finish');
    };
  }, []);

  // รับตำแหน่ง -> ถ้ายังไม่มีเส้นทางให้ดึง, มิฉะนั้นตรวจ proximity
  const handlePositionUpdate = async (pos: GeoPosition) => {
    const cur = {lat: pos.coords.latitude, lng: pos.coords.longitude};
    setUserLoc(cur);
    if (!stepsRef.current.length) {
      await fetchRouteAndSpeakFirst(cur);
    } else {
      await checkProximityAndArrival(cur);
      checkIfOffRoute(cur); //
    }
  };

  const speakWithReset = async (text: string) => {
    return new Promise<void>(resolve => {
      speakingRef.current = true;
      Tts.speak(text);
      Tts.addEventListener('tts-finish', () => {
        speakingRef.current = false;
        Tts.removeAllListeners('tts-finish');
        resolve();
      });
    });
  };

  // ฟังก์ชันดึงเส้นทาง + พูดก้าวแรก
  const fetchRouteAndSpeakFirst = async (origin: {
    lat: number;
    lng: number;
  }) => {
    try {
      const url =
        `https://maps.googleapis.com/maps/api/directions/json` +
        `?origin=${origin.lat},${origin.lng}` +
        `&destination=${destLat},${destLng}` +
        `&mode=walking&key=${GOOGLE_API_KEY}`;
      const {data} = await axios.get(url);
      const leg = data.routes?.[0]?.legs?.[0];
      if (!leg) throw new Error('No route');

      stepsRef.current = leg.steps;
      const pts = polyline
        .decode(data.routes[0].overview_polyline.points)
        .map(([la, lo]) => ({latitude: la, longitude: lo}));
      setRoutePts(pts);

      const raw = leg.steps[0].html_instructions.replace(/<[^>]+>/g, '');
      const translatedText = await translateTextViaAPI(raw);

      speakingRef.current = true;
      Tts.speak(translatedText);

      Tts.addEventListener('tts-finish', () => {
        speakingRef.current = false;
        lastSpokenIdxRef.current = 0;
        Tts.removeAllListeners('tts-finish');
      });
    } catch (e) {
      console.error('fetchRoute error', e);
      Alert.alert('ไม่สามารถดึงเส้นทางได้');
    }
  };

  const checkProximityAndArrival = async (cur: {lat: number; lng: number}) => {
    if (!speakingRef.current) {
      for (
        let i = lastSpokenIdxRef.current + 1;
        i < stepsRef.current.length;
        i++
      ) {
        const step = stepsRef.current[i];
        const dist = getDistance(
          {latitude: cur.lat, longitude: cur.lng},
          {latitude: step.end_location.lat, longitude: step.end_location.lng},
        );

        if (dist < PROXIMITY_THRESHOLD) {
          const raw = step.html_instructions.replace(/<[^>]+>/g, '');
          const translatedText = await translateTextViaAPI(raw);

          await speakWithReset(translatedText);

          lastSpokenIdxRef.current = i;

          break;
        }
      }
    }

    const toDest = getDistance(
      {latitude: cur.lat, longitude: cur.lng},
      {latitude: destLat, longitude: destLng},
    );

    if (toDest < DESTINATION_THRESHOLD && !arrivalSpokenRef.current) {
      arrivalSpokenRef.current = true;
      await speakWithReset('ถึงปลายทางแล้ว');
      setTimeout(() => navigation.replace('MicController'), 3000);
    }
  };

  const checkIfOffRoute = (() => {
    let lastDistance = Infinity;
    let lastCheckTime = Date.now();

    return (current: {lat: number; lng: number}) => {
      if (stepsRef.current.length === 0) return;

      const nextStep = stepsRef.current[0];
      const distanceToNext = getDistance(
        {latitude: current.lat, longitude: current.lng},
        {
          latitude: nextStep.end_location.lat,
          longitude: nextStep.end_location.lng,
        },
      );
      const now = Date.now();
      if (distanceToNext >= lastDistance && now - lastCheckTime > 300000) {
        Tts.speak('คุณออกนอกเส้นทาง แอปกำลังดึงเส้นทางใหม่');
        stepsRef.current = [];
        arrivalSpokenRef.current = false;
        lastSpokenIdxRef.current = -1;
        fetchRouteAndSpeakFirst(current);
        lastCheckTime = Date.now();
        lastDistance = Infinity;
      } else if (distanceToNext < lastDistance) {
        lastDistance = distanceToNext;
        lastCheckTime = now;
      }
    };
  })();

  return (
    <View style={styles.container}>
      {userLoc && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: userLoc.lat,
            longitude: userLoc.lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          showsUserLocation
          followsUserLocation>
          <Marker
            coordinate={{latitude: destLat, longitude: destLng}}
            title={destName}
          />
          {!!routePts.length && (
            <Polyline
              coordinates={routePts}
              strokeColor="blue"
              strokeWidth={4}
            />
          )}
        </MapView>
      )}
      <BackButton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  map: {flex: 1},
});

export default MapNavigation;
