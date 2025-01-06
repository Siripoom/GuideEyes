import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import Tts from 'react-native-tts';
import axios from 'axios';
import {getDistance} from 'geolib'; // Import getDistance
import OpenRouteService from 'openrouteservice';
import item from '../data/item.json';

interface Location {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const MapNavigate = ({destinationItem}: {destinationItem: any}) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Access Required',
            message:
              'This app needs to access your location to display it on the map.',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true; // iOS: Permissions are handled via Info.plist
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Location permission is required.');
      setLoading(false);
      return;
    }

    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        setLocation({
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        setLoading(false);
        // startSearch(latitude, longitude); // Start searching once location is retrieved
      },
      error => {
        console.error('Geolocation error:', error);
        Alert.alert('Error', 'Unable to retrieve location.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 1000,
      },
    );
  };

  // const startSearch = (currentLat: number, currentLon: number) => {
  //   Tts.speak('กำลังค้นหา'); // Start feedback

  //   // Define the search radius (e.g., 1 km)
  //   const SEARCH_RADIUS = 2000; // in meters

  //   // Filter locations within the radius
  //   const nearbyItems = item.filter(item => {
  //     const distance = getDistance(
  //       {latitude: currentLat, longitude: currentLon},
  //       {latitude: item.latitude, longitude: item.longitude},
  //     );
  //     return distance <= SEARCH_RADIUS;
  //   });

  //   if (nearbyItems.length > 0) {
  //     // If items are found, speak their names
  //     Tts.speak(`ค้นหาเจอแล้ว ${nearbyItems.length} รายการ`);
  //     nearbyItems.forEach(item => {
  //       const distance = getDistance(
  //         {latitude: currentLat, longitude: currentLon},
  //         {latitude: item.latitude, longitude: item.longitude},
  //       );
  //       const distanceKM =
  //         distance > 1000
  //           ? `${(distance / 1000).toFixed(2)} กิโลเมตร`
  //           : `${distance} เมตร`;
  //       Tts.speak(`${item.name} อยู่ห่าง ${distanceKM}`);
  //     });
  //   } else {
  //     Tts.speak('ไม่พบรายการใกล้เคียง');
  //   }
  // };

  const getDirections = async (
    startLat: number,
    startLon: number,
    destination: any,
  ) => {
    const apiKey = ''; // ใช้ API key ของคุณ
    const url = `https://api.openrouteservice.org/v2/directions/walking?api_key=${apiKey}`;
    const body = {
      coordinates: [
        [startLon, startLat], // ตำแหน่งปัจจุบัน
        [destination.longitude, destination.latitude], // ตำแหน่งจุดหมาย
      ],
      profile: 'foot-walking',
      format: 'geojson',
    };

    // แจ้งขั้นตอนแรก - กำลังขอข้อมูลจาก API
    Tts.speak('กำลังขอข้อมูลจากเซิร์ฟเวอร์เพื่อคำนวณเส้นทาง');

    try {
      // เริ่มดึงข้อมูลจาก API
      const response = await axios.post(url, body);
      const directionsData = response.data;

      // แจ้งว่าข้อมูลถูกดึงมาแล้ว
      Tts.speak('ข้อมูลเส้นทางถูกดึงมาแล้ว กำลังคำนวณเส้นทาง');

      // ดำเนินการกับข้อมูลการเดินทาง
      directionsData.features[0].properties.segments[0].steps.forEach(
        (step: any) => {
          const instruction = step.instruction;
          Tts.speak(instruction); // อ่านคำแนะนำการเดินทาง
        },
      );

      // แจ้งว่าการคำนวณเส้นทางเสร็จสมบูรณ์
      Tts.speak('เส้นทางคำนวณเสร็จสมบูรณ์');
    } catch (error) {
      console.error('Error fetching directions:', error);
      Tts.speak('ไม่สามารถดึงข้อมูลการเดินทางได้');
    }
  };
  useEffect(() => {
    getCurrentLocation();
  }, [destinationItem]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={{flex: 1}}>
      <MapView
        style={styles.map}
        initialRegion={location || undefined}
        showsUserLocation
        followsUserLocation>
        {destinationItem && (
          <Marker
            coordinate={{
              latitude: destinationItem.latitude,
              longitude: destinationItem.longitude,
            }}
            title={destinationItem.name}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MapNavigate;
