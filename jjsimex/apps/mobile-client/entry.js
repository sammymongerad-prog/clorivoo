import 'react-native-url-polyfill/auto';

import { LogBox } from 'react-native';

// Le bridge natif émet en boucle "No callback found ... app_state" (bruit dev
// non bloquant). On l'ignore pour que l'overlay rouge ne recouvre pas l'app.
LogBox.ignoreLogs([
  'No callback found',
  'Invariant Violation: No callback found',
]);

import 'expo-router/entry';
