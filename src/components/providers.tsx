"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SessionProvider, useSession } from "next-auth/react";
import { ConfigProvider, theme, App } from "antd";
import { InactivityTracker } from "./InactivityTracker";

function AppConfigurator({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const customColor = (session?.user as any)?.themeColor;
  const activeColor = customColor || "#0ea5e9";

  return (
    <>
      {customColor && (
        <style>
          {`
            :root {
              --primary: ${customColor};
            }
            .dark {
              --primary: ${customColor};
            }
          `}
        </style>
      )}
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: activeColor,
            borderRadius: 8,
            fontFamily: "var(--font-sans)",
          },
          algorithm: theme.defaultAlgorithm,
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </>
  );
}

export function Providers({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <SessionProvider>
      <InactivityTracker />
      <NextThemesProvider defaultTheme="light" enableSystem disableTransitionOnChange {...props}>
        <AppConfigurator>
          {children}
        </AppConfigurator>
      </NextThemesProvider>
    </SessionProvider>
  );
}
