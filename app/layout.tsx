import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { agentAlternates, siteOrigin } from "@/lib/site"
import "./globals.css"

const sans = Geist({ subsets: ["latin"], variable: "--font-sans" })
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: "jbm-ui",
  description:
    "Primitives and motion blocks for tacosdedatos explainer videos.",
  // Agents discover the plain-text and JSON catalogs from any page's <head>.
  alternates: agentAlternates,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <a className="skip-link" href="#components">
          Skip to components
        </a>
        {children}
      </body>
    </html>
  )
}
