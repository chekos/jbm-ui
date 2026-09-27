import type { Metadata } from "next"
import { SiteNotFound } from "@/components/gallery/not-found"

export const metadata: Metadata = {
  title: "Not found · jbm-ui",
}

export default function NotFound() {
  return <SiteNotFound />
}
