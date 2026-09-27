import { ItemNotFound, type BundleNotice } from "@/components/gallery/not-found"
import { getContract, getContracts } from "@/lib/contracts"

// Bundles (ui-bits) re-export other items and have no QA page; /c/<bundle> explains that and
// links to each member. Other unknown names get the site's not-found page.
function bundleNotices(): BundleNotice[] {
  return getContracts()
    .filter((contract) => contract.entry === "bundle")
    .map((contract) => ({
      name: contract.name,
      title: contract.title,
      description: contract.description,
      pageReason: contract.pageReason ?? "",
      // Several exports can come from one item; list each item once.
      members: [
        ...new Set(
          contract.api.flatMap((entry) =>
            entry.kind === "re-export" ? [entry.from] : []
          )
        ),
      ].map((name) => {
        const member = getContract(name)
        return {
          name: member.name,
          title: member.title,
          description: member.description,
        }
      }),
    }))
}

export default function NotFound() {
  return <ItemNotFound bundles={bundleNotices()} />
}
