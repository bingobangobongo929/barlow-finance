import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Barlow Finance",
    template: "%s | Barlow Finance",
  },
  description: "Barlow Farmhouse Finance - Household financial command center",
  keywords: ["finance", "household", "budget", "expenses", "Danish", "DKK"],
  authors: [{ name: "Barlow Family" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
