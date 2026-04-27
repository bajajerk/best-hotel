import posthog from 'posthog-js';

// ---------------------------------------------------------------------------
// Centralized analytics events — Netflix-grade tracking taxonomy
// ---------------------------------------------------------------------------

// Search & Discovery
export function trackSearch(params: {
  query: string;
  result_count: number;
  source: 'search_page' | 'home_hero' | 'destination_search';
  filters?: { star_rating?: number; sort_by?: string; region?: string };
}) {
  posthog.capture('search_executed', {
    search_query: params.query,
    result_count: params.result_count,
    search_source: params.source,
    ...params.filters,
  });
}

export function trackSearchFilterApplied(params: {
  filter_type: 'star_rating' | 'sort_by' | 'region' | 'view_mode';
  filter_value: string | number;
  result_count: number;
}) {
  posthog.capture('search_filter_applied', params);
}

// Hotel Engagement
export function trackHotelViewed(params: {
  hotel_id: string | number;
  hotel_name: string;
  city: string;
  country: string;
  star_rating: number | null;
  price_from: number | null;
  currency: string | null;
}) {
  posthog.capture('hotel_viewed', {
    hotel_id: params.hotel_id,
    hotel_name: params.hotel_name,
    city: params.city,
    country: params.country,
    star_rating: params.star_rating,
    price_from: params.price_from,
    currency: params.currency,
  });
}

export function trackHotelTabClicked(params: {
  hotel_id: string | number;
  hotel_name: string;
  tab_name: string;
}) {
  posthog.capture('hotel_tab_clicked', params);
}

export function trackHotelGalleryOpened(params: {
  hotel_id: string | number;
  hotel_name: string;
  photo_index: number;
}) {
  posthog.capture('hotel_gallery_opened', params);
}

// Compare
export function trackCompareHotelAdded(params: {
  hotel_id: string | number;
  hotel_name: string;
  city: string;
  compare_count: number;
}) {
  posthog.capture('compare_hotel_added', params);
}

export function trackCompareHotelRemoved(params: {
  hotel_id: string | number;
  hotel_name: string;
  compare_count: number;
}) {
  posthog.capture('compare_hotel_removed', params);
}

export function trackCompareViewed(params: {
  hotel_count: number;
  hotel_names: string[];
}) {
  posthog.capture('compare_page_viewed', params);
}

// Match My Rate (core conversion funnel)
export function trackMatchMyRateStarted(params: {
  method: 'screenshot' | 'manual';
}) {
  posthog.capture('match_my_rate_started', {
    input_method: params.method,
  });
}

export function trackScreenshotUploaded(params: {
  file_size_kb: number;
  file_type: string;
}) {
  posthog.capture('screenshot_uploaded', params);
}

export function trackExtractionCompleted(params: {
  success: boolean;
  hotel_name?: string;
  ota_name?: string;
  ota_price?: number;
  confidence?: number;
  error_message?: string;
}) {
  posthog.capture('extraction_completed', params);
}

export function trackManualFormSubmitted(params: {
  hotel_name: string;
  booking_site: string;
  price_per_night: number;
  has_dates: boolean;
}) {
  posthog.capture('manual_form_submitted', params);
}

export function trackOtpRequested(params: {
  phone_country_length: number;
}) {
  posthog.capture('otp_requested', {
    phone_digits: params.phone_country_length,
  });
}

export function trackOtpVerified(params: {
  success: boolean;
}) {
  posthog.capture('otp_verified', params);
}

export function trackRateComparisonViewed(params: {
  hotel_name: string;
  ota_name: string;
  ota_price: number;
  our_price: number;
  savings_percent: number;
  currency: string;
}) {
  posthog.capture('rate_comparison_viewed', {
    ...params,
    savings_amount: params.ota_price - params.our_price,
  });
}

// CTA & Navigation
export function trackCtaClicked(params: {
  cta_name: string;
  cta_location: string;
  destination_url?: string;
}) {
  posthog.capture('cta_clicked', params);
}

export function trackWhatsAppClicked(params: {
  page: string;
}) {
  posthog.capture('whatsapp_clicked', {
    page: params.page,
    channel: 'whatsapp',
  });
}

// City & Destination
export function trackCityViewed(params: {
  city_slug: string;
  city_name: string;
  country: string;
  continent: string;
}) {
  posthog.capture('city_viewed', params);
}

// Booking Intent
export function trackBookingDatesChanged(params: {
  check_in: string;
  check_out: string;
  nights: number;
  source: string;
}) {
  posthog.capture('booking_dates_changed', params);
}

export function trackGuestsChanged(params: {
  rooms: number;
  adults: number;
  children: number;
  source: string;
}) {
  posthog.capture('guests_changed', params);
}

// Lead Capture / Unlock Rate
export function trackUnlockRateClicked(params: {
  hotel_id: string | number;
  hotel_name: string;
  room_name: string;
  rate_type: 'preferred' | 'standard';
  nightly_rate: number;
  currency: string;
}) {
  posthog.capture('unlock_rate_clicked', params);
}

export function trackLeadCaptured(params: {
  hotel_id: string | number;
  hotel_name: string;
  room_name: string;
  lead_id: string;
  nightly_rate: number;
  market_rate: number;
  savings_percent: number;
  currency: string;
}) {
  posthog.capture('lead_captured', {
    ...params,
    savings_amount: params.market_rate - params.nightly_rate,
  });
}

export function trackLeadWhatsAppClicked(params: {
  lead_id: string;
  hotel_name: string;
}) {
  posthog.capture('lead_whatsapp_clicked', params);
}

// Preferred Rates
export function trackPreferredRatesViewed() {
  posthog.capture('preferred_rates_viewed');
}

export function trackWaitlistClicked(params: {
  source: string;
}) {
  posthog.capture('waitlist_cta_clicked', params);
}
