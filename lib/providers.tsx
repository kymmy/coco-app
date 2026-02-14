"use client";

import { ThemeProvider } from "./theme";
import { I18nProvider } from "./i18n";
import { ToastProvider } from "./toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>{children}</ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
