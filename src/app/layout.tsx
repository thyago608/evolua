import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evolua.",
  description: "Plataforma de pesquisa e acompanhamento de pacientes",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const savedTheme = localStorage.getItem("evolua-theme");
                const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                document.documentElement.classList.toggle(
                  "dark",
                  savedTheme ? savedTheme === "dark" : prefersDark,
                );
              } catch {}
            })();`,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
