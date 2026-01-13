// Actual SVG brand logos for transaction display
// These are simplified representations inspired by brand identities

import * as React from "react";

interface LogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Spotify - Three curved sound waves
export const SpotifyLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" style={style}>
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.305-1.76-8.786-.963-.335.077-.67-.133-.746-.469-.077-.336.132-.67.468-.747 3.808-.87 7.076-.496 9.713 1.115.293.18.385.563.208.857zm1.225-2.723c-.226.367-.706.482-1.072.257-2.687-1.652-6.785-2.131-9.965-1.166-.413.125-.848-.106-.973-.518-.125-.413.108-.848.519-.973 3.632-1.102 8.147-.568 11.234 1.328.366.226.48.707.257 1.072zm.105-2.835c-3.223-1.914-8.54-2.09-11.618-1.156-.494.15-1.016-.13-1.166-.624-.149-.495.13-1.016.625-1.166 3.532-1.073 9.404-.866 13.115 1.337.445.264.59.838.327 1.282-.264.443-.838.59-1.283.327z"/>
  </svg>
);

// Netflix - Stylized N
export const NetflixLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" style={style}>
    <path d="M5.398 0v24l6.344-7.983V24L18.602 0v23.992l-6.86-8.635V0L5.398 0zm0 0l6.344 15.992V0h.516v15.992L18.602 0v.008L12.258 16H11.742L5.398.008V0z"/>
  </svg>
);

// HBO - Classic HBO text style
export const HBOLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" style={style}>
    <path d="M4 8v8h2v-3h2v3h2V8H8v3H6V8H4zm8 0v8h3c1.1 0 2-.9 2-2v-1c0-.6-.3-1.1-.7-1.4.4-.3.7-.8.7-1.4v-.2c0-1.1-.9-2-2-2h-3zm2 1.5h1c.3 0 .5.2.5.5v.2c0 .3-.2.5-.5.5h-1v-1.2zm0 2.7h1c.3 0 .5.2.5.5v1c0 .3-.2.5-.5.5h-1v-2zm4-4.2v8h3c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2h-3zm2 1.5h1c.3 0 .5.2.5.5v4c0 .3-.2.5-.5.5h-1v-5z"/>
  </svg>
);

// Disney+ - Castle silhouette
export const DisneyLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" style={style}>
    <path d="M12 2L10 6H8l-2 3v2H4l-2 4v5h20v-5l-2-4h-2v-2l-2-3h-2l-2-4zm-4 8h8v2h-8v-2zm-4 4h16v4H4v-4z"/>
  </svg>
);

// YouTube - Play button
export const YouTubeLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" style={style}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

// Amazon - Arrow from a to z
export const AmazonLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" style={style}>
    <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.493.13.116.19.06.371-.172.53-.386.267-.896.545-1.532.835-1.49.679-3.097 1.192-4.82 1.538-1.722.346-3.39.519-5.004.519-3.24 0-6.273-.762-9.1-2.292-.182-.1-.265-.228-.138-.539zm6.629-4.848c-.088-.145-.048-.272.122-.383.476-.27.972-.407 1.49-.407.212 0 .39.022.534.068.14.045.254.117.342.215.088.097.155.187.2.273.046.085.113.233.2.443l.333.814c.107.278.233.507.38.69.145.18.357.346.635.496.278.15.612.226 1.003.226.49 0 .927-.16 1.312-.482.386-.32.579-.724.579-1.212 0-.318-.077-.588-.232-.812-.155-.223-.38-.41-.675-.56a7.5 7.5 0 0 0-.892-.385l-.946-.333a12.82 12.82 0 0 1-.946-.395 4.2 4.2 0 0 1-.891-.52 2.48 2.48 0 0 1-.676-.742c-.155-.293-.232-.656-.232-1.087 0-.577.135-1.087.404-1.53.27-.443.644-.788 1.122-1.037.478-.248 1.027-.373 1.646-.373.544 0 1.037.085 1.48.254.443.17.785.393 1.026.672.24.278.36.575.36.891 0 .228-.055.43-.166.607-.11.177-.267.328-.471.455-.203.127-.434.19-.69.19-.178 0-.345-.025-.5-.076-.155-.05-.31-.135-.462-.254a13.2 13.2 0 0 1-.464-.4l-.509-.471c-.1-.093-.194-.163-.282-.212-.088-.048-.2-.073-.337-.073-.214 0-.397.078-.55.235-.153.156-.23.356-.23.6 0 .184.052.345.156.485.104.14.25.262.439.368.189.106.39.2.605.28l.648.243c.53.192 1.02.423 1.47.69.45.27.813.6 1.087.993.275.393.412.865.412 1.417 0 .647-.153 1.218-.459 1.715-.306.497-.74.884-1.303 1.16-.563.276-1.224.414-1.983.414-.747 0-1.39-.112-1.929-.336-.538-.224-.96-.523-1.264-.896-.305-.373-.458-.782-.458-1.228 0-.178.03-.34.09-.483z"/>
  </svg>
);

// Apple - Classic apple silhouette
export const AppleLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" style={style}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

// McDonald's - Golden arches
export const McDonaldsLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" style={style}>
    <path d="M17.5 2c-1.9 0-3.6 1.2-4.3 3h-2.4C10.1 3.2 8.4 2 6.5 2 4 2 2 4.5 2 7.5V22h5V9.5c0-1.4.7-2.5 1.5-2.5s1.5 1.1 1.5 2.5V22h4V9.5c0-1.4.7-2.5 1.5-2.5s1.5 1.1 1.5 2.5V22h5V7.5C22 4.5 20 2 17.5 2z"/>
  </svg>
);

// Starbucks - Simplified mermaid/siren
export const StarbucksLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" style={style}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v4h-2V7zm0 6h2v4h-2v-4z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

// Generic streaming icon
export const StreamingLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" style={style}>
    <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v12h16V6H4zm5 2l6 4-6 4V8z"/>
  </svg>
);

// Shopping cart for supermarkets
export const SupermarketLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" style={style}>
    <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.16 14.26l.94-1.7h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 20 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.16-2.74z"/>
  </svg>
);

// Gas pump
export const GasStationLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" style={style}>
    <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
  </svg>
);

// Fitness/dumbbell
export const FitnessLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" style={style}>
    <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
  </svg>
);

// Bank/payment
export const BankLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" style={style}>
    <path d="M4 10h3v7H4v-7zm6.5 0h3v7h-3v-7zM2 19h20v3H2v-3zm15-9h3v7h-3v-7zm-5-9L2 6v2h20V6l-10-5z"/>
  </svg>
);

// Electricity/utilities
export const UtilityLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" style={style}>
    <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z"/>
  </svg>
);

// Transport/train
export const TransportLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" style={style}>
    <path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm2 0V6h5v4h-5zm3.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
  </svg>
);

// Insurance/shield
export const InsuranceLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" style={style}>
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
  </svg>
);

// Phone/telecom
export const TelecomLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" style={style}>
    <path d="M15.5 1h-8A2.5 2.5 0 0 0 5 3.5v17A2.5 2.5 0 0 0 7.5 23h8a2.5 2.5 0 0 0 2.5-2.5v-17A2.5 2.5 0 0 0 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z"/>
  </svg>
);

// Electronics
export const ElectronicsLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" style={style}>
    <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
  </svg>
);

// Clothing/shopping
export const ClothingLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" style={style}>
    <path d="M21.6 4l-3.6-3c-.3-.2-.7-.2-1 0L14 3c-.5.4-1.2.5-1.8.4l-.2-.1c-.6-.1-1.3-.1-1.9.1L6 4c-.3.2-.5.5-.5.9L5 7l-2.8 1.4c-.7.4-1 1.2-.6 1.9l2.4 4.5c.4.7 1.2 1 1.9.6L8 14v7c0 .6.4 1 1 1h6c.6 0 1-.4 1-1v-7l2.1 1.4c.7.4 1.5.1 1.9-.6l2.4-4.5c.4-.7.1-1.5-.6-1.9L19 7l-.5-2.1c0-.4-.3-.7-.9-.9z"/>
  </svg>
);

// Generic/default merchant icon
export const DefaultMerchantLogo: React.FC<LogoProps> = ({ size = 24, className, style }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" style={style}>
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
  </svg>
);

// Map merchant type to logo component
export const merchantLogos: Record<string, React.FC<LogoProps>> = {
  spotify: SpotifyLogo,
  netflix: NetflixLogo,
  hbo: HBOLogo,
  disney: DisneyLogo,
  youtube: YouTubeLogo,
  amazon: AmazonLogo,
  apple: AppleLogo,
  mcdonalds: McDonaldsLogo,
  starbucks: StarbucksLogo,
  streaming: StreamingLogo,
  supermarket: SupermarketLogo,
  gasstation: GasStationLogo,
  fitness: FitnessLogo,
  bank: BankLogo,
  utility: UtilityLogo,
  transport: TransportLogo,
  insurance: InsuranceLogo,
  telecom: TelecomLogo,
  electronics: ElectronicsLogo,
  clothing: ClothingLogo,
  default: DefaultMerchantLogo,
};

// Brand colors for each merchant
export const brandColors: Record<string, string> = {
  spotify: "#1DB954",
  netflix: "#E50914",
  hbo: "#A020F0",
  disney: "#113CCF",
  youtube: "#FF0000",
  amazon: "#FF9900",
  apple: "#000000",
  mcdonalds: "#FFC72C",
  starbucks: "#00704A",
  netto: "#FFD700",
  bilka: "#E31E24",
  foetex: "#007AC3",
  rema: "#FCC200",
  coop: "#00A651",
  lidl: "#0050AA",
  aldi: "#00529B",
  shell: "#FFD500",
  circle: "#E31937",
  q8: "#EB0029",
  fitness: "#FF6B00",
  elgiganten: "#00A0DC",
  power: "#E40520",
  zalando: "#FF6900",
  paypal: "#003087",
  mobilepay: "#5A78FF",
  dsb: "#005DAA",
  default: "#6B7280",
};

// Pattern matching for merchant detection with logo mapping
export interface MerchantMatch {
  name: string;
  logoKey: string;
  color: string;
}

const merchantPatterns: Array<{
  patterns: string[];
  name: string;
  logoKey: string;
  color: string;
}> = [
  // Streaming Services
  { patterns: ["spotify"], name: "Spotify", logoKey: "spotify", color: brandColors.spotify },
  { patterns: ["netflix"], name: "Netflix", logoKey: "netflix", color: brandColors.netflix },
  { patterns: ["hbo", "max.com"], name: "HBO Max", logoKey: "hbo", color: brandColors.hbo },
  { patterns: ["disney+", "disneyplus"], name: "Disney+", logoKey: "disney", color: brandColors.disney },
  { patterns: ["youtube", "yt premium"], name: "YouTube", logoKey: "youtube", color: brandColors.youtube },
  { patterns: ["amazon prime", "prime video"], name: "Prime Video", logoKey: "amazon", color: brandColors.amazon },
  { patterns: ["apple music", "apple tv", "itunes"], name: "Apple", logoKey: "apple", color: brandColors.apple },

  // Food & Restaurants
  { patterns: ["mcdonald", "mcdonalds", "mcd"], name: "McDonald's", logoKey: "mcdonalds", color: brandColors.mcdonalds },
  { patterns: ["starbucks"], name: "Starbucks", logoKey: "starbucks", color: brandColors.starbucks },
  { patterns: ["burger king", "bk "], name: "Burger King", logoKey: "default", color: "#D62300" },
  { patterns: ["subway"], name: "Subway", logoKey: "default", color: "#008C15" },
  { patterns: ["domino"], name: "Domino's", logoKey: "default", color: "#006491" },
  { patterns: ["just eat", "justeat"], name: "Just Eat", logoKey: "default", color: "#FF8000" },
  { patterns: ["wolt"], name: "Wolt", logoKey: "default", color: "#00C2E8" },

  // Danish Supermarkets
  { patterns: ["netto"], name: "Netto", logoKey: "supermarket", color: brandColors.netto },
  { patterns: ["bilka"], name: "Bilka", logoKey: "supermarket", color: brandColors.bilka },
  { patterns: ["foetex", "føtex"], name: "Føtex", logoKey: "supermarket", color: brandColors.foetex },
  { patterns: ["rema"], name: "Rema 1000", logoKey: "supermarket", color: brandColors.rema },
  { patterns: ["coop", "kvickly", "brugsen", "superbrugsen", "dagli"], name: "Coop", logoKey: "supermarket", color: brandColors.coop },
  { patterns: ["lidl"], name: "Lidl", logoKey: "supermarket", color: brandColors.lidl },
  { patterns: ["aldi"], name: "Aldi", logoKey: "supermarket", color: brandColors.aldi },
  { patterns: ["meny"], name: "MENY", logoKey: "supermarket", color: "#E31E24" },
  { patterns: ["irma"], name: "Irma", logoKey: "supermarket", color: "#C41E3A" },

  // Gas Stations
  { patterns: ["shell"], name: "Shell", logoKey: "gasstation", color: brandColors.shell },
  { patterns: ["circle k", "circlek"], name: "Circle K", logoKey: "gasstation", color: brandColors.circle },
  { patterns: ["ok benzin", "ok tank"], name: "OK", logoKey: "gasstation", color: "#E31937" },
  { patterns: ["q8"], name: "Q8", logoKey: "gasstation", color: brandColors.q8 },
  { patterns: ["uno-x", "unox"], name: "UnoX", logoKey: "gasstation", color: "#FF6B00" },
  { patterns: ["ingo"], name: "INGO", logoKey: "gasstation", color: "#E31E24" },

  // Electronics & Shopping
  { patterns: ["elgiganten"], name: "Elgiganten", logoKey: "electronics", color: brandColors.elgiganten },
  { patterns: ["power "], name: "Power", logoKey: "electronics", color: brandColors.power },
  { patterns: ["amazon"], name: "Amazon", logoKey: "amazon", color: brandColors.amazon },
  { patterns: ["ikea"], name: "IKEA", logoKey: "default", color: "#0051BA" },
  { patterns: ["jysk"], name: "JYSK", logoKey: "default", color: "#0066B3" },
  { patterns: ["h&m", "h & m", "hennes"], name: "H&M", logoKey: "clothing", color: "#E31E24" },
  { patterns: ["zalando"], name: "Zalando", logoKey: "clothing", color: brandColors.zalando },

  // Fitness
  { patterns: ["fitness world", "fitnessworld"], name: "Fitness World", logoKey: "fitness", color: brandColors.fitness },
  { patterns: ["sats"], name: "SATS", logoKey: "fitness", color: "#FF6B00" },
  { patterns: ["loop fitness"], name: "Loop Fitness", logoKey: "fitness", color: "#00B4D8" },

  // Payment & Banking
  { patterns: ["paypal"], name: "PayPal", logoKey: "bank", color: brandColors.paypal },
  { patterns: ["mobilepay", "mobile pay"], name: "MobilePay", logoKey: "bank", color: brandColors.mobilepay },
  { patterns: ["danske bank"], name: "Danske Bank", logoKey: "bank", color: "#003755" },
  { patterns: ["nordea"], name: "Nordea", logoKey: "bank", color: "#0000A0" },
  { patterns: ["jyske bank"], name: "Jyske Bank", logoKey: "bank", color: "#004B87" },

  // Utilities
  { patterns: ["ørsted", "orsted"], name: "Ørsted", logoKey: "utility", color: "#00A98F" },
  { patterns: ["radius", "elnet"], name: "Radius", logoKey: "utility", color: "#00A3E0" },
  { patterns: ["norlys", "ewii", "eniig"], name: "Norlys", logoKey: "utility", color: "#E4007C" },
  { patterns: ["hofor"], name: "HOFOR", logoKey: "utility", color: "#0077B6" },

  // Transport
  { patterns: ["dsb"], name: "DSB", logoKey: "transport", color: brandColors.dsb },
  { patterns: ["rejsekort"], name: "Rejsekort", logoKey: "transport", color: "#00A651" },
  { patterns: ["movia"], name: "Movia", logoKey: "transport", color: "#003D7D" },

  // Insurance & Services
  { patterns: ["tryg"], name: "Tryg", logoKey: "insurance", color: "#E30613" },
  { patterns: ["topdanmark", "top danmark"], name: "Topdanmark", logoKey: "insurance", color: "#003366" },
  { patterns: ["alm brand", "alm. brand"], name: "Alm. Brand", logoKey: "insurance", color: "#E30613" },

  // Telecoms
  { patterns: ["tdc", "yousee"], name: "TDC/YouSee", logoKey: "telecom", color: "#0077C8" },
  { patterns: ["telenor"], name: "Telenor", logoKey: "telecom", color: "#0095DB" },
  { patterns: ["3 mobil", "hi3g", "oister"], name: "3", logoKey: "telecom", color: "#E4002B" },
  { patterns: ["telia"], name: "Telia", logoKey: "telecom", color: "#990AE3" },
];

export function getMerchantMatch(description: string): MerchantMatch | null {
  const lowerDesc = description.toLowerCase();

  for (const merchant of merchantPatterns) {
    for (const pattern of merchant.patterns) {
      if (lowerDesc.includes(pattern.toLowerCase())) {
        return {
          name: merchant.name,
          logoKey: merchant.logoKey,
          color: merchant.color,
        };
      }
    }
  }

  return null;
}
