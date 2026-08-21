"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { ConfigProvider, theme } from "antd";
import { InactivityTracker } from "./InactivityTracker";

export function Providers({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <SessionProvider>
      <InactivityTracker />
      <NextThemesProvider defaultTheme="light" enableSystem disableTransitionOnChange {...props}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#0ea5e9", // Sky Blue
              borderRadius: 8,
              fontFamily: "var(--font-sans)",
            },
            algorithm: theme.defaultAlgorithm,
          }}
        >
          {children}
        </ConfigProvider>
      </NextThemesProvider>
    </SessionProvider>
  );
}
