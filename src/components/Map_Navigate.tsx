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
import {getDistance} from 'geolib';

interface Location {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const MapNavigate = ({destinationItem}: {destinationItem: any}) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<any[]>([]); // เก็บขั้นตอนของเส้นทาง
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

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
      return true;
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
        getDirections(latitude, longitude, destinationItem);
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

  const getDirections = async (
    startLat: number,
    startLon: number,
    destination: any,
  ) => {
    const apiKey = '';
    const url = `https://api.openrouteservice.org/v2/directions/foot-walking`;

    if (!destination || !destination.latitude || !destination.longitude) {
      Alert.alert(
        'Invalid Destination',
        'The destination coordinates are missing.',
      );
      return;
    }

    const body = {
      coordinates: [
        [startLon, startLat],
        [destination.longitude, destination.latitude],
      ],
    };

    Tts.speak('กำลังขอข้อมูลจากเซิร์ฟเวอร์เพื่อคำนวณเส้นทาง');

    try {
      const response = await axios.post(url, body, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const steps = response.data.routes[0]?.segments[0]?.steps || [];
      if (steps.length === 0) {
        Alert.alert('No Directions Found', 'No steps available for the route.');
      }
      setSteps(steps);
      Tts.speak('ข้อมูลเส้นทางถูกดึงมาแล้ว กำลังเริ่มต้นนำทาง');
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      console.error(
        'Error fetching directions:',
        error?.response?.data || error,
      );
      Tts.speak('ไม่สามารถดึงข้อมูลการเดินทางได้');
    }
  };

  const checkProximity = (
    currentLat: number,
    currentLon: number,
    destination: any,
  ) => {
    if (!destination || !destination.latitude || !destination.longitude) return;

    const distance = getDistance(
      {latitude: currentLat, longitude: currentLon},
      {latitude: destination.latitude, longitude: destination.longitude},
    );

    if (distance <= 10) {
      Tts.speak('คุณได้เดินทางถึงจุดหมายปลายทางแล้ว');
      Alert.alert('Arrival', 'You have reached your destination.');
    }
  };

  const updateStep = (currentLat: number, currentLon: number) => {
    if (steps.length === 0 || currentStepIndex >= steps.length) return;

    const currentStep = steps[currentStepIndex];
    if (!currentStep?.way_points?.[0]) return;

    const [stepLon, stepLat] = currentStep.way_points[0];
    const distanceToStep = getDistance(
      {latitude: currentLat, longitude: currentLon},
      {latitude: stepLat, longitude: stepLon},
    );

    if (distanceToStep <= 20) {
      Tts.speak(currentStep.instruction);
      setCurrentStepIndex(prevIndex => prevIndex + 1);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, [destinationItem]);

  return loading ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  ) : (
    <View style={{flex: 1}}>
      <MapView
        style={styles.map}
        initialRegion={location || undefined}
        showsUserLocation
        followsUserLocation
        onUserLocationChange={e => {
          const coordinate = e.nativeEvent.coordinate;
          if (
            coordinate &&
            typeof coordinate.latitude === 'number' &&
            typeof coordinate.longitude === 'number'
          ) {
            const {latitude, longitude} = coordinate;
            setLocation(prev => ({...prev, latitude, longitude} as Location));
            checkProximity(latitude, longitude, destinationItem);
            updateStep(latitude, longitude);
          } else {
            console.error('Invalid coordinate:', coordinate);
          }
        }}>
        {destinationItem &&
          destinationItem.latitude &&
          destinationItem.longitude && (
            <Marker
              coordinate={{
                latitude: destinationItem.latitude,
                longitude: destinationItem.longitude,
              }}
              title={destinationItem.name || 'Destination'}
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
