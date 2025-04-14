import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Text,
} from 'react-native';
// import MapView, {Marker} from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import Tts from 'react-native-tts';
import {getDistance} from 'geolib'; // Import getDistance
import item from '../data/Bus_510.json';

interface Location {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const Maps = () => {
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
        startSearch(latitude, longitude); // Start searching once location is retrieved
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

  const [nearbyItems, setNearbyItems] = useState<
    {name: string; latitude: number; longitude: number; distance: number}[]
  >([]);

  const startSearch = (currentLat: number, currentLon: number) => {
    Tts.stop(); // หยุดเสียงที่ค้างไว้ก่อน

    const SEARCH_RADIUS = 1800;

    const foundItems = item
      .map(item => {
        const distance = getDistance(
          {latitude: currentLat, longitude: currentLon},
          {latitude: item.latitude, longitude: item.longitude},
        );
        return {...item, distance};
      })
      .filter(item => item.distance <= SEARCH_RADIUS);

    if (foundItems.length > 0) {
      Tts.speak(`ค้นหาเจอแล้ว ${foundItems.length} รายการ`);

      // ลูปพูดแบบ async เพื่อให้พูดเรียงกัน
      foundItems.forEach((item, index) => {
        const distanceKM =
          item.distance > 1000
            ? `${(item.distance / 1000).toFixed(2)} กิโลเมตร`
            : `${item.distance} เมตร`;

        setTimeout(() => {
          Tts.speak(`${item.name} อยู่ห่าง ${distanceKM}`);
        }, 1000 * (index + 1)); // พูดทีละตัวทุกๆ 1 วินาที
      });
    } else {
      Tts.speak('ไม่พบรายการใกล้เคียง');
    }

    setNearbyItems(foundItems); // ค่อยอัปเดต state ทีหลัง
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  if (loading) {
    Tts.speak('กำลังค้นหา');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{padding: 16}}>
      {nearbyItems.length > 0 ? (
        nearbyItems.map((item, index) => {
          const distanceKM =
            item.distance > 1000
              ? `${(item.distance / 1000).toFixed(2)} กิโลเมตร`
              : `${item.distance} เมตร`;
          return (
            <View key={index} style={styles.card}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.distance}>ระยะห่าง: {distanceKM}</Text>
            </View>
          );
        })
      ) : (
        <Text style={styles.noData}>ไม่พบสถานที่ใกล้เคียง</Text>
      )}
    </ScrollView>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  distance: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  noData: {
    textAlign: 'center',
    fontSize: 16,
    color: 'gray',
    marginTop: 20,
  },
});

export default Maps;
