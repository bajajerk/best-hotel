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
// Sample cities — fallback data when the API is unavailable
// ---------------------------------------------------------------------------

export const SAMPLE_CITIES: CuratedCity[] = [
  { city_slug: 'bangkok', city_name: 'Bangkok', country: 'Thailand', country_code: 'TH', city_id: null, continent: 'Asia', tagline: 'Street food capital meets temple serenity', image_url: 'https://source.unsplash.com/800x600/?Bangkok+city+skyline', hotel_count: 0, display_order: 1 },
  { city_slug: 'tokyo', city_name: 'Tokyo', country: 'Japan', country_code: 'JP', city_id: null, continent: 'Asia', tagline: 'Where ancient tradition meets neon future', image_url: 'https://source.unsplash.com/800x600/?Tokyo+city+skyline', hotel_count: 0, display_order: 2 },
  { city_slug: 'paris', city_name: 'Paris', country: 'France', country_code: 'FR', city_id: null, continent: 'Europe', tagline: 'The eternal city of love and lights', image_url: 'https://source.unsplash.com/800x600/?Paris+city+skyline', hotel_count: 0, display_order: 3 },
  { city_slug: 'london', city_name: 'London', country: 'United Kingdom', country_code: 'GB', city_id: null, continent: 'Europe', tagline: 'Royal heritage and cutting-edge cool', image_url: 'https://source.unsplash.com/800x600/?London+city+skyline', hotel_count: 0, display_order: 4 },
  { city_slug: 'dubai', city_name: 'Dubai', country: 'United Arab Emirates', country_code: 'AE', city_id: null, continent: 'Asia', tagline: 'Desert oasis of luxury and ambition', image_url: 'https://source.unsplash.com/800x600/?Dubai+city+skyline', hotel_count: 0, display_order: 5 },
  { city_slug: 'singapore', city_name: 'Singapore', country: 'Singapore', country_code: 'SG', city_id: null, continent: 'Asia', tagline: 'Garden city where East meets West', image_url: 'https://source.unsplash.com/800x600/?Singapore+city+skyline', hotel_count: 0, display_order: 6 },
  { city_slug: 'new-york', city_name: 'New York', country: 'United States', country_code: 'US', city_id: null, continent: 'North America', tagline: 'The city that never sleeps', image_url: 'https://source.unsplash.com/800x600/?New+York+city+skyline', hotel_count: 0, display_order: 7 },
  { city_slug: 'chiang-mai', city_name: 'Chiang Mai', country: 'Thailand', country_code: 'TH', city_id: null, continent: 'Asia', tagline: 'Temples, night markets, and mountain air', image_url: 'https://source.unsplash.com/800x600/?Chiang+Mai+city+skyline', hotel_count: 0, display_order: 8 },
  { city_slug: 'barcelona', city_name: 'Barcelona', country: 'Spain', country_code: 'ES', city_id: null, continent: 'Europe', tagline: 'Gaudi dreams and Mediterranean vibes', image_url: 'https://source.unsplash.com/800x600/?Barcelona+city+skyline', hotel_count: 0, display_order: 9 },
  { city_slug: 'rome', city_name: 'Rome', country: 'Italy', country_code: 'IT', city_id: null, continent: 'Europe', tagline: 'Eternal city of emperors and espresso', image_url: 'https://source.unsplash.com/800x600/?Rome+city+skyline', hotel_count: 0, display_order: 10 },
  { city_slug: 'prague', city_name: 'Prague', country: 'Czech Republic', country_code: 'CZ', city_id: null, continent: 'Europe', tagline: 'Fairy-tale spires and golden lanes', image_url: 'https://source.unsplash.com/800x600/?Prague+city+skyline', hotel_count: 0, display_order: 11 },
  { city_slug: 'amsterdam', city_name: 'Amsterdam', country: 'Netherlands', country_code: 'NL', city_id: null, continent: 'Europe', tagline: 'Canals, culture, and creative spirit', image_url: 'https://source.unsplash.com/800x600/?Amsterdam+city+skyline', hotel_count: 0, display_order: 12 },
  { city_slug: 'berlin', city_name: 'Berlin', country: 'Germany', country_code: 'DE', city_id: null, continent: 'Europe', tagline: 'Bold, free, and forever reinventing itself', image_url: 'https://source.unsplash.com/800x600/?Berlin+city+skyline', hotel_count: 0, display_order: 13 },
  { city_slug: 'seoul', city_name: 'Seoul', country: 'South Korea', country_code: 'KR', city_id: null, continent: 'Asia', tagline: 'K-culture capital with ancient soul', image_url: 'https://source.unsplash.com/800x600/?Seoul+city+skyline', hotel_count: 0, display_order: 14 },
  { city_slug: 'hong-kong', city_name: 'Hong Kong', country: 'Hong Kong', country_code: 'HK', city_id: null, continent: 'Asia', tagline: 'Skyline spectacle on Victoria Harbour', image_url: 'https://source.unsplash.com/800x600/?Hong+Kong+city+skyline', hotel_count: 0, display_order: 15 },
  { city_slug: 'kuala-lumpur', city_name: 'Kuala Lumpur', country: 'Malaysia', country_code: 'MY', city_id: null, continent: 'Asia', tagline: 'Twin towers and tantalizing street eats', image_url: 'https://source.unsplash.com/800x600/?Kuala+Lumpur+city+skyline', hotel_count: 0, display_order: 16 },
  { city_slug: 'mumbai', city_name: 'Mumbai', country: 'India', country_code: 'IN', city_id: null, continent: 'Asia', tagline: 'Bollywood beats and ocean breezes', image_url: 'https://source.unsplash.com/800x600/?Mumbai+city+skyline', hotel_count: 0, display_order: 17 },
  { city_slug: 'delhi', city_name: 'Delhi', country: 'India', country_code: 'IN', city_id: null, continent: 'Asia', tagline: 'Mughal grandeur meets modern India', image_url: 'https://source.unsplash.com/800x600/?Delhi+city+skyline', hotel_count: 0, display_order: 18 },
  { city_slug: 'bali', city_name: 'Bali', country: 'Indonesia', country_code: 'ID', city_id: null, continent: 'Asia', tagline: 'Island of gods, surf, and serenity', image_url: 'https://source.unsplash.com/800x600/?Bali+city+skyline', hotel_count: 0, display_order: 19 },
  { city_slug: 'phuket', city_name: 'Phuket', country: 'Thailand', country_code: 'TH', city_id: null, continent: 'Asia', tagline: 'Tropical paradise with turquoise waters', image_url: 'https://source.unsplash.com/800x600/?Phuket+city+skyline', hotel_count: 0, display_order: 20 },
  { city_slug: 'lisbon', city_name: 'Lisbon', country: 'Portugal', country_code: 'PT', city_id: null, continent: 'Europe', tagline: 'Sun-soaked tiles and pastel de nata', image_url: 'https://source.unsplash.com/800x600/?Lisbon+city+skyline', hotel_count: 0, display_order: 21 },
  { city_slug: 'vienna', city_name: 'Vienna', country: 'Austria', country_code: 'AT', city_id: null, continent: 'Europe', tagline: 'Waltzes, coffee houses, and imperial charm', image_url: 'https://source.unsplash.com/800x600/?Vienna+city+skyline', hotel_count: 0, display_order: 22 },
  { city_slug: 'sydney', city_name: 'Sydney', country: 'Australia', country_code: 'AU', city_id: null, continent: 'Oceania', tagline: 'Harbour city with golden beaches', image_url: 'https://source.unsplash.com/800x600/?Sydney+city+skyline', hotel_count: 0, display_order: 23 },
  { city_slug: 'melbourne', city_name: 'Melbourne', country: 'Australia', country_code: 'AU', city_id: null, continent: 'Oceania', tagline: 'Laneways, lattes, and live music', image_url: 'https://source.unsplash.com/800x600/?Melbourne+city+skyline', hotel_count: 0, display_order: 24 },
  { city_slug: 'milan', city_name: 'Milan', country: 'Italy', country_code: 'IT', city_id: null, continent: 'Europe', tagline: 'Fashion capital with Renaissance soul', image_url: 'https://source.unsplash.com/800x600/?Milan+city+skyline', hotel_count: 0, display_order: 25 },
  { city_slug: 'florence', city_name: 'Florence', country: 'Italy', country_code: 'IT', city_id: null, continent: 'Europe', tagline: 'Cradle of the Renaissance in every corner', image_url: 'https://source.unsplash.com/800x600/?Florence+city+skyline', hotel_count: 0, display_order: 26 },
  { city_slug: 'budapest', city_name: 'Budapest', country: 'Hungary', country_code: 'HU', city_id: null, continent: 'Europe', tagline: 'Thermal baths and Danube sunsets', image_url: 'https://source.unsplash.com/800x600/?Budapest+city+skyline', hotel_count: 0, display_order: 27 },
  { city_slug: 'dublin', city_name: 'Dublin', country: 'Ireland', country_code: 'IE', city_id: null, continent: 'Europe', tagline: 'Pubs, prose, and Celtic warmth', image_url: 'https://source.unsplash.com/800x600/?Dublin+city+skyline', hotel_count: 0, display_order: 28 },
  { city_slug: 'edinburgh', city_name: 'Edinburgh', country: 'United Kingdom', country_code: 'GB', city_id: null, continent: 'Europe', tagline: 'Castle-crowned city of festivals', image_url: 'https://source.unsplash.com/800x600/?Edinburgh+city+skyline', hotel_count: 0, display_order: 29 },
  { city_slug: 'athens', city_name: 'Athens', country: 'Greece', country_code: 'GR', city_id: null, continent: 'Europe', tagline: 'Birthplace of democracy beneath the Acropolis', image_url: 'https://source.unsplash.com/800x600/?Athens+city+skyline', hotel_count: 0, display_order: 30 },
  { city_slug: 'santorini', city_name: 'Santorini', country: 'Greece', country_code: 'GR', city_id: null, continent: 'Europe', tagline: 'Blue domes and Aegean sunsets', image_url: 'https://source.unsplash.com/800x600/?Santorini+city+skyline', hotel_count: 0, display_order: 31 },
  { city_slug: 'marrakech', city_name: 'Marrakech', country: 'Morocco', country_code: 'MA', city_id: null, continent: 'Africa', tagline: 'Spice-scented souks and riad retreats', image_url: 'https://source.unsplash.com/800x600/?Marrakech+city+skyline', hotel_count: 0, display_order: 32 },
  { city_slug: 'cape-town', city_name: 'Cape Town', country: 'South Africa', country_code: 'ZA', city_id: null, continent: 'Africa', tagline: 'Table Mountain meets two oceans', image_url: 'https://source.unsplash.com/800x600/?Cape+Town+city+skyline', hotel_count: 0, display_order: 33 },
  { city_slug: 'rio-de-janeiro', city_name: 'Rio de Janeiro', country: 'Brazil', country_code: 'BR', city_id: null, continent: 'South America', tagline: 'Samba rhythms and Sugarloaf sunrises', image_url: 'https://source.unsplash.com/800x600/?Rio+de+Janeiro+city+skyline', hotel_count: 0, display_order: 34 },
  { city_slug: 'buenos-aires', city_name: 'Buenos Aires', country: 'Argentina', country_code: 'AR', city_id: null, continent: 'South America', tagline: 'Tango, steak, and bohemian barrios', image_url: 'https://source.unsplash.com/800x600/?Buenos+Aires+city+skyline', hotel_count: 0, display_order: 35 },
  { city_slug: 'mexico-city', city_name: 'Mexico City', country: 'Mexico', country_code: 'MX', city_id: null, continent: 'North America', tagline: 'Aztec roots and world-class cuisine', image_url: 'https://source.unsplash.com/800x600/?Mexico+City+city+skyline', hotel_count: 0, display_order: 36 },
  { city_slug: 'cancun', city_name: 'Cancun', country: 'Mexico', country_code: 'MX', city_id: null, continent: 'North America', tagline: 'Caribbean blues and Mayan wonders', image_url: 'https://source.unsplash.com/800x600/?Cancun+city+skyline', hotel_count: 0, display_order: 37 },
  { city_slug: 'pattaya', city_name: 'Pattaya', country: 'Thailand', country_code: 'TH', city_id: null, continent: 'Asia', tagline: 'Beach thrills and nightlife energy', image_url: 'https://source.unsplash.com/800x600/?Pattaya+city+skyline', hotel_count: 0, display_order: 38 },
  { city_slug: 'lima', city_name: 'Lima', country: 'Peru', country_code: 'PE', city_id: null, continent: 'South America', tagline: 'Gastronomic capital of the Americas', image_url: 'https://source.unsplash.com/800x600/?Lima+city+skyline', hotel_count: 0, display_order: 39 },
  { city_slug: 'kyoto', city_name: 'Kyoto', country: 'Japan', country_code: 'JP', city_id: null, continent: 'Asia', tagline: 'Zen gardens and geisha grace', image_url: 'https://source.unsplash.com/800x600/?Kyoto+city+skyline', hotel_count: 0, display_order: 40 },
  { city_slug: 'taipei', city_name: 'Taipei', country: 'Taiwan', country_code: 'TW', city_id: null, continent: 'Asia', tagline: 'Night markets, hot springs, and skyline views', image_url: 'https://source.unsplash.com/800x600/?Taipei+city+skyline', hotel_count: 0, display_order: 41 },
  { city_slug: 'geneva', city_name: 'Geneva', country: 'Switzerland', country_code: 'CH', city_id: null, continent: 'Europe', tagline: 'Diplomatic hub with Mont Blanc views', image_url: 'https://source.unsplash.com/800x600/?Geneva+city+skyline', hotel_count: 0, display_order: 42 },
  { city_slug: 'maldives', city_name: 'Maldives', country: 'Maldives', country_code: 'MV', city_id: null, continent: 'Asia', tagline: 'Gateway to overwater paradise', image_url: 'https://source.unsplash.com/800x600/?Maldives+city+skyline', hotel_count: 0, display_order: 43 },
  { city_slug: 'jaipur', city_name: 'Jaipur', country: 'India', country_code: 'IN', city_id: null, continent: 'Asia', tagline: 'The Pink City of royal splendor', image_url: 'https://source.unsplash.com/800x600/?Jaipur+city+skyline', hotel_count: 0, display_order: 44 },
  { city_slug: 'goa', city_name: 'Goa', country: 'India', country_code: 'IN', city_id: null, continent: 'Asia', tagline: 'Beach shacks, sunsets, and Portuguese flair', image_url: 'https://source.unsplash.com/800x600/?Goa+city+skyline', hotel_count: 0, display_order: 45 },
  { city_slug: 'colombo', city_name: 'Colombo', country: 'Sri Lanka', country_code: 'LK', city_id: null, continent: 'Asia', tagline: 'Colonial charm on the Indian Ocean', image_url: 'https://source.unsplash.com/800x600/?Colombo+city+skyline', hotel_count: 0, display_order: 46 },
  { city_slug: 'kathmandu', city_name: 'Kathmandu', country: 'Nepal', country_code: 'NP', city_id: null, continent: 'Asia', tagline: 'Himalayan gateway of temples and trails', image_url: 'https://source.unsplash.com/800x600/?Kathmandu+city+skyline', hotel_count: 0, display_order: 47 },
  { city_slug: 'hanoi', city_name: 'Hanoi', country: 'Vietnam', country_code: 'VN', city_id: null, continent: 'Asia', tagline: 'Old-quarter charm and pho perfection', image_url: 'https://source.unsplash.com/800x600/?Hanoi+city+skyline', hotel_count: 0, display_order: 48 },
  { city_slug: 'ho-chi-minh-city', city_name: 'Ho Chi Minh City', country: 'Vietnam', country_code: 'VN', city_id: null, continent: 'Asia', tagline: 'Motorbike energy and French-colonial grace', image_url: 'https://source.unsplash.com/800x600/?Ho+Chi+Minh+City+city+skyline', hotel_count: 0, display_order: 49 },
  { city_slug: 'osaka', city_name: 'Osaka', country: 'Japan', country_code: 'JP', city_id: null, continent: 'Asia', tagline: "Japan's kitchen with a comedic soul", image_url: 'https://source.unsplash.com/800x600/?Osaka+city+skyline', hotel_count: 0, display_order: 50 },
];
