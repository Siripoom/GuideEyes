import React, {useEffect, useRef, useState} from 'react';
import {View, StyleSheet, Alert} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import Geolocation, {GeoPosition} from 'react-native-geolocation-service';
import {getDistance} from 'geolib';
import Tts from 'react-native-tts';
import BackButton from './BackButton';

import {
  STOPS as STOPS_RAW,
  Stop,
  OUTBOUND_LAST_ID,
  INBOUND_LAST_ID,
} from '../data/bus97';

import {addTtsListener, speakWithWatchdog} from '../utils/tts';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';

const MIN_MOVE_DELTA = 3; // เมตร
const NEXT_ANNOUNCE_DISTANCE = 150; // เมตร: เตือนก่อนถึงป้ายเป้าหมาย
const ARRIVAL_THRESHOLD = 25; // เมตร: ถือว่า “ถึงป้ายเป้าหมายแล้ว”

const STOPS_T: Stop[] = STOPS_RAW as unknown as Stop[];

// helper: หา stop ตาม id (ไม่ใช้ .find เพื่อเลี่ยง TS งอแง)
function getStopById(id: number | null): Stop | null {
  if (id == null) return null;
  for (const s of STOPS_T) if (s.id === id) return s;
  return null;
}

const Map: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();

  const [userLoc, setUserLoc] = useState<{lat: number; lng: number} | null>(
    null,
  );

  // สถานะการพูด/การเดินรถ
  const introDoneRef = useRef<boolean>(false);
  const lastNearestIdRef = useRef<number | null>(null);

  // ❗ เป้าหมายป้ายถัดไป “ที่ยึดคงที่” จนกว่าจะถึงจริง
  const currentNextIdRef = useRef<number | null>(null);

  const distanceAnnouncedForNextIdRef = useRef<number | null>(null);
  const arrivalAnnouncedForStopIdRef = useRef<number | null>(null);
  const preFinalWarnedForNextIdRef = useRef<number | null>(null);

  const endRouteAnnouncedRef = useRef<boolean>(false);
  const endRouteNavigatePendingRef = useRef<boolean>(false);

  // GPS / movement
  const watchIdRef = useRef<number | null>(null);
  const lastUserPointRef = useRef<{lat: number; lng: number} | null>(null);

  // คิวเสียง + watchdog
  const speechQueueRef = useRef<string[]>([]);
  const speakingRef = useRef<boolean>(false);

  const playNext = () => {
    if (speakingRef.current) return;
    const next = speechQueueRef.current.shift();
    if (!next) {
      if (endRouteNavigatePendingRef.current) {
        endRouteNavigatePendingRef.current = false;
        navigation.replace('MicController');
      }
      return;
    }
    speakWithWatchdog(
      next,
      () => {
        speakingRef.current = true;
      },
      () => {
        speakingRef.current = false;
        playNext();
      },
      Math.max(3500, Math.min(12000, next.length * 120)),
    );
  };

  const speakQueueSafe = (text: string) => {
    if (!text) return;
    speechQueueRef.current.push(text);
    if (!speakingRef.current) playNext();
  };

  useEffect(() => {
    Tts.setDefaultLanguage('th-TH');
    Tts.setDefaultRate(0.7);

    const offStart = addTtsListener('tts-start', () => {});
    const offFinish = addTtsListener('tts-finish', () => {});
    const offCancel = addTtsListener('tts-cancel', () => {});

    speakQueueSafe('กำลังแสดงแผนที่และป้ายรถที่เกี่ยวข้อง');

    watchIdRef.current = Geolocation.watchPosition(
      (pos: GeoPosition) => handlePositionUpdate(pos),
      (err: any) => {
        console.warn(err);
        Alert.alert('ข้อผิดพลาดการระบุตำแหน่ง', err.message);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 3,
        interval: 2000,
        fastestInterval: 1000,
      },
    );

    return () => {
      if (watchIdRef.current !== null)
        Geolocation.clearWatch(watchIdRef.current);
      offStart();
      offFinish();
      offCancel();
      Tts.stop();
    };
  }, []);

  const handlePositionUpdate = (pos: GeoPosition) => {
    const cur = {lat: pos.coords.latitude, lng: pos.coords.longitude};

    if (lastUserPointRef.current) {
      const moved = getDistance(
        {
          latitude: lastUserPointRef.current.lat,
          longitude: lastUserPointRef.current.lng,
        },
        {latitude: cur.lat, longitude: cur.lng},
      );
      if (moved < MIN_MOVE_DELTA) return;
    }
    lastUserPointRef.current = cur;

    setUserLoc(cur);
    computeAndAnnounce(cur);
  };

  const computeAndAnnounce = (cur: {lat: number; lng: number}) => {
    if (!STOPS_T.length) return;

    // 1) หา “ป้ายปัจจุบัน (ใกล้ที่สุด)”
    const nearest = STOPS_T.reduce<{stop: Stop | null; dist: number}>(
      (acc, s: Stop) => {
        const d = getDistance(
          {latitude: cur.lat, longitude: cur.lng},
          {latitude: s.latitude, longitude: s.longitude},
        );
        return !acc.stop || d < acc.dist ? {stop: s, dist: d} : acc;
      },
      {stop: null, dist: Number.MAX_SAFE_INTEGER},
    ).stop;
    if (!nearest) return;

    // 2) ครั้งแรก: ตั้ง “เป้าหมาย” = nearest.id + 1 แล้วพูด intro
    if (!introDoneRef.current) {
      let firstTarget: Stop | null = null;
      {
        const t = nearest.id + 1;
        firstTarget = getStopById(t);
      }
      if (firstTarget) {
        introDoneRef.current = true;
        lastNearestIdRef.current = nearest.id;

        currentNextIdRef.current = firstTarget.id; // ❗ ยึดเป้าหมายไว้จนกว่าจะถึงจริง
        distanceAnnouncedForNextIdRef.current = null;
        arrivalAnnouncedForStopIdRef.current = null;
        preFinalWarnedForNextIdRef.current = null;
        endRouteAnnouncedRef.current = false;
        endRouteNavigatePendingRef.current = false;

        speakQueueSafe(
          `คุณอยู่ป้ายชื่อ ${nearest.name} และป้ายถัดไปชื่อ ${firstTarget.name}`,
        );

        const isOutbound = firstTarget.id <= OUTBOUND_LAST_ID;
        const lastId = isOutbound ? OUTBOUND_LAST_ID : INBOUND_LAST_ID;
        if (firstTarget.id === lastId) {
          preFinalWarnedForNextIdRef.current = firstTarget.id;
          speakQueueSafe('ป้ายถัดไปเป็นจุดสิ้นสุดการเดินรถแล้ว เตรียมตัวลงได้');
        }
      }
      return;
    }

    // 3) หลังจากเริ่มแล้ว: แม้ nearest เปลี่ยน “ห้าม” เปลี่ยน currentNextIdRef
    //    เราจะอิงแต่ currentNextIdRef เป็นเป้าหมายเสมอ
    const targetStop = getStopById(currentNextIdRef.current);
    if (!targetStop) return; // ไม่มีเป้าหมาย = จบสายแล้ว

    // 3.1) เตือนก่อนถึง < 80 ม. (ครั้งเดียว/ต่อป้าย)
    const distToTarget = getDistance(
      {latitude: cur.lat, longitude: cur.lng},
      {latitude: targetStop.latitude, longitude: targetStop.longitude},
    );

    if (
      distToTarget <= NEXT_ANNOUNCE_DISTANCE &&
      distanceAnnouncedForNextIdRef.current !== targetStop.id
    ) {
      distanceAnnouncedForNextIdRef.current = targetStop.id;
      const meters = Math.max(1, Math.round(distToTarget));
      speakQueueSafe(`กำลังจะถึงป้ายถัดไป เหลือประมาณ ${meters} เมตร`);
    }

    // 3.2) ถึงเป้าหมายจริง < 15 ม.
    if (
      distToTarget <= ARRIVAL_THRESHOLD &&
      arrivalAnnouncedForStopIdRef.current !== targetStop.id
    ) {
      arrivalAnnouncedForStopIdRef.current = targetStop.id;

      const isOutbound2 = targetStop.id <= OUTBOUND_LAST_ID;
      const lastId2 = isOutbound2 ? OUTBOUND_LAST_ID : INBOUND_LAST_ID;

      if (targetStop.id === lastId2) {
        // ป้ายสุดท้ายจริง → พูดแล้วกลับหน้า MicController อัตโนมัติ
        if (!endRouteAnnouncedRef.current) {
          endRouteAnnouncedRef.current = true;
          endRouteNavigatePendingRef.current = true;
          speakQueueSafe(
            `คุณถึงป้ายชื่อ ${targetStop.name} เป็นป้ายสุดท้ายของการเดินรถแล้ว`,
          );
        }
        currentNextIdRef.current = null;
      } else {
        // ถึงป้าย → บอกชื่อ แล้วตั้ง “เป้าหมายใหม่” = id+1
        speakQueueSafe(`คุณถึงป้ายชื่อ ${targetStop.name}`);

        let nextNext: Stop | null = null;
        {
          const t2 = targetStop.id + 1;
          nextNext = getStopById(t2);
        }
        if (nextNext) {
          currentNextIdRef.current = nextNext.id; // ❗ เลื่อนไปเป้าหมายใหม่ “หลังจากถึง”
          distanceAnnouncedForNextIdRef.current = null;
          arrivalAnnouncedForStopIdRef.current = null;
          preFinalWarnedForNextIdRef.current = null;

          speakQueueSafe(`ป้ายถัดไปชื่อ ${nextNext.name}`);

          const isOutbound3 = nextNext.id <= OUTBOUND_LAST_ID;
          const lastId3 = isOutbound3 ? OUTBOUND_LAST_ID : INBOUND_LAST_ID;
          if (nextNext.id === lastId3) {
            preFinalWarnedForNextIdRef.current = nextNext.id;
            speakQueueSafe(
              'ป้ายถัดไปเป็นจุดสิ้นสุดการเดินรถแล้ว เตรียมตัวลงได้',
            );
          }
        } else {
          // safety
          currentNextIdRef.current = null;
        }
      }
    }
  };

  // ---------- วางหมุด 2 จุด ----------
  const nearestStop: Stop | null = (() => {
    if (!userLoc) return null;
    let nearest: Stop | null = null;
    let best = Number.MAX_SAFE_INTEGER;
    for (const s of STOPS_T) {
      const d = getDistance(
        {latitude: userLoc.lat, longitude: userLoc.lng},
        {latitude: s.latitude, longitude: s.longitude},
      );
      if (d < best) {
        best = d;
        nearest = s;
      }
    }
    return nearest;
  })();

  // ❗ หมุดสีส้ม = “ป้ายเป้าหมายปัจจุบัน” จาก currentNextIdRef
  const nextStopForPin: Stop | null = getStopById(currentNextIdRef.current);

  let nearestMarker: React.ReactNode = null;
  if (nearestStop) {
    const n = nearestStop as Stop;
    nearestMarker = (
      <Marker
        coordinate={{latitude: n.latitude, longitude: n.longitude}}
        title={n.name}
        description={`ID: ${n.id}`}
        pinColor="green"
      />
    );
  }

  let nextMarker: React.ReactNode = null;
  if (nextStopForPin) {
    const nx = nextStopForPin as Stop;
    nextMarker = (
      <Marker
        coordinate={{latitude: nx.latitude, longitude: nx.longitude}}
        title={`ป้ายถัดไป: ${nx.name}`}
        description={`ID: ${nx.id}`}
        pinColor="orange"
      />
    );
  }

  return (
    <View style={styles.container}>
      {userLoc && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: userLoc.lat,
            longitude: userLoc.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation
          followsUserLocation>
          {nearestMarker}
          {nextMarker}
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

export default Map;
