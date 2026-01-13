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
      icon: <LogoComponent size={16} />,
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
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  const LogoComponent = merchantLogos[match.logoKey] || merchantLogos.default;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex items-center justify-center rounded-lg ${sizeClasses[size]}`}
        style={{ backgroundColor: `${match.color}20` }}
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

// Compact version for transaction lists
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
      className={`flex h-7 w-7 items-center justify-center rounded-md ${className}`}
      style={{ backgroundColor: `${match.color}15` }}
      title={match.name}
    >
      <LogoComponent size={16} style={{ color: match.color }} />
    </div>
  );
}
