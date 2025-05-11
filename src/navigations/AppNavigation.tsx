import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen';
import MapScreen from '../components/Maps';
import MapNavigate from '../components/MapNavigate';
import {SpeechScreen} from '../screens/SpeechScreen';
import MicLocationMap from '../screens/MicLocationMap';
// import ObstacleDetectionPage from '../screens/ObstacleDetectionPage';
import CameraComponent from '../components/Camera';
import TestOllama from '../screens/TestOllama';
export type RootStackParamList = {
  Splash: undefined;
  Map: undefined;
  MapNavigation: {
    destination: {
      name: string;
      latitude: number;
      longitude: number;
    };
  };
  MicController: undefined;
  MicLocationMap: undefined;
};

const Stack = createStackNavigator();

const AppNavigation = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{headerShown: false}} // ไม่แสดง header
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="MapNavigation" component={MapNavigate} />
      <Stack.Screen name="MicController" component={SpeechScreen} />
      <Stack.Screen name="MicLocationMap" component={MicLocationMap} />
      <Stack.Screen name="Camera" component={CameraComponent} />
      <Stack.Screen name="TestOllama" component={TestOllama} />
      {/* <Stack.Screen
        name="ObstacleDetectionPage"
        component={ObstacleDetectionPage}
      /> */}
    </Stack.Navigator>
  );
};

export default AppNavigation;
