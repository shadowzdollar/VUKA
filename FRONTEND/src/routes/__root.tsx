import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useMemo, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { InitialVisitPreloader } from "@/components/vuka/preloader";
import { I18nProvider, useLangCopy } from "@/lib/i18n";
import { SessionProvider } from "@/lib/session";
import { ThemeProvider, themeInitScript } from "@/lib/theme";
import { reportError } from "../lib/report-error";

const ROOT_COPY = {
  en: {
    notFoundTitle: "Page not found",
    notFoundDesc: "The page you're looking for doesn't exist or has been moved.",
    goHome: "Go home",
    errorTitle: "This page didn't load",
    errorDesc: "Something went wrong on our end. You can try refreshing or head back home.",
    tryAgain: "Try again",
  },
  fr: {
    notFoundTitle: "Page introuvable",
    notFoundDesc: "La page que vous recherchez n'existe pas ou a été déplacée.",
    goHome: "Retour à l'accueil",
    errorTitle: "Cette page n'a pas pu se charger",
    errorDesc: "Un problème est survenu de notre côté. Vous pouvez actualiser ou revenir à l'accueil.",
    tryAgain: "Réessayer",
  },
  sw: {
    notFoundTitle: "Ukurasa haujapatikana",
    notFoundDesc: "Ukurasa unaoutafuta haupo au umehamishwa.",
    goHome: "Rudi mwanzo",
    errorTitle: "Ukurasa huu haujapakia",
    errorDesc: "Hitilafu imetokea upande wetu. Unaweza kujaribu tena au kurudi mwanzo.",
    tryAgain: "Jaribu tena",
  },
  pt: {
    notFoundTitle: "Página não encontrada",
    notFoundDesc: "A página que procura não existe ou foi movida.",
    goHome: "Ir para o início",
    errorTitle: "Esta página não carregou",
    errorDesc: "Ocorreu um problema do nosso lado. Pode tentar atualizar ou voltar ao início.",
    tryAgain: "Tentar novamente",
  },
  rw: {
    notFoundTitle: "Urupapuro ntirwabonetse",
    notFoundDesc: "Urupapuro ushakisha ntirubaho cyangwa rwimuwe.",
    goHome: "Subira ku rubuga rw'ibanze",
    errorTitle: "Uru rupapuro ntirwafungutse",
    errorDesc: "Hari ikibazo cyavutse. Wagerageza kongera cyangwa ugasubira ahabanza.",
    tryAgain: "Ongera ugerageze",
  },
};

function NotFoundComponent() {
  const c = useLangCopy(ROOT_COPY);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{c.notFoundTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{c.notFoundDesc}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {c.goHome}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error: raw, reset }: { error: unknown; reset: () => void }) {
  const error = useMemo(() => (raw instanceof Error ? raw : new Error(String(raw))), [raw]);
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <I18nProvider>
      <ErrorInner
        onRetry={() => {
          router.invalidate();
          reset();
        }}
      />
    </I18nProvider>
  );
}

function ErrorInner({ onRetry }: { onRetry: () => void }) {
  const c = useLangCopy(ROOT_COPY);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{c.errorTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{c.errorDesc}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {c.tryAgain}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {c.goHome}
          </a>
        </div>
      </div>
    </div>
  );
}

const PUBLIC_URL = (import.meta.env["VITE_PUBLIC_URL"] as string | undefined)?.replace(/\/$/, "");

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VUKA — Cross-border trade settlement" },
      {
        name: "description",
        content:
          "VUKA: invoice-linked, escrow-backed cross-border payments for African SME traders.",
      },
      { property: "og:title", content: "VUKA — Rise & Cross Over" },
      {
        property: "og:description",
        content: "Invoice-linked, escrow-backed cross-border payments for African traders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      // Social crawlers need an absolute URL; set VITE_PUBLIC_URL (e.g. https://app.example.org) at build time.
      ...(PUBLIC_URL
        ? [
            { property: "og:image", content: `${PUBLIC_URL}/og-image.png` },
            { property: "og:image:width", content: "1200" },
            { property: "og:image:height", content: "630" },
            { name: "twitter:image", content: `${PUBLIC_URL}/og-image.png` },
          ]
        : []),
      { name: "theme-color", content: "#fafaf7" },
    ],
    // Ensures the document stays in light mode before first paint.
    scripts: [{ children: themeInitScript }],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=Geist+Mono:wght@400;500&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if ("serviceWorker" in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* SW registration ignored on error */
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <SessionProvider>
            <InitialVisitPreloader />
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
            <Toaster position="bottom-right" />
          </SessionProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
