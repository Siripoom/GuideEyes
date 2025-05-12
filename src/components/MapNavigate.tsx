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
const PROXIMITY_THRESHOLD = 20;
const DESTINATION_THRESHOLD = 15;
const OFF_ROUTE_THRESHOLD = 50;

export default function MapNavigation() {
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
      const res = await axios.post(
        'https://libretranslate.com/translate',
        {q: text, source: 'en', target: 'th', format: 'text'},
        {headers: {'Content-Type': 'application/json'}},
      );
      return res.data.translatedText || text;
    } catch (e) {
      console.error('Translation error:', e);
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
    }
  };

  // ดึงเส้นทาง + พูดก้าวแรก
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
      speakingRef.current = true;
      Tts.speak(await translateTextViaAPI(raw));
      lastSpokenIdxRef.current = 0;
    } catch (e) {
      console.error('fetchRoute error', e);
      Alert.alert('ไม่สามารถดึงเส้นทางได้');
    }
  };

  // ตรวจจุดเลี้ยว & ถึงปลายทาง
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
          speakingRef.current = true;
          Tts.speak(await translateTextViaAPI(raw));
          lastSpokenIdxRef.current = i;
          break;
        }
      }
    }

    // ถึงปลายทาง
    const toDest = getDistance(
      {latitude: cur.lat, longitude: cur.lng},
      {latitude: destLat, longitude: destLng},
    );
    if (toDest < DESTINATION_THRESHOLD && !arrivalSpokenRef.current) {
      arrivalSpokenRef.current = true;
      speakingRef.current = true;
      Tts.speak('ถึงปลายทางแล้ว');
      setTimeout(() => navigation.navigate('MicController'), 3000);
    }

    // ตรวจออกนอกเส้นทาง
    const routeLineDistance = getDistance(
      {latitude: cur.lat, longitude: cur.lng},
      {
        latitude: routePts[routePts.length - 1].latitude,
        longitude: routePts[routePts.length - 1].longitude,
      },
    );
    if (routeLineDistance > OFF_ROUTE_THRESHOLD) {
      console.log('Recalculating route...');
      stepsRef.current = [];
      arrivalSpokenRef.current = false;
      lastSpokenIdxRef.current = -1;
      await fetchRouteAndSpeakFirst(cur);
    }
  };

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
}

const styles = StyleSheet.create({
  container: {flex: 1},
  map: {flex: 1},
});
