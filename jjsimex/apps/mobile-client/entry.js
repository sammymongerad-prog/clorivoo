import 'react-native-url-polyfill/auto';

import * as SplashScreen from 'expo-splash-screen';
SplashScreen.hideAsync().catch(() => {});

import 'expo-router/entry';
