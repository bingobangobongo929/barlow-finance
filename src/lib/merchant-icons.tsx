// Merchant icon component using actual SVG brand logos
import * as React from "react";
import { getMerchantMatch, merchantLogos, type MerchantMatch } from "./brand-logos";

export interface MerchantInfo {
  name: string;
  icon: React.ReactNode;
  color: string;
  matched: boolean;
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
    color: "#6b7280",
    matched: false,
  };
}

// Transaction icon for use in transaction lists - handles both matched merchants and fallbacks
interface TransactionIconProps {
  description: string;
  fallbackColor?: string;
  className?: string;
}

export function TransactionIcon({ description, fallbackColor, className = "" }: TransactionIconProps) {
  const match = getMerchantMatch(description);

  if (match) {
    const LogoComponent = merchantLogos[match.logoKey] || merchantLogos.default;
    return (
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${className}`}
        style={{ backgroundColor: `${match.color}30` }}
        title={match.name}
      >
        <LogoComponent size={24} style={{ color: match.color }} />
      </div>
    );
  }

  // Letter avatar fallback
  const letter = description.charAt(0).toUpperCase();
  const color = fallbackColor || "#6B7280";
  return (
    <div
      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${className}`}
      style={{ backgroundColor: `${color}25`, color }}
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

  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };

  const iconSizes = {
    sm: 18,
    md: 22,
    lg: 28,
  };

  const LogoComponent = merchantLogos[match.logoKey] || merchantLogos.default;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex items-center justify-center rounded-xl ${sizeClasses[size]}`}
        style={{ backgroundColor: `${match.color}30` }}
      >
        <LogoComponent size={iconSizes[size]} className="flex-shrink-0" style={{ color: match.color }} />
      </div>
      {showName && (
        <span className="text-sm font-medium" style={{ color: match.color }}>
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
      style={{ backgroundColor: `${match.color}25` }}
      title={match.name}
    >
      <LogoComponent size={20} style={{ color: match.color }} />
    </div>
  );
}
