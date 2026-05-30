# Clorivo — Marketplace Mobile-First

Prototype hi-fi interactif + backend Supabase complet.  
Stack : HTML/JSX standalone · React 18 · Supabase (PostgreSQL + Auth + Storage + Realtime)

---

## Démarrage rapide

### 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com) et créez un compte
2. Créez un nouveau projet (choisissez la région la plus proche)
3. Attendez que le projet soit prêt (~1 minute)

### 2. Initialiser la base de données

1. Dans votre projet Supabase → **SQL Editor**
2. Copiez-collez le contenu de `supabase/schema.sql` et exécutez-le
3. Copiez-collez le contenu de `supabase/seed.sql` et exécutez-le

### 3. Configurer les clés API

1. Dans votre projet Supabase → **Settings → API**
2. Copiez l'**URL du projet** (`https://xxxx.supabase.co`)
3. Copiez la clé **anon/public**
4. Ouvrez `supabase-client.jsx` et remplissez :

```javascript
const SUPABASE_URL      = 'https://xxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGci...';
```

### 4. Lancer l'app

Ouvrez `Clorivo.html` dans un navigateur — c'est tout.

> **Note :** L'app fonctionne aussi sans Supabase configuré (données de démo intégrées). Configurer Supabase active les vraies fonctionnalités : auth, panier persisté, commandes réelles, messagerie temps réel.

---

## Architecture

```
Clorivo.html          ← point d'entrée, ouvrir dans le navigateur
tokens.jsx            ← design tokens (couleurs, typo, spacing)
ui-kit.jsx            ← composants atomiques (Btn, Input, Card…)
supabase-client.jsx   ← client Supabase + tous les helpers API
app.jsx               ← router, navigation, ThemeContext

screen-auth.jsx       ← Splash · Onboarding · Login · Register
screen-home.jsx       ← Homepage A (deals feed, boutiques, bannières)
screen-pdp.jsx        ← Fiche produit
screen-cart.jsx       ← Panier · Checkout
screen-tracking.jsx   ← Suivi de commande
screen-account.jsx    ← Profil · Wishlist
screen-messages.jsx   ← Messagerie (liste des conversations)
screen-notifications.jsx ← Centre de notifications
screen-category.jsx   ← Navigation par catégorie
screen-seller.jsx     ← Dashboard vendeur · KYC · Commandes
screen-shop.jsx       ← Personnalisation boutique
screen-cj.jsx         ← Import CJ Dropshipping
screen-admin.jsx      ← Console admin (KPIs · KYC · Bannières)

supabase/
  schema.sql          ← schéma PostgreSQL complet + RLS
  seed.sql            ← données de démo (catégories, bannières)
```

---

## Fonctionnalités

### Acheteurs
- Inscription / connexion (Supabase Auth)
- Parcours produits par catégorie
- Fiche produit avec variantes (couleur, taille)
- Panier persisté en base de données
- Checkout et création de commande
- Suivi de commande avec timeline
- Messagerie temps réel avec les vendeurs (Supabase Realtime)
- Centre de notifications
- Wishlist et profil

### Vendeurs
- Dashboard avec KPIs (commandes, revenus, note)
- Gestion des commandes
- Personnalisation de boutique (logo, bannières, texte promo)
- Import produits via CJ Dropshipping
- Demande KYC (identité + selfie)

### Admin
- Vue d'ensemble (GMV, utilisateurs, vendeurs)
- Revue KYC avec approbation/refus en base
- CMS Bannières homepage (CRUD)
- Gestion utilisateurs et vendeurs
- Configuration plateforme (commission, livraison, sécurité)

---

## Base de données

| Table | Description |
|---|---|
| `profiles` | Utilisateurs (acheteurs, vendeurs, admins) |
| `shops` | Boutiques vendeurs |
| `shop_banners` | Bannières par boutique |
| `categories` | Arbre de catégories |
| `products` | Catalogue (prix, variantes, stock) |
| `carts` + `cart_items` | Paniers persistés |
| `orders` + `order_items` | Commandes et lignes |
| `conversations` + `messages` | Messagerie acheteur↔vendeur |
| `notifications` | Centre de notifications |
| `kyc_requests` | Dossiers KYC vendeurs |
| `banners` | Bannières homepage (admin CMS) |

Toutes les tables ont des politiques **Row Level Security (RLS)** activées.

---

## Déploiement

L'app est un fichier HTML standalone — pas de build, pas de serveur.  
Pour partager : hébergez les fichiers statiques sur n'importe quel CDN :

- **Vercel** : `vercel deploy`
- **Netlify** : glisser le dossier sur netlify.com
- **GitHub Pages** : activer dans les settings du repo
