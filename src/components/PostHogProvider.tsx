'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { ReactNode } from 'react';

export default function PostHogProvider({ children }: { children: ReactNode }) {
  return <PHProvider client={posthog}>{children}</PHProvider>;
}
