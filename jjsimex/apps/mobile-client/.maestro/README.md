# Maestro E2E Tests — JJ's IMEX

## Installation (Windows natif — v1.39.9+)

### Prérequis
1. **Java 17+** installé (`java -version` pour vérifier)
2. **ADB** installé (via Android Studio SDK)
3. **Téléphone Android** branché en USB avec débogage USB activé

### Installer Maestro
1. Télécharger le dernier release : https://github.com/mobile-dev-inc/maestro/releases
2. Extraire `maestro.zip` dans `C:\maestro`
3. Ajouter `C:\maestro\bin` au PATH Windows :
   - Paramètres > Système > Variables d'environnement > Path > Nouveau > `C:\maestro\bin`
4. Redémarrer le terminal

### Vérifier l'installation
```
maestro --version
adb devices
```

## Lancer l'app avant les tests
L'app doit tourner dans Expo Go sur le téléphone :
```
cd apps/mobile-client
npx expo start --lan
```
Scanner le QR code sur le téléphone.

## Lancer les tests

### Un seul flow
```
maestro test .maestro/client/01-login-client.yaml
```

### Tous les flows client
```
maestro test .maestro/client/
```

### Tous les flows admin
```
maestro test .maestro/admin/
```

### Tous les flows (20 flows complets)
```
maestro test .maestro/
```

### Cibler un appareil spécifique
```
maestro --device <device_id> test .maestro/client/01-login-client.yaml
```

## Structure des flows
```
.maestro/
├── shared/
│   ├── login-client.yaml      # Sub-flow login client
│   └── login-admin.yaml       # Sub-flow login admin
├── client/
│   ├── 01-login-client.yaml
│   ├── 02-home-departures.yaml
│   ├── 03-colis-list-realtime.yaml
│   ├── 04-colis-detail.yaml
│   ├── 05-create-shipment.yaml
│   ├── 06-calculator.yaml
│   ├── 07-notifications.yaml
│   ├── 08-pickup.yaml
│   ├── 09-profile-settings.yaml
│   └── 10-personal-shopper.yaml
├── admin/
│   ├── 11-login-admin.yaml
│   ├── 12-dashboard.yaml
│   ├── 13-colis-status.yaml
│   ├── 14-envois-receive.yaml
│   ├── 15-departs.yaml
│   ├── 16-paiements.yaml
│   ├── 17-personal-shopper.yaml
│   ├── 18-notifications-bulk.yaml
│   ├── 19-clients.yaml
│   └── 20-gestion-nav.yaml
└── README.md
```

## Troubleshooting
- **"Device not found"** : Vérifier `adb devices`, activer débogage USB
- **Xiaomi/Redmi** : Désactiver "Verify apps over USB" dans Options développeur
- **Timeout** : Augmenter avec `timeout: 15000` dans assertVisible
- **Expo Go appId** : `host.exp.exponent` (Android)
