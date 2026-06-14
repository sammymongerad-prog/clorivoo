import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "JJ's IMEX",
  slug: 'jjsimex-client',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0D0D0D',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.jjsimex.client',
    buildNumber: '1.0.0',
  },
  android: {
    package: 'com.jjsimex.client',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0D0D0D',
    },
    googleServicesFile: './google-services.json',
    permissions: ['CAMERA', 'RECEIVE_BOOT_COMPLETED', 'VIBRATE'],
  },
  plugins: [
    'expo-router',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#F97316',
        sounds: [],
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: "JJ's IMEX a besoin d'accéder à votre caméra pour scanner vos colis.",
      },
    ],
  ],
  scheme: 'jjsimex',
  extra: {
    eas: {
      projectId: '4401ebf2-2d5c-499f-9252-9fd35cfac89c',
    },
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/4401ebf2-2d5c-499f-9252-9fd35cfac89c',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
});
