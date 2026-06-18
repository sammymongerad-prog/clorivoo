import 'react-native-url-polyfill/auto';
import '@expo/metro-runtime';

import { App } from 'expo-router/build/qualified-entry';
import { registerRootComponent } from 'expo';

registerRootComponent(App);
