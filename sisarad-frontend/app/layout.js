import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientAppWrapper from './components/ClientAppWrapper';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SISARAD",
  description: "Sistema de Información SISARAD",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ClientAppWrapper>{children}</ClientAppWrapper>
      </body>
    </html>
  );
}
