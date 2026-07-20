export interface PricingConfig {
  currency: string;       // ISO 4217 e.g. 'GBP', 'USD', 'EUR'
  smsPerSegment: number;  // cost per 160-char SMS segment
  whatsappPerMessage: number;
  rcsPerMessage: number;
  emailPerMessage: number;
}

export const DEFAULT_PRICING: PricingConfig = {
  currency: 'GBP',
  smsPerSegment: 0.0448,      // Twilio UK rate + 12 %
  whatsappPerMessage: 0.056,  // Twilio UK rate + 12 %
  rcsPerMessage: 0.056,       // Twilio UK rate + 12 %
  emailPerMessage: 0.00112,   // Twilio UK rate + 12 %
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
  AUD: 'A$',
  CAD: 'C$',
};

export function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? currency + ' ';
}

export function mergePricing(stored: unknown): PricingConfig {
  if (!stored || typeof stored !== 'object') return DEFAULT_PRICING;
  return { ...DEFAULT_PRICING, ...(stored as Partial<PricingConfig>) };
}

export function smsSegments(body: string): number {
  return Math.max(1, Math.ceil(body.length / 160));
}

export function messageCost(channel: string, body: string, pricing: PricingConfig): number {
  switch (channel) {
    case 'sms':       return smsSegments(body) * pricing.smsPerSegment;
    case 'whatsapp':  return pricing.whatsappPerMessage;
    case 'rcs':       return pricing.rcsPerMessage;
    case 'email':     return pricing.emailPerMessage;
    default:          return 0;
  }
}
