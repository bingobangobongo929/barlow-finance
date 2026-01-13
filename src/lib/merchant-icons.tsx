// Merchant logo/icon mapping for transaction display
// Uses a combination of brand colors and simple icons

import * as React from "react";

// Brand colors for major merchants
const brandColors: Record<string, string> = {
  spotify: "#1DB954",
  netflix: "#E50914",
  hbo: "#A020F0",
  disney: "#113CCF",
  amazon: "#FF9900",
  apple: "#000000",
  google: "#4285F4",
  youtube: "#FF0000",
  mcdonalds: "#FFC72C",
  starbucks: "#00704A",
  ikea: "#0051BA",
  netto: "#FFD700",
  bilka: "#E31E24",
  foetex: "#007AC3",
  rema: "#FCC200",
  coop: "#00A651",
  lidl: "#0050AA",
  aldi: "#00529B",
  shell: "#FFD500",
  circle: "#E31937",
  ok: "#E31937",
  q8: "#EB0029",
  dsr: "#005DAA",
  fitness: "#FF6B00",
  elgiganten: "#00A0DC",
  power: "#E40520",
  zalando: "#FF6900",
  paypal: "#003087",
  mobilepay: "#5A78FF",
};

// Pattern matching for merchant detection
const merchantPatterns: Array<{
  patterns: string[];
  name: string;
  icon: string;
  color: string;
}> = [
  // Streaming Services
  { patterns: ["spotify"], name: "Spotify", icon: "🎵", color: brandColors.spotify },
  { patterns: ["netflix"], name: "Netflix", icon: "🎬", color: brandColors.netflix },
  { patterns: ["hbo", "max.com"], name: "HBO Max", icon: "📺", color: brandColors.hbo },
  { patterns: ["disney+", "disneyplus"], name: "Disney+", icon: "🏰", color: brandColors.disney },
  { patterns: ["youtube", "yt premium"], name: "YouTube", icon: "▶️", color: brandColors.youtube },
  { patterns: ["amazon prime", "prime video"], name: "Prime Video", icon: "📦", color: brandColors.amazon },
  { patterns: ["apple music", "apple tv", "itunes"], name: "Apple", icon: "🍎", color: brandColors.apple },

  // Food & Restaurants
  { patterns: ["mcdonald", "mcdonalds", "mcd"], name: "McDonald's", icon: "🍔", color: brandColors.mcdonalds },
  { patterns: ["starbucks"], name: "Starbucks", icon: "☕", color: brandColors.starbucks },
  { patterns: ["burger king", "bk "], name: "Burger King", icon: "🍔", color: "#D62300" },
  { patterns: ["subway"], name: "Subway", icon: "🥪", color: "#008C15" },
  { patterns: ["domino"], name: "Domino's", icon: "🍕", color: "#006491" },
  { patterns: ["pizza hut"], name: "Pizza Hut", icon: "🍕", color: "#EE3A43" },
  { patterns: ["kfc"], name: "KFC", icon: "🍗", color: "#F40027" },
  { patterns: ["just eat", "justeat"], name: "Just Eat", icon: "🛵", color: "#FF8000" },
  { patterns: ["wolt"], name: "Wolt", icon: "🛵", color: "#00C2E8" },

  // Danish Supermarkets
  { patterns: ["netto"], name: "Netto", icon: "🛒", color: brandColors.netto },
  { patterns: ["bilka"], name: "Bilka", icon: "🛒", color: brandColors.bilka },
  { patterns: ["foetex", "føtex"], name: "Føtex", icon: "🛒", color: brandColors.foetex },
  { patterns: ["rema"], name: "Rema 1000", icon: "🛒", color: brandColors.rema },
  { patterns: ["coop", "kvickly", "brugsen", "superbrugsen", "dagli"], name: "Coop", icon: "🛒", color: brandColors.coop },
  { patterns: ["lidl"], name: "Lidl", icon: "🛒", color: brandColors.lidl },
  { patterns: ["aldi"], name: "Aldi", icon: "🛒", color: brandColors.aldi },
  { patterns: ["meny"], name: "MENY", icon: "🛒", color: "#E31E24" },
  { patterns: ["irma"], name: "Irma", icon: "🛒", color: "#C41E3A" },

  // Gas Stations
  { patterns: ["shell"], name: "Shell", icon: "⛽", color: brandColors.shell },
  { patterns: ["circle k", "circlek"], name: "Circle K", icon: "⛽", color: brandColors.circle },
  { patterns: ["ok benzin", "ok tank"], name: "OK", icon: "⛽", color: brandColors.ok },
  { patterns: ["q8"], name: "Q8", icon: "⛽", color: brandColors.q8 },
  { patterns: ["uno-x", "unox"], name: "UnoX", icon: "⛽", color: "#FF6B00" },
  { patterns: ["ingo"], name: "INGO", icon: "⛽", color: "#E31E24" },

  // Electronics & Shopping
  { patterns: ["elgiganten"], name: "Elgiganten", icon: "📱", color: brandColors.elgiganten },
  { patterns: ["power "], name: "Power", icon: "📱", color: brandColors.power },
  { patterns: ["amazon"], name: "Amazon", icon: "📦", color: brandColors.amazon },
  { patterns: ["ikea"], name: "IKEA", icon: "🪑", color: brandColors.ikea },
  { patterns: ["jysk"], name: "JYSK", icon: "🛋️", color: "#0066B3" },
  { patterns: ["h&m", "h & m", "hennes"], name: "H&M", icon: "👕", color: "#E31E24" },
  { patterns: ["zalando"], name: "Zalando", icon: "👟", color: brandColors.zalando },
  { patterns: ["bestseller", "jack jones", "vero moda"], name: "Bestseller", icon: "👔", color: "#000000" },

  // Fitness
  { patterns: ["fitness world", "fitnessworld"], name: "Fitness World", icon: "💪", color: brandColors.fitness },
  { patterns: ["sats"], name: "SATS", icon: "💪", color: "#FF6B00" },
  { patterns: ["loop fitness"], name: "Loop Fitness", icon: "💪", color: "#00B4D8" },

  // Payment & Banking
  { patterns: ["paypal"], name: "PayPal", icon: "💳", color: brandColors.paypal },
  { patterns: ["mobilepay", "mobile pay"], name: "MobilePay", icon: "📱", color: brandColors.mobilepay },
  { patterns: ["danske bank"], name: "Danske Bank", icon: "🏦", color: "#003755" },
  { patterns: ["nordea"], name: "Nordea", icon: "🏦", color: "#0000A0" },
  { patterns: ["jyske bank"], name: "Jyske Bank", icon: "🏦", color: "#004B87" },

  // Utilities
  { patterns: ["ørsted", "orsted"], name: "Ørsted", icon: "⚡", color: "#00A98F" },
  { patterns: ["radius", "elnet"], name: "Radius", icon: "⚡", color: "#00A3E0" },
  { patterns: ["norlys", "ewii", "eniig"], name: "Norlys", icon: "⚡", color: "#E4007C" },
  { patterns: ["hofor"], name: "HOFOR", icon: "💧", color: "#0077B6" },

  // Transport
  { patterns: ["dsb"], name: "DSB", icon: "🚂", color: brandColors.dsr },
  { patterns: ["rejsekort"], name: "Rejsekort", icon: "🚌", color: "#00A651" },
  { patterns: ["movia"], name: "Movia", icon: "🚌", color: "#003D7D" },

  // Insurance & Services
  { patterns: ["tryg"], name: "Tryg", icon: "🛡️", color: "#E30613" },
  { patterns: ["topdanmark", "top danmark"], name: "Topdanmark", icon: "🛡️", color: "#003366" },
  { patterns: ["alm brand", "alm. brand"], name: "Alm. Brand", icon: "🛡️", color: "#E30613" },
  { patterns: ["gjensidige"], name: "Gjensidige", icon: "🛡️", color: "#FF6A13" },

  // Telecoms
  { patterns: ["tdc", "yousee"], name: "TDC/YouSee", icon: "📡", color: "#0077C8" },
  { patterns: ["telenor"], name: "Telenor", icon: "📡", color: "#0095DB" },
  { patterns: ["3 mobil", "hi3g", "oister"], name: "3", icon: "📡", color: "#E4002B" },
  { patterns: ["telia"], name: "Telia", icon: "📡", color: "#990AE3" },
];

export interface MerchantInfo {
  name: string;
  icon: string;
  color: string;
  matched: boolean;
}

export function getMerchantInfo(description: string): MerchantInfo {
  const lowerDesc = description.toLowerCase();

  for (const merchant of merchantPatterns) {
    for (const pattern of merchant.patterns) {
      if (lowerDesc.includes(pattern.toLowerCase())) {
        return {
          name: merchant.name,
          icon: merchant.icon,
          color: merchant.color,
          matched: true,
        };
      }
    }
  }

  return {
    name: description,
    icon: "",
    color: "#6b7280",
    matched: false,
  };
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
  const merchant = getMerchantInfo(description);

  const sizeClasses = {
    sm: "h-6 w-6 text-sm",
    md: "h-8 w-8 text-base",
    lg: "h-10 w-10 text-lg",
  };

  if (!merchant.matched) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex items-center justify-center rounded-lg ${sizeClasses[size]}`}
        style={{ backgroundColor: `${merchant.color}20` }}
      >
        <span className="text-center">{merchant.icon}</span>
      </div>
      {showName && (
        <span className="text-sm font-medium" style={{ color: merchant.color }}>
          {merchant.name}
        </span>
      )}
    </div>
  );
}
