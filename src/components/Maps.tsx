import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import Tts from 'react-native-tts';
import {getDistance} from 'geolib';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';

import item from '../data/Bus_97.json';
import BackButton from './backButton';

interface Location {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

type DestinationParam = {
  latitude: number;
  longitude: number;
  name: string;
};

const Maps = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [nearbyItems, setNearbyItems] = useState<
    {name: string; latitude: number; longitude: number; distance: number}[]
  >([]);

  const navigation = useNavigation<StackNavigationProp<any>>();

  const getCurrentLocation = async () => {
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
        startSearch(latitude, longitude);
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
    Tts.stop();
    const SEARCH_RADIUS = 3000;

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
      foundItems.forEach((item, index) => {
        const distanceKM =
          item.distance > 1000
            ? `${(item.distance / 1000).toFixed(2)} กิโลเมตร`
            : `${item.distance} เมตร`;

        setTimeout(() => {
          Tts.speak(`${item.name} อยู่ห่าง ${`${distanceKM}`}`);
        }, 1000 * (index + 1));
      });
    } else {
      Tts.speak('ไม่พบรายการใกล้เคียง');
    }

    setNearbyItems(foundItems);
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleNavigate = (destination: DestinationParam) => {
    Tts.stop();
    Tts.speak(`คุณเลือกไปยัง ${destination.name}`);
    const finalLocation = destination;
    navigation.replace('MapNavigation', {destination: finalLocation});
  };

  useFocusEffect(
    React.useCallback(() => {
      // Stop TTS when entering or focusing this screen
      Tts.stop();
    }, []),
  );

  if (loading) {
    Tts.speak('กำลังค้นหา');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={{flex: 1}}>
      <ScrollView contentContainerStyle={{padding: 16, paddingBottom: 200}}>
        {nearbyItems.length > 0 ? (
          nearbyItems.map((item, index) => {
            const distanceKM =
              item.distance > 1000
                ? `${(item.distance / 1000).toFixed(2)} กิโลเมตร`
                : `${item.distance} เมตร`;

            return (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() =>
                  handleNavigate({
                    latitude: item.latitude,
                    longitude: item.longitude,
                    name: item.name,
                  })
                }>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.distance}>ระยะห่าง: {distanceKM}</Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <TouchableOpacity
            style={styles.cardNoData}
            onPress={() => getCurrentLocation()}>
            <Text style={styles.noData}>กดปุ่มเพื่อค้นหาใหม่</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      <BackButton />
    </View>
  );
};

const styles = StyleSheet.create({
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
  cardNoData: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 40,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noData: {
    textAlign: 'center',
    fontSize: 25,
    color: 'gray',
    marginTop: 10,
  },
});

export default Maps;
