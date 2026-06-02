import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

/**
 * FOLIO web shell — paper canvas, editorial typography.
 *
 * Loads:
 *   - Heebo (Hebrew + Latin sans, full weights)
 *   - JetBrains Mono (editorial meta tags)
 *
 * No global `!important` overrides. React Native styles win.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="theme-color" content="#F4EFE3" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          html, body, #root {
            height: 100%;
          }
          html {
            direction: rtl;
            background-color: #F4EFE3;
          }
          body {
            margin: 0;
            background-color: #F4EFE3;
            color: #0F1117;
            font-family: "Heebo", "Inter", -apple-system, BlinkMacSystemFont,
              "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
            font-feature-settings: "ss01", "cv01";
          }
          ::-webkit-scrollbar { width: 0; display: none; }
          * { scrollbar-width: none; }
        `}</style>
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
