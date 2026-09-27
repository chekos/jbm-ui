import { ItemNotFound } from "@/components/gallery/not-found"

// Unknown /c/<name>: the site's not-found page, naming the missing item. Bundles (ui-bits) are
// not 404s; ./page.tsx renders their explanation as a noindex page.
export default function NotFound() {
  return <ItemNotFound />
}
