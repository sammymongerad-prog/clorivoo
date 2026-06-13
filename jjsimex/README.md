# JJ's IMEX — Beyond Just Shipping

Service de livraison de colis USA → Haïti et République Dominicaine.

## Structure du projet

```
jjsimex/
├── apps/
│   ├── web-admin/       # Dashboard admin Next.js 14
│   ├── mobile-client/   # App client React Native + Expo
│   └── mobile-admin/    # App admin React Native + Expo
├── packages/
│   ├── supabase/        # Schéma DB + migrations + fonctions
│   ├── ui/              # Composants partagés
│   └── types/           # Types TypeScript partagés
```

## Démarrage rapide

```bash
# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.example .env.local

# Démarrer toutes les apps
npm run dev

# Démarrer uniquement le web admin
npm run dev:web

# Démarrer uniquement l'app client mobile
npm run dev:client
```

## Stack technique

- **Web Admin** : Next.js 14, Tailwind CSS, Supabase SSR, Recharts
- **Mobile** : React Native, Expo, Expo Router, NativeWind
- **Base de données** : Supabase (PostgreSQL)
- **Auth** : Supabase Auth
- **Emails** : Resend
- **Push Notifications** : Expo Notifications
- **Déploiement web** : Vercel
- **Déploiement mobile** : Expo EAS

## Variables d'environnement

Copier `.env.example` en `.env.local` et remplir les valeurs.
