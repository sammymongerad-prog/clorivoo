import 'react-native-url-polyfill/auto';

import { LogBox } from 'react-native';

// Le bridge natif émet en boucle des erreurs "No callback found ... app_state"
// (bruit dev non bloquant — prouvé : l'app rend bien en dessous). On les avale
// AVANT le chargement de l'app pour que l'écran rouge "Uncaught Error" ne se
// déclenche jamais pour ce bruit. Les vraies erreurs passent toujours.
const _noise = (msg) =>
  typeof msg === 'string' && msg.indexOf('No callback found') !== -1;

const _ErrorUtils = global.ErrorUtils;
if (_ErrorUtils && _ErrorUtils.setGlobalHandler) {
  const _prev = _ErrorUtils.getGlobalHandler ? _ErrorUtils.getGlobalHandler() : null;
  _ErrorUtils.setGlobalHandler((error, isFatal) => {
    if (_noise(error && error.message)) return; // avaler le bruit
    if (_prev) _prev(error, isFatal);
  });
}

// Filtrer aussi le console.error pour ne pas spammer / déclencher LogBox
const _origConsoleError = console.error;
console.error = (...args) => {
  if (_noise(args[0]) || (args[0] && _noise(args[0].message))) return;
  _origConsoleError.apply(console, args);
};

LogBox.ignoreLogs(['No callback found']);

import 'expo-router/entry';
