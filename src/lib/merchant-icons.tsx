// Merchant icon component with Clearbit Logo API integration
"use client";

import * as React from "react";
import Image from "next/image";
import { getMerchantMatch, merchantLogos, type MerchantMatch } from "./brand-logos";

export interface MerchantInfo {
  name: string;
  icon: React.ReactNode;
  color: string;
  matched: boolean;
}

// Extract potential domain from merchant description
function extractDomain(description: string): string | null {
  const cleaned = description.toLowerCase().trim();

  // Common domain patterns to try
  const domainMappings: Record<string, string> = {
    // Streaming
    "spotify": "spotify.com",
    "netflix": "netflix.com",
    "hbo": "hbomax.com",
    "disney": "disneyplus.com",
    "youtube": "youtube.com",
    "amazon": "amazon.com",
    "apple": "apple.com",
    "google": "google.com",
    "microsoft": "microsoft.com",
    "adobe": "adobe.com",

    // Danish supermarkets
    "netto": "netto.dk",
    "bilka": "bilka.dk",
    "foetex": "foetex.dk",
    "føtex": "foetex.dk",
    "rema": "rema1000.dk",
    "coop": "coop.dk",
    "lidl": "lidl.dk",
    "aldi": "aldi.dk",
    "meny": "meny.dk",
    "irma": "irma.dk",
    "fakta": "fakta.dk",

    // Gas stations
    "shell": "shell.com",
    "circle k": "circlek.com",
    "q8": "q8.dk",

    // Banks
    "danske bank": "danskebank.dk",
    "nordea": "nordea.dk",
    "jyske bank": "jyskebank.dk",
    "nykredit": "nykredit.dk",
    "paypal": "paypal.com",
    "mobilepay": "mobilepay.dk",

    // Telecom
    "tdc": "tdc.dk",
    "yousee": "yousee.dk",
    "telenor": "telenor.dk",
    "telia": "telia.dk",

    // Transport
    "dsb": "dsb.dk",
    "movia": "moviatrafik.dk",

    // Shopping
    "ikea": "ikea.com",
    "h&m": "hm.com",
    "zalando": "zalando.dk",
    "boozt": "boozt.com",
    "elgiganten": "elgiganten.dk",
    "power": "power.dk",
    "jysk": "jysk.dk",

    // Food delivery
    "just eat": "just-eat.dk",
    "wolt": "wolt.com",
    "uber eats": "ubereats.com",

    // Fast food
    "mcdonald": "mcdonalds.com",
    "starbucks": "starbucks.com",
    "burger king": "burgerking.com",
    "subway": "subway.com",

    // Insurance
    "tryg": "tryg.dk",
    "topdanmark": "topdanmark.dk",
    "alm brand": "almbrand.dk",

    // Utilities
    "ørsted": "orsted.dk",
    "norlys": "norlys.dk",

    // Fitness
    "fitness world": "fitnessworld.com",
    "sats": "sats.dk",
  };

  // Check known mappings first
  for (const [keyword, domain] of Object.entries(domainMappings)) {
    if (cleaned.includes(keyword)) {
      return domain;
    }
  }

  // Try to extract domain-like patterns from description
  // Look for patterns like "company.com" or "something.dk"
  const domainMatch = cleaned.match(/([a-z0-9-]+\.(com|dk|net|org|io|co))/);
  if (domainMatch) {
    return domainMatch[1];
  }

  // Try to create a domain from the first meaningful word
  const words = cleaned
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['the', 'and', 'for', 'via', 'dkk', 'usd', 'eur'].includes(w));

  if (words.length > 0) {
    // Try the first word as a .com domain
    return `${words[0]}.com`;
  }

  return null;
}

// Generate a consistent color from a string
function stringToColor(str: string): string {
  const colors = [
    "#6366F1", // Indigo
    "#8B5CF6", // Violet
    "#EC4899", // Pink
    "#EF4444", // Red
    "#F97316", // Orange
    "#EAB308", // Yellow
    "#22C55E", // Green
    "#14B8A6", // Teal
    "#06B6D4", // Cyan
    "#3B82F6", // Blue
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export function getMerchantInfo(description: string): MerchantInfo {
  const match = getMerchantMatch(description);

  if (match) {
    const LogoComponent = merchantLogos[match.logoKey] || merchantLogos.default;
    return {
      name: match.name,
      icon: <LogoComponent size={22} />,
      color: match.color,
      matched: true,
    };
  }

  return {
    name: description,
    icon: null,
    color: stringToColor(description),
    matched: false,
  };
}

// Clearbit logo component with loading state and fallback
interface ClearbitLogoProps {
  domain: string;
  fallbackLetter: string;
  fallbackColor: string;
  size?: number;
}

function ClearbitLogo({ domain, fallbackLetter, fallbackColor, size = 40 }: ClearbitLogoProps) {
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const logoUrl = `https://logo.clearbit.com/${domain}`;

  if (hasError) {
    // Fallback to letter avatar
    return (
      <div
        className="flex items-center justify-center rounded-xl text-white font-bold"
        style={{
          backgroundColor: fallbackColor,
          width: size,
          height: size,
          fontSize: size * 0.4
        }}
      >
        {fallbackLetter}
      </div>
    );
  }

  return (
    <div
      className="relative flex items-center justify-center rounded-xl overflow-hidden bg-white"
      style={{ width: size, height: size }}
    >
      {isLoading && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ backgroundColor: `${fallbackColor}30` }}
        />
      )}
      <Image
        src={logoUrl}
        alt={domain}
        width={size - 8}
        height={size - 8}
        className="object-contain"
        onError={() => setHasError(true)}
        onLoad={() => setIsLoading(false)}
        unoptimized // Clearbit doesn't support Next.js image optimization
      />
    </div>
  );
}

// Transaction icon for use in transaction lists - handles matched merchants, Clearbit, and fallbacks
interface TransactionIconProps {
  description: string;
  fallbackColor?: string;
  className?: string;
  size?: number;
}

export function TransactionIcon({
  description,
  fallbackColor,
  className = "",
  size = 40
}: TransactionIconProps) {
  const match = getMerchantMatch(description);

  // For matched merchants, use solid color background with white icon
  if (match) {
    const LogoComponent = merchantLogos[match.logoKey] || merchantLogos.default;
    return (
      <div
        className={`flex flex-shrink-0 items-center justify-center rounded-xl ${className}`}
        style={{
          backgroundColor: match.color,
          width: size,
          height: size
        }}
        title={match.name}
      >
        <LogoComponent size={size * 0.55} style={{ color: "white" }} />
      </div>
    );
  }

  // For unmatched merchants, try Clearbit
  const domain = extractDomain(description);
  const letter = description.charAt(0).toUpperCase();
  const color = fallbackColor || stringToColor(description);

  if (domain) {
    return (
      <div className={`flex-shrink-0 ${className}`} title={description}>
        <ClearbitLogo
          domain={domain}
          fallbackLetter={letter}
          fallbackColor={color}
          size={size}
        />
      </div>
    );
  }

  // Pure letter avatar fallback
  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-xl text-white font-bold ${className}`}
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        fontSize: size * 0.4
      }}
      title={description}
    >
      {letter}
    </div>
  );
}

interface MerchantIconProps {
  description: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

export function MerchantIcon({
  description,
  size = "md",
  showName = false,
  className = "",
}: MerchantIconProps) {
  const match = getMerchantMatch(description);

  if (!match) {
    return null;
  }

  const sizeMap = {
    sm: 28,
    md: 36,
    lg: 44,
  };

  const LogoComponent = merchantLogos[match.logoKey] || merchantLogos.default;
  const pixelSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex items-center justify-center rounded-xl"
        style={{
          backgroundColor: match.color,
          width: pixelSize,
          height: pixelSize
        }}
      >
        <LogoComponent
          size={pixelSize * 0.55}
          className="flex-shrink-0"
          style={{ color: "white" }}
        />
      </div>
      {showName && (
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {match.name}
        </span>
      )}
    </div>
  );
}

// Compact version for smaller contexts
interface CompactMerchantIconProps {
  description: string;
  className?: string;
}

export function CompactMerchantIcon({ description, className = "" }: CompactMerchantIconProps) {
  const match = getMerchantMatch(description);

  if (!match) {
    return null;
  }

  const LogoComponent = merchantLogos[match.logoKey] || merchantLogos.default;

  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-lg ${className}`}
      style={{ backgroundColor: match.color }}
      title={match.name}
    >
      <LogoComponent size={18} style={{ color: "white" }} />
    </div>
  );
}
