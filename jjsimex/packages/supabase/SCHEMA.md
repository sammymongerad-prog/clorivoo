# Schéma Supabase — JJ's IMEX

**Projet :** `rrjrnckyoqhevzoafnut` (jjs imex)  
**Région :** `us-west-2`

## Tables (13)

| Table | Description | Lignes initiales |
|---|---|---|
| `users` | Clients, employés, admins | 2 (Marie Joseph + Jean Paul) |
| `branches` | Succursales USA/Haïti/RD | 8 |
| `departures` | Départs avion/bateau | 0 |
| `packages` | Colis | 1 (JJI-2025-00847) |
| `package_status_history` | Historique statuts colis | 1 |
| `payments` | Paiements | 1 (TXN-00847) |
| `personal_shopper` | Demandes Personal Shopper | 0 |
| `shipping_rates` | Tarifs par ville/pays | 15 |
| `exchange_rates` | Taux de change USD/HTG/DOP | 1 |
| `notifications` | Notifications in-app | 1 |
| `promotions` | Bannières promo | 0 |
| `referrals` | Parrainages | 0 |
| `push_tokens` | Tokens Expo push | 0 |

## Fonctions SQL

- `generate_tracking_number()` → `JJI-2025-00001`
- `generate_us_suite(name)` → `JJI-JEAN123`
- `generate_transaction_number()` → `TXN-00001`
- `generate_request_number()` → `PS-2025-00001`
- `calculate_volumetric_weight(l, w, h)` → `L×l×H ÷ 139`
- `calculate_billed_weight(real, vol)` → `MAX(réel, volumétrique)`
- `update_loyalty_level(user_id)` → bronze/silver/gold

## Triggers

- `trg_package_before_insert` — génère tracking_number
- `trg_package_after_insert` — stats client, historique, notif
- `trg_package_status_update` — historique statut, notif client
- `trg_payment_confirmed` — total_spent client, notif
- `trg_user_insert` — génère us_suite et referral_code
- `trg_*_updated_at` — timestamp automatique

## RLS

| Rôle | Accès |
|---|---|
| `client` | Ses propres données uniquement, sans `internal_notes` |
| `employee` | Colis + clients, pas les paiements |
| `admin` | Toutes données, pas les paramètres système |
| `super_admin` | Accès total sans restriction |

## Données de test

- **Super Admin :** `marie@jjsimex.com` / `Admin@JJ2025`
- **Client :** `jean.paul@gmail.com` / `Client@JJ2025`
- **Colis :** `JJI-2025-00847` — En transit — 2.4 lbs — Avion — $18.50
- **Paiement :** `TXN-00847` — MonCash — Confirmé
