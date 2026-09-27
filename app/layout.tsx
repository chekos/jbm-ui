import { SiteDocument, siteMetadata } from "./document"

export const metadata = siteMetadata

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SiteDocument>{children}</SiteDocument>
}
