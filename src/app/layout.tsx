import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/app-context";

export const metadata: Metadata = {
  title: "Plataforma de Recibos Digitales y Nómina Administrativa",
  description: "Sistema integral de administración de empresas, colaboradores y emisión de recibos digitales personalizables con validación QR.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
