const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders ?? []), monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Force a SINGLE copy of react-native and react to avoid duplicate-module
// crashes (e.g. "RCTScrollView must be a function (received undefined)").
// The monorepo root has react-native 0.74.1 but Expo SDK 51 needs 0.74.5
// which lives in the app's own node_modules.
config.resolver.extraNodeModules = {
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  react: path.resolve(monorepoRoot, 'node_modules/react'),
};

// Block the root-level react-native (0.74.1) so Metro never resolves it.
// Only the app's own copy (0.74.5) should be used.
const rootRN = path.resolve(monorepoRoot, 'node_modules/react-native');
// Anchor with a trailing path-separator so we ONLY block .../node_modules/react-native/...
// and never sibling packages like react-native-url-polyfill.
config.resolver.blockList = [
  ...(config.resolver.blockList ? [config.resolver.blockList] : []),
  new RegExp(rootRN.replace(/[/\\]/g, '[/\\\\]') + '[/\\\\]'),
];

module.exports = config;
