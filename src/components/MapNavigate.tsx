import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import MapView, {Marker, Polyline} from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import Tts from 'react-native-tts';
import polyline from '@mapbox/polyline';
import {getDistance} from 'geolib';
import axios from 'axios';
import BackgroundService from 'react-native-background-actions';
import {RootStackParamList} from '../navigations/AppNavigation';
import {RouteProp, useRoute} from '@react-navigation/native';

type MapNavigationRouteProp = RouteProp<RootStackParamList, 'MapNavigation'>;

const DIRECTIONS_API_KEY = ''; //<- ใส่ AIP KEY ตรงนี้

const MapNavigation: React.FC = () => {
  const route = useRoute<MapNavigationRouteProp>();
  const {destination} = route.params;
  const [userLocation, setUserLocation] = useState<any>(null);
  const [routePoints, setRoutePoints] = useState<any[]>([]);
  const [spokenSteps, setSpokenSteps] = useState<any[]>([]);
  const [lastSpokenIndex, setLastSpokenIndex] = useState(-1);
  const [destinationReached, setDestinationReached] = useState(false);

  useEffect(() => {
    Tts.setDefaultLanguage('th-TH');
    Tts.setDefaultRate(0.5);

    const start = async () => {
      await BackgroundService.start(backgroundTask, {
        taskName: 'Navigation',
        taskTitle: 'ระบบนำทางกำลังทำงาน',
        taskDesc: 'กำลังติดตามตำแหน่ง',
        taskIcon: {
          name: 'ic_launcher',
          type: 'mipmap',
        },
        parameters: {
          destination,
          updatePosition: (pos: any) => {
            setUserLocation(pos);
            if (routePoints.length > 0) {
              checkProximity(pos);
            } else {
              fetchRoute(pos);
            }
          },
        },
      });
    };

    start();
    return () => {
      BackgroundService.stop();
    };
  }, []);

  const backgroundTask = async (taskDataArguments: any) => {
    const {destination, updatePosition} = taskDataArguments;
    Tts.speak(`กำลังนำทางไปยัง ${destination.name}`);

    const sleep = (time: number) =>
      new Promise(resolve => setTimeout(resolve, time));

    while (BackgroundService.isRunning()) {
      Geolocation.getCurrentPosition(
        position => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          updatePosition(pos);
        },
        error => console.error('📍 GPS Error:', error),
        {
          enableHighAccuracy: true,
          distanceFilter: 1,
          forceRequestLocation: true,
        },
      );
      await sleep(4000);
    }
  };

  const fetchRoute = async (origin: any) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.latitude},${destination.longitude}&mode=walking&key=${DIRECTIONS_API_KEY}`;
      const response = await axios.get(url);
      const steps = response.data.routes?.[0]?.legs?.[0]?.steps || [];
      const encoded = response.data.routes?.[0]?.overview_polyline?.points;

      if (steps.length > 0 && encoded) {
        const decoded = polyline
          .decode(encoded)
          .map(([lat, lng]: [number, number]) => ({
            latitude: lat,
            longitude: lng,
          }));
        setRoutePoints(decoded);
        setSpokenSteps(steps);
      }
    } catch (err) {
      console.error('❌ Error fetching route:', err);
    }
  };

  const checkProximity = (current: any) => {
    spokenSteps.forEach((step: any, index: number) => {
      const distance = getDistance(
        {latitude: current.lat, longitude: current.lng},
        {
          latitude: step.end_location.lat,
          longitude: step.end_location.lng,
        },
      );

      if (distance < 20 && index > lastSpokenIndex) {
        const cleanText = step.html_instructions.replace(/<[^>]+>/g, '');
        Tts.speak(cleanText);
        setLastSpokenIndex(index);
      }
    });

    const distToDestination = getDistance(
      {latitude: current.lat, longitude: current.lng},
      {latitude: destination.latitude, longitude: destination.longitude},
    );

    if (distToDestination < 15 && !destinationReached) {
      setDestinationReached(true);
      Tts.speak('ถึงปลายทางแล้ว');
      setTimeout(() => Tts.speak('ถึงปลายทางแล้ว'), 3000);
    }

    if (distToDestination > 50 && spokenSteps.length > 0) {
      fetchRoute(current); // ออกจากเส้นทาง → ดึงใหม่
    }
  };

  return (
    <View style={styles.container}>
      {userLocation && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: userLocation.lat,
            longitude: userLocation.lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          showsUserLocation>
          <Marker
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title={destination.name}
          />
          {routePoints.length > 0 && (
            <Polyline
              coordinates={routePoints}
              strokeWidth={4}
              strokeColor="blue"
            />
          )}
        </MapView>
      )}
    </View>
  );
};

export default MapNavigation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
