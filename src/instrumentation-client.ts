import posthog from 'posthog-js';
import { POSTHOG_KEY, POSTHOG_HOST } from '@/lib/constants';

posthog.init(POSTHOG_KEY, {
  api_host: POSTHOG_HOST,
  defaults: '2026-01-30',
  capture_pageview: true,
  capture_pageleave: true,
  autocapture: true,
});
