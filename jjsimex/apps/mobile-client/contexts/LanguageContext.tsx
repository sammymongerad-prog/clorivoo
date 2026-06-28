import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Lang = 'fr' | 'en';

const translations: Record<string, Record<Lang, string>> = {
  // Tabs
  home: { fr: 'Accueil', en: 'Home' },
  my_packages: { fr: 'Mes colis', en: 'My Packages' },
  send: { fr: 'Envoyer', en: 'Send' },
  profile: { fr: 'Profil', en: 'Profile' },
  notifications: { fr: 'Notifications', en: 'Notifications' },

  // Home screen
  hello: { fr: 'Bonjour', en: 'Hello' },
  offers: { fr: 'Offres', en: 'Offers' },
  departures: { fr: 'Départs', en: 'Departures' },
  guide: { fr: 'Guide', en: 'Guide' },
  news: { fr: 'Nouvelles', en: 'News' },
  sponsorship: { fr: 'Parrainage', en: 'Referral' },
  track_package: { fr: 'Tracker un colis', en: 'Track a package' },
  rate_calculator: { fr: 'Calculateur', en: 'Calculator' },
  my_us_addresses: { fr: 'Mes adresses US', en: 'My US addresses' },
  whats_new: { fr: 'Nouveautés', en: "What's new" },
  home_pickup: { fr: 'Pickup à domicile', en: 'Home pickup' },
  dropoff_points: { fr: 'Points de dépôt', en: 'Drop-off points' },
  service: { fr: 'Service', en: 'Service' },
  next_departure: { fr: 'Prochain départ', en: 'Next departure' },
  view_calendar: { fr: 'Voir calendrier →', en: 'View calendar →' },
  airplane: { fr: 'Avion', en: 'Airplane' },
  boat: { fr: 'Bateau', en: 'Boat' },
  lbs_remaining: { fr: 'lbs restantes', en: 'lbs remaining' },
  almost_full: { fr: 'Bientôt complet !', en: 'Almost full!' },
  spots_available: { fr: 'Places disponibles', en: 'Spots available' },
  active_package: { fr: 'Colis en cours', en: 'Active package' },
  view_all: { fr: 'Voir tout →', en: 'View all →' },
  tracking_number: { fr: 'Numéro de suivi', en: 'Tracking number' },
  follow_detail: { fr: 'Suivre en détail →', en: 'Track in detail →' },
  estimated_delivery: { fr: 'Livraison estimée', en: 'Estimated delivery' },
  recent: { fr: 'Récents', en: 'Recent' },
  delivered_check: { fr: 'Livré ✓', en: 'Delivered ✓' },
  our_branches: { fr: 'Nos succursales', en: 'Our branches' },
  view_map: { fr: 'Voir la carte →', en: 'View map →' },
  open_now: { fr: 'Ouvert maintenant', en: 'Open now' },
  closed: { fr: 'Fermé', en: 'Closed' },
  closes_at: { fr: 'Ferme à', en: 'Closes at' },
  directions: { fr: 'Itinéraire', en: 'Directions' },
  choose_city: { fr: 'Choisir ma ville', en: 'Choose my city' },
  type_city: { fr: 'Tapez une ville...', en: 'Type a city...' },
  confirm: { fr: 'Confirmer', en: 'Confirm' },
  legal_footer: { fr: "JJ's IMEX opère entre Miami, Boston, Haïti et la République Dominicaine. Service soumis à nos conditions de transport.", en: "JJ's IMEX operates between Miami, Boston, Haiti and the Dominican Republic. Service subject to our shipping terms." },
  shipping_terms: { fr: 'Conditions de transport', en: 'Shipping terms' },

  // Status labels
  status_awaiting: { fr: 'En attente', en: 'Awaiting' },
  status_received: { fr: 'Reçu USA', en: 'Received USA' },
  status_transit: { fr: 'En transit', en: 'In transit' },
  status_arrived: { fr: 'Arrivé', en: 'Arrived' },
  status_ready: { fr: 'Prêt retrait', en: 'Ready for pickup' },
  status_delivered: { fr: 'Livré', en: 'Delivered' },
  received: { fr: 'Reçu', en: 'Received' },
  transit: { fr: 'Transit', en: 'Transit' },
  arrived: { fr: 'Arrivé', en: 'Arrived' },
  delivered: { fr: 'Livré', en: 'Delivered' },

  // Calculator
  calculator_title: { fr: 'Calculateur de tarif', en: 'Rate calculator' },
  air_plane: { fr: '✈️ Avion', en: '✈️ Airplane' },
  sea_boat: { fr: '🚢 Bateau', en: '🚢 Boat' },
  air_days: { fr: '5-7 jours', en: '5-7 days' },
  sea_weeks: { fr: '3-4 semaines', en: '3-4 weeks' },
  destination: { fr: 'Destination', en: 'Destination' },
  package_weight: { fr: 'Poids du colis', en: 'Package weight' },
  package_value: { fr: 'Valeur du colis', en: 'Package value' },
  your_estimate: { fr: 'Votre estimation', en: 'Your estimate' },
  insurance_included: { fr: 'Assurance incluse jusqu\'à $100 automatiquement', en: 'Insurance included up to $100 automatically' },
  connect_discounts: { fr: 'Connectez-vous pour voir\nvos réductions fidélité', en: 'Sign in to see\nyour loyalty discounts' },
  lbs_billed: { fr: 'lbs facturés', en: 'lbs billed' },
  delivery_approx: { fr: 'Livraison ~', en: 'Delivery ~' },
  estimated_on: { fr: 'Estimé le', en: 'Estimated on' },
  departure: { fr: 'Départ', en: 'Departure' },
  arrival: { fr: 'Arrivée', en: 'Arrival' },
  delivery: { fr: 'Livraison', en: 'Delivery' },
  covered_100: { fr: '✅ Votre colis est couvert à 100%', en: '✅ Your package is 100% covered' },
  free_insurance: { fr: 'Assurance gratuite jusqu\'à $100', en: 'Free insurance up to $100' },
  included: { fr: 'Inclus', en: 'Included' },
  value_exceeds: { fr: '⚠️ Valeur dépasse $100', en: '⚠️ Value exceeds $100' },
  extra_coverage: { fr: 'Assurance supplémentaire recommandée pour', en: 'Additional insurance recommended for' },
  additional_coverage: { fr: 'de couverture additionnelle.', en: 'of additional coverage.' },
  add_coverage: { fr: 'Ajouter une couverture →', en: 'Add coverage →' },
  rate_detail: { fr: 'Détail du tarif', en: 'Rate detail' },
  shipping_fees: { fr: "Frais d'expédition", en: 'Shipping fees' },
  insurance_up_100: { fr: 'Assurance (jusqu\'à $100)', en: 'Insurance (up to $100)' },
  free: { fr: 'Gratuit', en: 'Free' },
  handling: { fr: 'Manutention', en: 'Handling' },
  total: { fr: 'Total', en: 'Total' },
  order_now: { fr: 'Commander maintenant', en: 'Order now' },
  reduction: { fr: 'Réduction', en: 'Discount' },
  business_days: { fr: 'jours ouvrés', en: 'business days' },
  weeks: { fr: 'semaines', en: 'weeks' },

  // Create shipment
  create_shipment: { fr: 'Créer un envoi', en: 'Create a shipment' },
  step_of: { fr: 'Étape', en: 'Step' },
  of: { fr: 'sur', en: 'of' },
  what_sending: { fr: "Qu'envoyez-vous ?", en: 'What are you sending?' },
  cat_phone: { fr: 'Téléphone', en: 'Phone' },
  cat_laptop: { fr: 'Ordinateur', en: 'Computer' },
  cat_clothes: { fr: 'Vêtements', en: 'Clothes' },
  cat_shoes: { fr: 'Chaussures', en: 'Shoes' },
  cat_electronics: { fr: 'Électronique', en: 'Electronics' },
  cat_home: { fr: 'Maison', en: 'Home' },
  cat_cosmetics: { fr: 'Cosmétiques', en: 'Cosmetics' },
  cat_other: { fr: 'Autre', en: 'Other' },
  the_product: { fr: 'Le produit', en: 'The product' },
  description: { fr: 'Description', en: 'Description' },
  weight_lbs: { fr: 'Poids estimé (lbs)', en: 'Estimated weight (lbs)' },
  declared_value: { fr: 'Valeur déclarée ($)', en: 'Declared value ($)' },
  quantity: { fr: 'Quantité', en: 'Quantity' },
  product_photos: { fr: 'Photos du produit (optionnel)', en: 'Product photos (optional)' },
  photo_help: { fr: 'Une capture du produit ou de la confirmation de commande nous aide à identifier votre colis.', en: 'A screenshot of the product or order confirmation helps us identify your package.' },
  photo_warning_title: { fr: '⚠️ Avant de prendre vos photos', en: '⚠️ Before taking your photos' },
  photo_warning_text: { fr: 'Écrivez clairement VOTRE NOM et le NOM DU DESTINATAIRE sur le colis avant de le prendre en photo. Cela nous aide à identifier rapidement votre envoi à la réception et évite les erreurs de livraison.', en: 'Clearly write YOUR NAME and the RECIPIENT\'S NAME on the package before taking the photo. This helps us quickly identify your shipment upon receipt and avoids delivery errors.' },
  tap_to_add: { fr: 'Tap pour ajouter', en: 'Tap to add' },
  recipient_in: { fr: 'Destinataire', en: 'Recipient' },
  in_haiti: { fr: 'en Haïti', en: 'in Haiti' },
  in_dr: { fr: 'en Rép. Dom.', en: 'in Dom. Rep.' },
  first_name: { fr: 'Prénom', en: 'First name' },
  last_name: { fr: 'Nom', en: 'Last name' },
  recipient_phone: { fr: 'Téléphone destinataire', en: 'Recipient phone' },
  country: { fr: 'Pays', en: 'Country' },
  destination_city: { fr: 'Ville de destination', en: 'Destination city' },
  choose_city_picker: { fr: 'Choisir une ville', en: 'Choose a city' },
  delivery_address: { fr: 'Adresse de livraison', en: 'Delivery address' },
  full_address: { fr: 'Adresse complète du destinataire', en: 'Full recipient address' },
  choose_transport: { fr: 'Choisissez le transport', en: 'Choose transport' },
  air_freight: { fr: 'Air Freight', en: 'Air Freight' },
  fast_delivery: { fr: 'Livraison rapide', en: 'Fast delivery' },
  sea_freight: { fr: 'Sea Freight', en: 'Sea Freight' },
  cheaper_slower: { fr: 'Moins cher, plus lent', en: 'Cheaper, slower' },
  estimated_delay: { fr: 'Délai estimé', en: 'Estimated delay' },
  estimated_price: { fr: 'Prix estimé', en: 'Estimated price' },
  order_summary: { fr: 'Résumé de la commande', en: 'Order summary' },
  category: { fr: 'Catégorie', en: 'Category' },
  mode: { fr: 'Mode', en: 'Mode' },
  shipping_price: { fr: 'Prix expédition', en: 'Shipping price' },
  insurance: { fr: 'Assurance', en: 'Insurance' },
  total_estimated: { fr: 'TOTAL ESTIMÉ', en: 'ESTIMATED TOTAL' },
  price_note: { fr: 'Le prix final sera confirmé au poids réel à la réception du colis.', en: 'The final price will be confirmed at actual weight upon package receipt.' },
  continue_btn: { fr: 'Continuer', en: 'Continue' },
  finalize_request: { fr: 'Finaliser votre demande', en: 'Finalize your request' },
  recipient_label: { fr: 'Destinataire', en: 'Recipient' },
  recipient_phone_label: { fr: 'Tél. destinataire', en: 'Recipient phone' },
  address: { fr: 'Adresse', en: 'Address' },
  confirm_request: { fr: 'Confirmer la demande', en: 'Confirm request' },
  finalize_whatsapp: { fr: 'Finaliser sur WhatsApp', en: 'Finalize on WhatsApp' },
  request_saved: { fr: 'Demande enregistrée !', en: 'Request saved!' },
  request_desc: { fr: 'Achetez votre produit chez le marchand. Vous recevrez une notification dans les 2 à 5 prochains jours pour ajouter votre numéro de suivi et le nom du transporteur utilisé (UPS, FedEx, USPS, etc.).', en: 'Purchase your product from the merchant. You will receive a notification within the next 2 to 5 days to add your tracking number and the carrier used (UPS, FedEx, USPS, etc.).' },
  add_tracking_now: { fr: 'Ajouter mon tracking maintenant', en: 'Add my tracking now' },
  later_back_home: { fr: "Plus tard, retour à l'accueil", en: 'Later, back to home' },
  copy: { fr: 'Copier', en: 'Copy' },
  copied: { fr: 'Copié !', en: 'Copied!' },
  error: { fr: 'Erreur', en: 'Error' },
  not_available: { fr: 'Non disponible', en: 'Not available' },
  photo_needs_build: { fr: 'La sélection de photos nécessite un development build. Les photos pourront être ajoutées ultérieurement.', en: 'Photo selection requires a development build. Photos can be added later.' },

  // Colis (packages list)
  all: { fr: 'Tous', en: 'All' },
  active: { fr: 'En cours', en: 'Active' },
  delivered_filter: { fr: 'Livrés', en: 'Delivered' },
  search_tracking: { fr: 'Rechercher un tracking...', en: 'Search a tracking...' },
  loading: { fr: 'Chargement...', en: 'Loading...' },
  no_packages: { fr: 'Aucun colis', en: 'No packages' },
  packages_appear_here: { fr: 'Vos colis apparaîtront ici une fois créés', en: 'Your packages will appear here once created' },
  add_my_tracking: { fr: 'Ajouter mon tracking', en: 'Add my tracking' },

  // Notifications
  no_notifications: { fr: 'Aucune notification', en: 'No notifications' },
  up_to_date: { fr: "Vous êtes à jour ! On vous préviendra dès qu'un colis bougera.", en: "You're up to date! We'll notify you as soon as a package moves." },
  mark_all_read: { fr: 'Tout marquer lu', en: 'Mark all read' },
  today: { fr: "Aujourd'hui", en: 'Today' },
  yesterday: { fr: 'Hier', en: 'Yesterday' },
  this_week: { fr: 'Cette semaine', en: 'This week' },
  ago_min: { fr: 'Il y a', en: '' },
  min: { fr: 'min', en: 'min ago' },
  filter_all: { fr: 'Tout', en: 'All' },
  filter_packages: { fr: 'Colis', en: 'Packages' },
  filter_payment: { fr: 'Paiement', en: 'Payment' },
  filter_promos: { fr: 'Promos', en: 'Promos' },
  filter_system: { fr: 'Système', en: 'System' },

  // Add carrier tracking
  carrier_tracking: { fr: 'Numéro de suivi', en: 'Tracking number' },
  request_ref: { fr: 'Référence demande', en: 'Request reference' },
  carrier: { fr: 'Transporteur', en: 'Carrier' },
  choose_carrier: { fr: 'Choisir un transporteur', en: 'Choose a carrier' },
  tracking_number_input: { fr: 'Numéro de tracking', en: 'Tracking number' },
  save: { fr: 'Enregistrer', en: 'Save' },
  tracking_added: { fr: 'Tracking ajouté !', en: 'Tracking added!' },
  tracking_added_desc: { fr: "Nous suivrons l'arrivée de votre colis et vous notifierons dès sa réception dans notre entrepôt.", en: 'We will track your package arrival and notify you as soon as it is received at our warehouse.' },
  back_to_home: { fr: "Retour à l'accueil", en: 'Back to home' },

  // Profile (existing)
  my_profile: { fr: 'Mon Profil', en: 'My Profile' },
  personal_info: { fr: 'Mes informations personnelles', en: 'My personal information' },
  personal_info_sub: { fr: 'Nom, email, téléphone', en: 'Name, email, phone' },
  package_history: { fr: 'Historique des colis', en: 'Package history' },
  package_history_sub: { fr: 'Toutes mes expéditions', en: 'All my shipments' },
  personal_shopper: { fr: 'Personal Shopper', en: 'Personal Shopper' },
  personal_shopper_sub: { fr: 'Commandes en cours', en: 'Current orders' },
  us_addresses: { fr: 'Mes adresses US', en: 'My US addresses' },
  us_addresses_sub: { fr: 'Miami + Boston', en: 'Miami + Boston' },
  payments: { fr: 'Mes paiements', en: 'My payments' },
  payments_sub: { fr: 'MonCash, Zelle configurés', en: 'MonCash, Zelle configured' },
  calculator: { fr: 'Calculateur de tarifs', en: 'Rate calculator' },
  calculator_sub: { fr: 'Estimez vos frais', en: 'Estimate your fees' },
  preferences: { fr: 'Préférences', en: 'Preferences' },
  language: { fr: 'Langue', en: 'Language' },
  french: { fr: 'Français', en: 'French' },
  english: { fr: 'Anglais', en: 'English' },
  whatsapp_notif: { fr: 'Notifications WhatsApp', en: 'WhatsApp Notifications' },
  email_notif: { fr: 'Notifications email', en: 'Email Notifications' },
  theme: { fr: 'Thème', en: 'Theme' },
  light_mode: { fr: 'Mode jour', en: 'Light mode' },
  dark_mode: { fr: 'Mode nuit', en: 'Dark mode' },
  support: { fr: 'Support', en: 'Support' },
  contact_whatsapp: { fr: 'Contacter via WhatsApp', en: 'Contact via WhatsApp' },
  help_faq: { fr: "Centre d'aide & FAQ", en: 'Help & FAQ' },
  help_faq_sub: { fr: 'Réponses à vos questions', en: 'Answers to your questions' },
  rate_app: { fr: "Noter l'application", en: 'Rate the app' },
  rate_app_sub: { fr: 'Donnez-nous votre avis', en: 'Give us your feedback' },
  referral: { fr: 'Parrainage', en: 'Referral' },
  referral_sub: { fr: 'Invitez vos amis, gagnez des points', en: 'Invite friends, earn points' },
  sign_out: { fr: 'Se déconnecter', en: 'Sign out' },
  sign_out_confirm: { fr: 'Voulez-vous vraiment vous déconnecter ?', en: 'Are you sure you want to sign out?' },
  cancel: { fr: 'Annuler', en: 'Cancel' },
  disconnect: { fr: 'Déconnexion', en: 'Sign out' },
  verified_client: { fr: 'Client vérifié', en: 'Verified client' },
  packages_sent: { fr: 'Colis envoyés', en: 'Packages sent' },
  in_progress: { fr: 'En cours', en: 'In progress' },
  member_since: { fr: 'Membre depuis', en: 'Member since' },
  my_account: { fr: 'Mon compte', en: 'My account' },
  enabled: { fr: 'Activé', en: 'Enabled' },
  disabled: { fr: 'Désactivé', en: 'Disabled' },
  new_member: { fr: 'Nouveau', en: 'New' },
  years: { fr: 'ans', en: 'years' },
  choose_language: { fr: 'Choisir la langue', en: 'Choose language' },
  estimated_weight: { fr: 'Poids estimé', en: 'Estimated weight' },
  select_photo: { fr: 'Photo de profil', en: 'Profile photo' },
  take_photo: { fr: 'Prendre une photo', en: 'Take a photo' },
  choose_gallery: { fr: 'Choisir dans la galerie', en: 'Choose from gallery' },
  delete_photo: { fr: 'Supprimer la photo', en: 'Delete photo' },

  // Auth
  login: { fr: 'Se connecter', en: 'Sign in' },
  register: { fr: "S'inscrire", en: 'Sign up' },
  email: { fr: 'Email', en: 'Email' },
  password: { fr: 'Mot de passe', en: 'Password' },
  forgot_password: { fr: 'Mot de passe oublié ?', en: 'Forgot password?' },
  no_account: { fr: "Pas de compte ?", en: "Don't have an account?" },
  have_account: { fr: 'Déjà un compte ?', en: 'Already have an account?' },
};

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'fr',
  setLang: () => {},
  t: (key) => key,
});

const STORAGE_KEY = '@jjsimex_lang';

export function LanguageProvider({ children }: { children: any }) {
  const [lang, setLangState] = useState<Lang>('fr');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(v => {
      if (v === 'fr' || v === 'en') setLangState(v);
    }).catch(() => {});
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
  }

  function t(key: string): string {
    return translations[key]?.[lang] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
