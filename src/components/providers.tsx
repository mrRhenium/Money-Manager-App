"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { SessionProvider, useSession } from "next-auth/react";
import { ConfigProvider, theme, App } from "antd";
import { InactivityTracker } from "./InactivityTracker";
import { GlobalConfirmationCheck } from "./upi/GlobalConfirmationCheck";

function AppConfigurator({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const customColor = (session?.user as any)?.themeColor;
  const activeColor = customColor || "#0ea5e9";

  React.useEffect(() => {
    try {
      const savedFontSize = localStorage.getItem("user-font-size") || "compact";
      document.documentElement.style.removeProperty("--font-scale");
      document.documentElement.setAttribute("data-font-size", savedFontSize);
      const savedFontFamily = localStorage.getItem("user-font-family");
      if (savedFontFamily) {
        document.documentElement.style.setProperty("--font-family-base", savedFontFamily);
      }
    } catch {}
  }, []);

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
            fontFamily: "var(--font-family-base, var(--font-sans))",
            controlHeight: 40,
          },
          components: {
            Select: {
              controlHeight: 40,
              singleItemHeightLG: 40,
            },
            Input: {
              controlHeight: 40,
            },
          },
          algorithm: resolvedTheme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
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
      <GlobalConfirmationCheck />
      <NextThemesProvider defaultTheme="light" enableSystem disableTransitionOnChange {...props}>
        <AppConfigurator>
          {children}
        </AppConfigurator>
      </NextThemesProvider>
    </SessionProvider>
  );
}
