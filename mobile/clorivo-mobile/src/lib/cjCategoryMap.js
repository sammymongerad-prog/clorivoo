// Maps CJ Dropshipping category names to Clorivo main category slugs
// Used to automatically assign imported products to the correct category

const KEYWORD_MAP = [
  // Mode
  { slug: 'mode', keywords: ['clothing', 'fashion', 'dress', 'shirt', 'pants', 'jeans', 'jacket', 'coat', 'scarf', 'wrap', 'skirt', 'blouse', 'suit', 'tie', 'underwear', 'lingerie', 'swimwear', 'socks', 'hat', 'cap', 'gloves', 'belt', 'wallet', 'handbag', 'bag', 'purse', 'shoes', 'boots', 'sneakers', 'sandals', 'jewelry', 'necklace', 'bracelet', 'ring', 'earring', 'watch', 'sunglasses', 'accessories', 'vêtements', 'mode', 'femme', 'homme'] },
  // Beauté
  { slug: 'beaute', keywords: ['beauty', 'makeup', 'cosmetic', 'skincare', 'hair', 'nail', 'perfume', 'fragrance', 'serum', 'cream', 'lotion', 'shampoo', 'mascara', 'lipstick', 'foundation', 'eyeliner', 'brush', 'spa', 'massage', 'hygiene', 'dental', 'face', 'beauté', 'soin', 'maquillage'] },
  // Tech & Électronique
  { slug: 'tech', keywords: ['phone', 'smartphone', 'tablet', 'laptop', 'computer', 'camera', 'audio', 'earphone', 'headphone', 'speaker', 'gaming', 'game', 'console', 'keyboard', 'mouse', 'cable', 'charger', 'power bank', 'drone', 'smartwatch', 'wearable', 'gadget', 'electronic', 'tech'] },
  { slug: 'electro', keywords: ['appliance', 'kitchen appliance', 'vacuum', 'blender', 'coffee', 'air fryer', 'toaster', 'washing', 'refrigerator', 'fan', 'heater', 'lamp', 'light', 'led', 'bulb', 'smart home', 'security camera', 'doorbell', 'électroménager', 'électro'] },
  // Maison
  { slug: 'maison', keywords: ['home', 'garden', 'furniture', 'decoration', 'decor', 'bedding', 'pillow', 'curtain', 'rug', 'mat', 'storage', 'organizer', 'kitchen', 'cookware', 'tool', 'paint', 'plant', 'pot', 'outdoor', 'patio', 'bathroom', 'towel', 'cleaning', 'maison', 'jardin', 'cuisine', 'déco', 'rangement'] },
  // Enfants
  { slug: 'enfants', keywords: ['baby', 'kid', 'child', 'toy', 'doll', 'puzzle', 'educational', 'school', 'stroller', 'diaper', 'feeding', 'nursery', 'playground', 'enfant', 'bébé', 'jouet'] },
  // Sport
  { slug: 'sport', keywords: ['sport', 'fitness', 'gym', 'yoga', 'outdoor', 'cycling', 'bike', 'running', 'swim', 'hiking', 'camping', 'fishing', 'hunting', 'martial', 'football', 'basketball', 'tennis', 'golf', 'ski', 'skateboard', 'surf', 'climbing', 'vélo', 'randonnée'] },
];

/**
 * Given a CJ category name (e.g. "Scarves & Wraps", "Men's Clothing"),
 * returns the matching Clorivo main category slug (e.g. "mode").
 * Falls back to "maison" if no match found.
 */
export function mapCjCategoryToSlug(cjCategoryName = '') {
  const lower = cjCategoryName.toLowerCase();
  for (const { slug, keywords } of KEYWORD_MAP) {
    if (keywords.some(kw => lower.includes(kw))) return slug;
  }
  return 'maison'; // default fallback
}

export const CLORIVO_MAIN_CATS = [
  { slug: 'maison',   label: 'Maison',      color: '#C97B5A', icon: '🏠' },
  { slug: 'tech',     label: 'Tech',         color: '#4A6FD4', icon: '📱' },
  { slug: 'beaute',   label: 'Beauté',       color: '#E67E22', icon: '💄' },
  { slug: 'mode',     label: 'Mode',         color: '#9B59B6', icon: '👗' },
  { slug: 'enfants',  label: 'Enfants',      color: '#F59E0B', icon: '🧸' },
  { slug: 'sport',    label: 'Sport',        color: '#10B981', icon: '⚽' },
  { slug: 'electro',  label: 'Électro',      color: '#3B82F6', icon: '🔌' },
];
