import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ActivityIndicator} from 'react-native';
import MapView, {Marker} from 'react-native-maps';
import item from '../data/Bus_510.json'; // ไฟล์ JSON ที่เก็บข้อมูลทั้งหมด

const MapMaker = () => {
  const [location, setLocation] = useState({
    latitude: 13.7563, // ใช้ตำแหน่งเริ่มต้น เช่น กรุงเทพฯ
    longitude: 100.5018, // ใช้ตำแหน่งเริ่มต้น
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // ตั้งค่าตำแหน่งเริ่มต้นหากต้องการ
    setLoading(false);
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
      <MapView style={{flex: 1}} initialRegion={location}>
        {item.map((marker, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.name}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MapMaker;
