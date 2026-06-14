# Guide de déploiement — JJ's IMEX

## Prérequis

```bash
npm install -g vercel eas-cli
```

---

## PARTIE 1 — Dashboard Web (Vercel)

```bash
cd jjsimex/apps/web-admin

# Connexion
vercel login

# Lier au projet
vercel link

# Ajouter les variables d'environnement
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add RESEND_API_KEY production
vercel env add NEXTAUTH_SECRET production
# NEXTAUTH_URL = https://jjsimex.vercel.app (déjà dans vercel.json)

# Déployer en production
vercel --prod
```

URL finale : **https://jjsimex.vercel.app**

---

## PARTIE 2 — App Mobile Client (EAS)

```bash
cd jjsimex/apps/mobile-client

# Connexion EAS
eas login

# Configurer le projet (obtenir projectId)
eas build:configure

# Mettre à jour eas.json avec votre projectId et les vraies clés Supabase
# Mettre à jour app.config.ts : extra.eas.projectId et updates.url

# Build preview (APK test interne)
eas build --platform android --profile preview

# Tester l'APK sur un vrai téléphone Android avant de continuer

# Build production
eas build --platform android --profile production
eas build --platform ios --profile production

# Soumettre au Play Store
eas submit --platform android --profile production
```

### Play Store — Infos App Client
- **Titre** : JJ's IMEX — Envoi de colis
- **Description courte** : Envoyez et suivez vos colis entre USA, Haïti et Rép. Dom.
- **Description longue** :
  JJ's IMEX vous permet de recevoir vos achats américains et de les faire livrer
  en Haïti et en République Dominicaine. Adresse US gratuite, tracking en temps réel,
  Personal Shopper, calculateur de tarifs et bien plus.
- **Catégorie** : Shopping
- **Mots-clés** : shipping haïti colis usa livraison diaspora
- **Screenshots** : 5 minimum (toutes les pages principales)

---

## PARTIE 3 — App Mobile Admin (EAS)

```bash
cd jjsimex/apps/mobile-admin

eas login
eas build:configure

# Build preview (distribution interne uniquement)
eas build --platform android --profile preview

# Build production
eas build --platform android --profile production

# Soumettre — Internal Testing uniquement (pas publique)
eas submit --platform android --profile production
```

### Play Console Admin
- **Titre** : JJ's IMEX Admin
- **Description** : Application d'administration pour les employés JJ's IMEX
- **Accès** : Interne uniquement (Internal testing track)
- **Track** : Internal testing

---

## PARTIE 4 — Supabase Edge Functions

```bash
cd jjsimex

# Login Supabase CLI
supabase login

# Lier au projet
supabase link --project-ref YOUR_PROJECT_REF

# Configurer les secrets
supabase secrets set RESEND_API_KEY=re_xxxxx
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# Déployer les fonctions
bash supabase/functions/deploy.sh
```

---

## CHECKLIST FINALE

### Sécurité
- [ ] Toutes les clés API dans les variables d'env (jamais dans le code)
- [ ] .env.* dans .gitignore
- [ ] RLS activé sur toutes les tables Supabase
- [ ] Rate limiting activé (middleware.ts)
- [ ] Headers sécurité Next.js (next.config.ts)

### Fonctionnalités
- [ ] Inscription + connexion client fonctionne
- [ ] Tracking colis en temps réel
- [ ] Calculateur résultat immédiat
- [ ] Personal Shopper end-to-end
- [ ] Paiements confirmation admin
- [ ] Push notifications reçues
- [ ] Emails reçus (Resend)
- [ ] Scanner QR fonctionne
- [ ] Dashboard stats correctes

### Design
- [ ] Dark mode partout
- [ ] Orange #F97316 correct
- [ ] Animations fluides
- [ ] Bottom nav fonctionne
- [ ] Responsive web admin

### Déploiement
- [ ] https://jjsimex.vercel.app accessible
- [ ] APK client installable sur Android
- [ ] APK admin installable (interne)
- [ ] Supabase production actif
- [ ] Emails Resend envoyés
- [ ] Push notifications fonctionnelles
