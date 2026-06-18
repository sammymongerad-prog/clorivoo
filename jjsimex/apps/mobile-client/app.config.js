module.exports = ({ config }) => ({
  ...config,
  name: "JJs IMEX",
  slug: 'jjsimex-client',
  owner: 'mike0987654321s-organization',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    backgroundColor: '#FF6600',
    resizeMode: 'contain',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.jjsimex.client',
    buildNumber: '1.0.0',
  },
  android: {
    package: 'com.jjsimex.client',
    versionCode: 3,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0D0D0D',
    },
    permissions: ['CAMERA', 'RECEIVE_BOOT_COMPLETED', 'VIBRATE'],
  },
  plugins: [],
  scheme: 'jjsimex',
  extra: {
    eas: {
      projectId: '8a062141-02bd-4404-b138-bafa6871a6f6',
    },
  },
});
