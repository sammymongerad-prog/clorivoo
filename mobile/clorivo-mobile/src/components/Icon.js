import { Feather } from '@expo/vector-icons';

// Mapping des noms du prototype → noms Feather (style identique)
const MAP = {
  home:          'home',
  search:        'search',
  plus:          'plus',
  heart:         'heart',
  heartFill:     'heart',
  user:          'user',
  bell:          'bell',
  cart:          'shopping-cart',
  shoppingBag:   'shopping-bag',
  arrowLeft:     'arrow-left',
  arrowRight:    'arrow-right',
  chevronRight:  'chevron-right',
  chevronLeft:   'chevron-left',
  chevronDown:   'chevron-down',
  share:         'share-2',
  message:       'message-circle',
  messageSquare: 'message-square',
  eye:           'eye',
  eyeOff:        'eye-off',
  check:         'check',
  checkCircle:   'check-circle',
  x:             'x',
  minus:         'minus',
  mapPin:        'map-pin',
  truck:         'truck',
  package:       'package',
  star:          'star',
  creditCard:    'credit-card',
  settings:      'settings',
  zap:           'zap',
  store:         'home',
  barChart:      'bar-chart-2',
  camera:        'camera',
  tag:           'tag',
  grid:          'grid',
  lock:          'lock',
  logOut:        'log-out',
  mail:          'mail',
  help:          'help-circle',
};

export default function Icon({ name, size = 20, color = '#0E0B1F', strokeWidth = 1.5 }) {
  const featherName = MAP[name] ?? name;
  return <Feather name={featherName} size={size} color={color} />;
}
