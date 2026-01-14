// Merchant icon component - LOCAL ONLY (no external API calls for privacy)
"use client";

import * as React from "react";
import { getMerchantMatch, merchantLogos, type MerchantMatch } from "./brand-logos";

export interface MerchantInfo {
  name: string;
  icon: React.ReactNode;
  color: string;
  matched: boolean;
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

// Get initials from description (up to 2 characters)
function getInitials(description: string): string {
  const words = description
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0);

  if (words.length === 0) return "?";
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
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

// Transaction icon for use in transaction lists
// SECURITY: No external API calls - all icons are local or letter-based
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

  // For unmatched merchants, use stylish letter avatar
  const initials = getInitials(description);
  const color = fallbackColor || stringToColor(description);

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-xl text-white font-bold ${className}`}
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        fontSize: size * 0.35
      }}
      title={description}
    >
      {initials}
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
