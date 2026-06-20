const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders ?? []), monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

config.resolver.extraNodeModules = {
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  'react-native-safe-area-context': path.resolve(projectRoot, 'node_modules/react-native-safe-area-context'),
  react: path.resolve(monorepoRoot, 'node_modules/react'),
};

function escapeForRegex(p) {
  return p.replace(/[/\\]/g, '[/\\\\]');
}

const rootRN = path.resolve(monorepoRoot, 'node_modules/react-native');
const rootSAC = path.resolve(monorepoRoot, 'node_modules/react-native-safe-area-context');

const blockPatterns = [
  new RegExp(escapeForRegex(rootRN) + '[/\\\\].*'),
  new RegExp(escapeForRegex(rootSAC) + '[/\\\\].*'),
];

const existingBlockList = config.resolver.blockList;
if (existingBlockList instanceof RegExp) {
  blockPatterns.unshift(existingBlockList);
} else if (Array.isArray(existingBlockList)) {
  blockPatterns.unshift(...existingBlockList);
}

config.resolver.blockList = blockPatterns;

module.exports = config;
