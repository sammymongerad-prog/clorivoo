import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Lang = 'fr' | 'en';

const translations: Record<string, Record<Lang, string>> = {
  home: { fr: 'Accueil', en: 'Home' },
  my_packages: { fr: 'Mes colis', en: 'My Packages' },
  send: { fr: 'Envoyer', en: 'Send' },
  profile: { fr: 'Profil', en: 'Profile' },
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
