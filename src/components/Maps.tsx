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
import {getDistance} from 'geolib'; // Import getDistance
import item from '../data/item2.json';

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

  const startSearch = (currentLat: number, currentLon: number) => {
    Tts.speak('กำลังค้นหา'); // Start feedback

    // Define the search radius (e.g., 1 km)
    const SEARCH_RADIUS = 1000; // in meters

    // Filter locations within the radius
    const nearbyItems = item.filter(item => {
      const distance = getDistance(
        {latitude: currentLat, longitude: currentLon},
        {latitude: item.latitude, longitude: item.longitude},
      );
      return distance <= SEARCH_RADIUS;
    });

    if (nearbyItems.length > 0) {
      // If items are found, speak their names
      Tts.speak(`ค้นหาเจอแล้ว ${nearbyItems.length} รายการ`);
      nearbyItems.forEach(item => {
        Tts.speak(item.name); // Speak the title of each nearby marker
      });
    } else {
      Tts.speak('ไม่พบรายการใกล้เคียง');
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

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
        region={location || undefined}
        showsUserLocation={true}
        showsMyLocationButton={true}>
        {location && <Marker coordinate={location} title="You are here" />}
        {item.map((item, index) => (
          <Marker
            key={item.id}
            coordinate={{
              latitude: item.latitude,
              longitude: item.longitude,
            }}
            title={item.name}
          />
        ))}
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

export default Maps;
