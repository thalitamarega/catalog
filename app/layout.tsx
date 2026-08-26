import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "THATA — Catálogo de joias",
  description: "Seleção de joias para body piercing. Consulte disponibilidade pelo WhatsApp.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
