import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Root HTML layout for Web and PWA Home Screen installation
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover, maximum-scale=1, user-scalable=no"
        />
        <title>RutaVentas - Distribución Miguel</title>

        {/* PWA y Acceso Directo Móvil */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e3a8a" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* iOS Safari Home Screen Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RutaVentas" />
        <link rel="apple-touch-icon" href="/favicon.ico" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
