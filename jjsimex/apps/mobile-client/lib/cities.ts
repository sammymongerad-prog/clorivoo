// Villes de retrait JJ's IMEX (partagées entre register, dashboard, profil)
export const CITIES_HT = [
  'Port-au-Prince', 'Cap-Haïtien', 'Gonaïves', 'Saint-Marc',
  'Pétion-Ville', 'Delmas', 'Jacmel', 'Les Cayes', 'Jérémie',
];
export const CITIES_RD = [
  'Santo Domingo', 'Santiago', 'Punta Cana', 'La Romana',
  'San Pedro de Macorís', 'Puerto Plata',
];

export type DestCountry = 'haiti' | 'dr';

export const CITIES_BY_COUNTRY: Record<DestCountry, string[]> = {
  haiti: CITIES_HT,
  dr: CITIES_RD,
};
