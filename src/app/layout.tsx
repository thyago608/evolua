import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

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
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
