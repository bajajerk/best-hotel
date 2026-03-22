import { CuratedCity } from './api';

// ---------------------------------------------------------------------------
// Continents
// ---------------------------------------------------------------------------

export const CONTINENTS = [
  'All',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Africa',
  'Oceania',
] as const;

export type Continent = (typeof CONTINENTS)[number];

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const CATEGORIES = {
  singles: {
    label: 'Singles',
    icon: 'solo',
    description: 'Perfect for friends & solo travellers',
  },
  couples: {
    label: 'Couples',
    icon: 'couple',
    description: 'Romantic getaways & honeymoons',
  },
  families: {
    label: 'Families',
    icon: 'family',
    description: 'Family-friendly stays with space to spare',
  },
} as const;

export type Category = keyof typeof CATEGORIES;

// ---------------------------------------------------------------------------
// Curated city images — reliable direct Unsplash URLs for all 50 cities
// ---------------------------------------------------------------------------

export const CITY_IMAGES: Record<string, string> = {
  bangkok: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&q=80',
  tokyo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
  paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
  london: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
  dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
  singapore: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80',
  'new-york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
  'chiang-mai': 'https://images.unsplash.com/photo-1598935898639-81586f7d2129?w=800&q=80',
  barcelona: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80',
  rome: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80',
  prague: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&q=80',
  amsterdam: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80',
  berlin: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=80',
  seoul: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800&q=80',
  'hong-kong': 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&q=80',
  'kuala-lumpur': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=80',
  mumbai: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80',
  delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80',
  bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
  phuket: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800&q=80',
  lisbon: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&q=80',
  vienna: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800&q=80',
  sydney: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80',
  melbourne: 'https://images.unsplash.com/photo-1514395462725-fb4566210144?w=800&q=80',
  milan: 'https://images.unsplash.com/photo-1520440229-6469d1bfe80a?w=800&q=80',
  florence: 'https://images.unsplash.com/photo-1543429258-0a3e78096a93?w=800&q=80',
  budapest: 'https://images.unsplash.com/photo-1549877452-9c387954fbc2?w=800&q=80',
  dublin: 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=800&q=80',
  edinburgh: 'https://images.unsplash.com/photo-1454537468202-b7ff71d51c2e?w=800&q=80',
  athens: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800&q=80',
  santorini: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80',
  marrakech: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800&q=80',
  'cape-town': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80',
  'rio-de-janeiro': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80',
  'buenos-aires': 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800&q=80',
  'mexico-city': 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=800&q=80',
  cancun: 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=800&q=80',
  pattaya: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&q=80',
  lima: 'https://images.unsplash.com/photo-1531968455001-5c5272a67c71?w=800&q=80',
  kyoto: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
  taipei: 'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=800&q=80',
  geneva: 'https://images.unsplash.com/photo-1573108037329-37aa135a142e?w=800&q=80',
  maldives: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80',
  jaipur: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&q=80',
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80',
  colombo: 'https://images.unsplash.com/photo-1586211082529-c2fc67e099b9?w=800&q=80',
  kathmandu: 'https://images.unsplash.com/photo-1558799401-1dcba79834c2?w=800&q=80',
  hanoi: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80',
  'ho-chi-minh-city': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80',
  osaka: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800&q=80',
};

export const FALLBACK_CITY_IMAGE =
  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80';

export function getCityImage(slug: string): string {
  return CITY_IMAGES[slug] || FALLBACK_CITY_IMAGE;
}

// ---------------------------------------------------------------------------
// Sample cities — fallback data when the API is unavailable
// ---------------------------------------------------------------------------

export const SAMPLE_CITIES: CuratedCity[] = [
  { city_slug: 'bangkok', city_name: 'Bangkok', country: 'Thailand', country_code: 'TH', city_id: null, continent: 'Asia', tagline: 'Street food capital meets temple serenity', image_url: CITY_IMAGES['bangkok'], hotel_count: 0, display_order: 1 },
  { city_slug: 'tokyo', city_name: 'Tokyo', country: 'Japan', country_code: 'JP', city_id: null, continent: 'Asia', tagline: 'Where ancient tradition meets neon future', image_url: CITY_IMAGES['tokyo'], hotel_count: 0, display_order: 2 },
  { city_slug: 'paris', city_name: 'Paris', country: 'France', country_code: 'FR', city_id: null, continent: 'Europe', tagline: 'The eternal city of love and lights', image_url: CITY_IMAGES['paris'], hotel_count: 0, display_order: 3 },
  { city_slug: 'london', city_name: 'London', country: 'United Kingdom', country_code: 'GB', city_id: null, continent: 'Europe', tagline: 'Royal heritage and cutting-edge cool', image_url: CITY_IMAGES['london'], hotel_count: 0, display_order: 4 },
  { city_slug: 'dubai', city_name: 'Dubai', country: 'United Arab Emirates', country_code: 'AE', city_id: null, continent: 'Asia', tagline: 'Desert oasis of luxury and ambition', image_url: CITY_IMAGES['dubai'], hotel_count: 0, display_order: 5 },
  { city_slug: 'singapore', city_name: 'Singapore', country: 'Singapore', country_code: 'SG', city_id: null, continent: 'Asia', tagline: 'Garden city where East meets West', image_url: CITY_IMAGES['singapore'], hotel_count: 0, display_order: 6 },
  { city_slug: 'new-york', city_name: 'New York', country: 'United States', country_code: 'US', city_id: null, continent: 'North America', tagline: 'The city that never sleeps', image_url: CITY_IMAGES['new-york'], hotel_count: 0, display_order: 7 },
  { city_slug: 'chiang-mai', city_name: 'Chiang Mai', country: 'Thailand', country_code: 'TH', city_id: null, continent: 'Asia', tagline: 'Temples, night markets, and mountain air', image_url: CITY_IMAGES['chiang-mai'], hotel_count: 0, display_order: 8 },
  { city_slug: 'barcelona', city_name: 'Barcelona', country: 'Spain', country_code: 'ES', city_id: null, continent: 'Europe', tagline: 'Gaudi dreams and Mediterranean vibes', image_url: CITY_IMAGES['barcelona'], hotel_count: 0, display_order: 9 },
  { city_slug: 'rome', city_name: 'Rome', country: 'Italy', country_code: 'IT', city_id: null, continent: 'Europe', tagline: 'Eternal city of emperors and espresso', image_url: CITY_IMAGES['rome'], hotel_count: 0, display_order: 10 },
  { city_slug: 'prague', city_name: 'Prague', country: 'Czech Republic', country_code: 'CZ', city_id: null, continent: 'Europe', tagline: 'Fairy-tale spires and golden lanes', image_url: CITY_IMAGES['prague'], hotel_count: 0, display_order: 11 },
  { city_slug: 'amsterdam', city_name: 'Amsterdam', country: 'Netherlands', country_code: 'NL', city_id: null, continent: 'Europe', tagline: 'Canals, culture, and creative spirit', image_url: CITY_IMAGES['amsterdam'], hotel_count: 0, display_order: 12 },
  { city_slug: 'berlin', city_name: 'Berlin', country: 'Germany', country_code: 'DE', city_id: null, continent: 'Europe', tagline: 'Bold, free, and forever reinventing itself', image_url: CITY_IMAGES['berlin'], hotel_count: 0, display_order: 13 },
  { city_slug: 'seoul', city_name: 'Seoul', country: 'South Korea', country_code: 'KR', city_id: null, continent: 'Asia', tagline: 'K-culture capital with ancient soul', image_url: CITY_IMAGES['seoul'], hotel_count: 0, display_order: 14 },
  { city_slug: 'hong-kong', city_name: 'Hong Kong', country: 'Hong Kong', country_code: 'HK', city_id: null, continent: 'Asia', tagline: 'Skyline spectacle on Victoria Harbour', image_url: CITY_IMAGES['hong-kong'], hotel_count: 0, display_order: 15 },
  { city_slug: 'kuala-lumpur', city_name: 'Kuala Lumpur', country: 'Malaysia', country_code: 'MY', city_id: null, continent: 'Asia', tagline: 'Twin towers and tantalizing street eats', image_url: CITY_IMAGES['kuala-lumpur'], hotel_count: 0, display_order: 16 },
  { city_slug: 'mumbai', city_name: 'Mumbai', country: 'India', country_code: 'IN', city_id: null, continent: 'Asia', tagline: 'Bollywood beats and ocean breezes', image_url: CITY_IMAGES['mumbai'], hotel_count: 0, display_order: 17 },
  { city_slug: 'delhi', city_name: 'Delhi', country: 'India', country_code: 'IN', city_id: null, continent: 'Asia', tagline: 'Mughal grandeur meets modern India', image_url: CITY_IMAGES['delhi'], hotel_count: 0, display_order: 18 },
  { city_slug: 'bali', city_name: 'Bali', country: 'Indonesia', country_code: 'ID', city_id: null, continent: 'Asia', tagline: 'Island of gods, surf, and serenity', image_url: CITY_IMAGES['bali'], hotel_count: 0, display_order: 19 },
  { city_slug: 'phuket', city_name: 'Phuket', country: 'Thailand', country_code: 'TH', city_id: null, continent: 'Asia', tagline: 'Tropical paradise with turquoise waters', image_url: CITY_IMAGES['phuket'], hotel_count: 0, display_order: 20 },
  { city_slug: 'lisbon', city_name: 'Lisbon', country: 'Portugal', country_code: 'PT', city_id: null, continent: 'Europe', tagline: 'Sun-soaked tiles and pastel de nata', image_url: CITY_IMAGES['lisbon'], hotel_count: 0, display_order: 21 },
  { city_slug: 'vienna', city_name: 'Vienna', country: 'Austria', country_code: 'AT', city_id: null, continent: 'Europe', tagline: 'Waltzes, coffee houses, and imperial charm', image_url: CITY_IMAGES['vienna'], hotel_count: 0, display_order: 22 },
  { city_slug: 'sydney', city_name: 'Sydney', country: 'Australia', country_code: 'AU', city_id: null, continent: 'Oceania', tagline: 'Harbour city with golden beaches', image_url: CITY_IMAGES['sydney'], hotel_count: 0, display_order: 23 },
  { city_slug: 'melbourne', city_name: 'Melbourne', country: 'Australia', country_code: 'AU', city_id: null, continent: 'Oceania', tagline: 'Laneways, lattes, and live music', image_url: CITY_IMAGES['melbourne'], hotel_count: 0, display_order: 24 },
  { city_slug: 'milan', city_name: 'Milan', country: 'Italy', country_code: 'IT', city_id: null, continent: 'Europe', tagline: 'Fashion capital with Renaissance soul', image_url: CITY_IMAGES['milan'], hotel_count: 0, display_order: 25 },
  { city_slug: 'florence', city_name: 'Florence', country: 'Italy', country_code: 'IT', city_id: null, continent: 'Europe', tagline: 'Cradle of the Renaissance in every corner', image_url: CITY_IMAGES['florence'], hotel_count: 0, display_order: 26 },
  { city_slug: 'budapest', city_name: 'Budapest', country: 'Hungary', country_code: 'HU', city_id: null, continent: 'Europe', tagline: 'Thermal baths and Danube sunsets', image_url: CITY_IMAGES['budapest'], hotel_count: 0, display_order: 27 },
  { city_slug: 'dublin', city_name: 'Dublin', country: 'Ireland', country_code: 'IE', city_id: null, continent: 'Europe', tagline: 'Pubs, prose, and Celtic warmth', image_url: CITY_IMAGES['dublin'], hotel_count: 0, display_order: 28 },
  { city_slug: 'edinburgh', city_name: 'Edinburgh', country: 'United Kingdom', country_code: 'GB', city_id: null, continent: 'Europe', tagline: 'Castle-crowned city of festivals', image_url: CITY_IMAGES['edinburgh'], hotel_count: 0, display_order: 29 },
  { city_slug: 'athens', city_name: 'Athens', country: 'Greece', country_code: 'GR', city_id: null, continent: 'Europe', tagline: 'Birthplace of democracy beneath the Acropolis', image_url: CITY_IMAGES['athens'], hotel_count: 0, display_order: 30 },
  { city_slug: 'santorini', city_name: 'Santorini', country: 'Greece', country_code: 'GR', city_id: null, continent: 'Europe', tagline: 'Blue domes and Aegean sunsets', image_url: CITY_IMAGES['santorini'], hotel_count: 0, display_order: 31 },
  { city_slug: 'marrakech', city_name: 'Marrakech', country: 'Morocco', country_code: 'MA', city_id: null, continent: 'Africa', tagline: 'Spice-scented souks and riad retreats', image_url: CITY_IMAGES['marrakech'], hotel_count: 0, display_order: 32 },
  { city_slug: 'cape-town', city_name: 'Cape Town', country: 'South Africa', country_code: 'ZA', city_id: null, continent: 'Africa', tagline: 'Table Mountain meets two oceans', image_url: CITY_IMAGES['cape-town'], hotel_count: 0, display_order: 33 },
  { city_slug: 'rio-de-janeiro', city_name: 'Rio de Janeiro', country: 'Brazil', country_code: 'BR', city_id: null, continent: 'South America', tagline: 'Samba rhythms and Sugarloaf sunrises', image_url: CITY_IMAGES['rio-de-janeiro'], hotel_count: 0, display_order: 34 },
  { city_slug: 'buenos-aires', city_name: 'Buenos Aires', country: 'Argentina', country_code: 'AR', city_id: null, continent: 'South America', tagline: 'Tango, steak, and bohemian barrios', image_url: CITY_IMAGES['buenos-aires'], hotel_count: 0, display_order: 35 },
  { city_slug: 'mexico-city', city_name: 'Mexico City', country: 'Mexico', country_code: 'MX', city_id: null, continent: 'North America', tagline: 'Aztec roots and world-class cuisine', image_url: CITY_IMAGES['mexico-city'], hotel_count: 0, display_order: 36 },
  { city_slug: 'cancun', city_name: 'Cancun', country: 'Mexico', country_code: 'MX', city_id: null, continent: 'North America', tagline: 'Caribbean blues and Mayan wonders', image_url: CITY_IMAGES['cancun'], hotel_count: 0, display_order: 37 },
  { city_slug: 'pattaya', city_name: 'Pattaya', country: 'Thailand', country_code: 'TH', city_id: null, continent: 'Asia', tagline: 'Beach thrills and nightlife energy', image_url: CITY_IMAGES['pattaya'], hotel_count: 0, display_order: 38 },
  { city_slug: 'lima', city_name: 'Lima', country: 'Peru', country_code: 'PE', city_id: null, continent: 'South America', tagline: 'Gastronomic capital of the Americas', image_url: CITY_IMAGES['lima'], hotel_count: 0, display_order: 39 },
  { city_slug: 'kyoto', city_name: 'Kyoto', country: 'Japan', country_code: 'JP', city_id: null, continent: 'Asia', tagline: 'Zen gardens and geisha grace', image_url: CITY_IMAGES['kyoto'], hotel_count: 0, display_order: 40 },
  { city_slug: 'taipei', city_name: 'Taipei', country: 'Taiwan', country_code: 'TW', city_id: null, continent: 'Asia', tagline: 'Night markets, hot springs, and skyline views', image_url: CITY_IMAGES['taipei'], hotel_count: 0, display_order: 41 },
  { city_slug: 'geneva', city_name: 'Geneva', country: 'Switzerland', country_code: 'CH', city_id: null, continent: 'Europe', tagline: 'Diplomatic hub with Mont Blanc views', image_url: CITY_IMAGES['geneva'], hotel_count: 0, display_order: 42 },
  { city_slug: 'maldives', city_name: 'Maldives', country: 'Maldives', country_code: 'MV', city_id: null, continent: 'Asia', tagline: 'Gateway to overwater paradise', image_url: CITY_IMAGES['maldives'], hotel_count: 0, display_order: 43 },
  { city_slug: 'jaipur', city_name: 'Jaipur', country: 'India', country_code: 'IN', city_id: null, continent: 'Asia', tagline: 'The Pink City of royal splendor', image_url: CITY_IMAGES['jaipur'], hotel_count: 0, display_order: 44 },
  { city_slug: 'goa', city_name: 'Goa', country: 'India', country_code: 'IN', city_id: null, continent: 'Asia', tagline: 'Beach shacks, sunsets, and Portuguese flair', image_url: CITY_IMAGES['goa'], hotel_count: 0, display_order: 45 },
  { city_slug: 'colombo', city_name: 'Colombo', country: 'Sri Lanka', country_code: 'LK', city_id: null, continent: 'Asia', tagline: 'Colonial charm on the Indian Ocean', image_url: CITY_IMAGES['colombo'], hotel_count: 0, display_order: 46 },
  { city_slug: 'kathmandu', city_name: 'Kathmandu', country: 'Nepal', country_code: 'NP', city_id: null, continent: 'Asia', tagline: 'Himalayan gateway of temples and trails', image_url: CITY_IMAGES['kathmandu'], hotel_count: 0, display_order: 47 },
  { city_slug: 'hanoi', city_name: 'Hanoi', country: 'Vietnam', country_code: 'VN', city_id: null, continent: 'Asia', tagline: 'Old-quarter charm and pho perfection', image_url: CITY_IMAGES['hanoi'], hotel_count: 0, display_order: 48 },
  { city_slug: 'ho-chi-minh-city', city_name: 'Ho Chi Minh City', country: 'Vietnam', country_code: 'VN', city_id: null, continent: 'Asia', tagline: 'Motorbike energy and French-colonial grace', image_url: CITY_IMAGES['ho-chi-minh-city'], hotel_count: 0, display_order: 49 },
  { city_slug: 'osaka', city_name: 'Osaka', country: 'Japan', country_code: 'JP', city_id: null, continent: 'Asia', tagline: "Japan's kitchen with a comedic soul", image_url: CITY_IMAGES['osaka'], hotel_count: 0, display_order: 50 },
];
