// Composants UI partagés — JJ's IMEX
// Sera peuplé progressivement lors de l'implémentation des apps

export { default as Badge } from './components/Badge';
export { default as Button } from './components/Button';
export { default as Card } from './components/Card';

// Notifications
export {
  configureNotifications,
  registerForPushNotifications,
  handleNotificationReceived,
  handleNotificationTapped,
  updateBadgeCount,
  unregisterPushNotifications,
  sendLocalNotification,
} from './notifications';
