import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar"; // <-- 1. IMPORTAMOS A NAVBAR AQUI

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinApp - Gestão Inteligente", // <-- Título atualizado para o seu App!
  description: "Seu consultor financeiro pessoal",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR" // <-- Atualizado para português
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Adicionamos a cor de fundo bg-[#0f172a] aqui para padronizar o app inteiro */}
      <body className="min-h-full flex flex-col bg-[#0f172a]">
        
        <Navbar /> {/* <-- 2. A NAVBAR FIXA ENTRA AQUI */}
        
        {/* Envolvemos o children numa tag main com flex-1 para preencher a tela corretamente */}
        <main className="flex-1">
          {children}
        </main>
        
      </body>
    </html>
  );
}