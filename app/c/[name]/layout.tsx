import { ItemNameProvider } from "@/components/gallery/not-found"

// Passes the item name to ./not-found.tsx, which receives no params of its own.
export default async function ItemLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  return <ItemNameProvider name={name}>{children}</ItemNameProvider>
}
