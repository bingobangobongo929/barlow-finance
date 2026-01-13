"use client";

import * as React from "react";
import { ThemeProvider } from "./theme-provider";
import { ToastProvider } from "@/components/ui/toast";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="barlow-theme">
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}

export { ThemeProvider, useTheme } from "./theme-provider";
