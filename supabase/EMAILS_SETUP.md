# Clorivo — Setup des emails automatiques

## Prérequis

1. **Compte Resend** : https://resend.com → créer un compte gratuit
2. **Domaine vérifié** dans Resend (ou utiliser `onboarding@resend.dev` pour les tests)
3. **Supabase CLI** installé : `npm i -g supabase`

---

## 1. Variables d'environnement

Dans ton dashboard Supabase → **Settings → Edge Functions → Secrets**, ajouter :

| Clé | Valeur |
|---|---|
| `RESEND_API_KEY` | `re_xxxxxxxxxxxx` (depuis resend.com/api-keys) |
| `SITE_URL` | `https://ton-app.com` (ou laisse vide pour l'instant) |

---

## 2. Déployer les Edge Functions

```bash
cd /home/user/clorivoo

# Login Supabase
supabase login

# Lier ton projet
supabase link --project-ref TON_PROJECT_REF

# Déployer toutes les fonctions
supabase functions deploy send-email
supabase functions deploy send-notification
supabase functions deploy on-new-order
supabase functions deploy on-order-status
supabase functions deploy on-kyc-update
supabase functions deploy on-new-message
supabase functions deploy send-broadcast
supabase functions deploy send-reset-email
```

---

## 3. Configurer les Database Webhooks

Dans Supabase Dashboard → **Database → Webhooks** → Create a new webhook :

### Webhook 1 : on-new-order
- **Name** : `on-new-order`
- **Table** : `orders`
- **Events** : INSERT
- **URL** : `https://TON_PROJECT_REF.supabase.co/functions/v1/on-new-order`
- **HTTP Headers** : `Authorization: Bearer TON_SERVICE_ROLE_KEY`

### Webhook 2 : on-order-status
- **Name** : `on-order-status`
- **Table** : `orders`
- **Events** : UPDATE
- **URL** : `https://TON_PROJECT_REF.supabase.co/functions/v1/on-order-status`
- **HTTP Headers** : `Authorization: Bearer TON_SERVICE_ROLE_KEY`

### Webhook 3 : on-kyc-update
- **Name** : `on-kyc-update`
- **Table** : `kyc_requests`
- **Events** : UPDATE
- **URL** : `https://TON_PROJECT_REF.supabase.co/functions/v1/on-kyc-update`
- **HTTP Headers** : `Authorization: Bearer TON_SERVICE_ROLE_KEY`

### Webhook 4 : on-new-message
- **Name** : `on-new-message`
- **Table** : `messages`
- **Events** : INSERT
- **URL** : `https://TON_PROJECT_REF.supabase.co/functions/v1/on-new-message`
- **HTTP Headers** : `Authorization: Bearer TON_SERVICE_ROLE_KEY`

---

## 4. Templates Auth Supabase (inscription + reset)

Dans Supabase Dashboard → **Authentication → Email Templates** :

### Confirmation d'inscription
- Copie le contenu de `supabase/email-templates/confirm-signup.html`
- Colle dans le template **"Confirm signup"**

### Réinitialisation mot de passe
- Copie le contenu de `supabase/email-templates/reset-password.html`
- Colle dans le template **"Reset Password"**

---

## 5. Récapitulatif des emails envoyés

| Déclencheur | Destinataire | Email |
|---|---|---|
| Inscription | Acheteur/Vendeur | Confirmation d'email (template Auth) |
| Commande passée | Acheteur | Récapitulatif de commande avec articles |
| Commande passée | Vendeur(s) | Notification nouvelle commande |
| Statut → Expédiée | Acheteur | Email avec numéro de suivi |
| Statut → Livrée | Acheteur | Email de livraison |
| Statut → Annulée | Acheteur | Email d'annulation |
| KYC approuvé | Vendeur | Email d'activation compte vendeur |
| KYC rejeté | Vendeur | Email avec raison du rejet |
| Mot de passe oublié | Utilisateur | Lien de réinitialisation (template Auth) |

---

## 6. Tester

```bash
# Tester send-email directement
curl -X POST https://TON_PROJECT_REF.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer TON_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test Clorivo","html":"<h1>Ça marche !</h1>"}'
```
