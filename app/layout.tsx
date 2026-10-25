import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Segvoo – Hausverwaltung & Nebenkostenabrechnung",
  description:
    "Segvoo: Immobilien, Einheiten, Mieter und Verträge verwalten und rechtssichere Nebenkostenabrechnungen erstellen.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <Nav />
          <main style={{ flex: 1, padding: "1.75rem 2rem", maxWidth: 1200, width: "100%" }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
