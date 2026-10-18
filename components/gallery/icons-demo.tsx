import Link from "next/link"
import { JbmIcon, iconPaths, type IconName } from "@/registry/jbm/ui/icons"

export function IconsDemo() {
  return (
    <div
      style={{
        display: "grid",
        gap: 24,
        gridTemplateColumns: "repeat(4, 1fr)",
        padding: 24,
      }}
    >
      {(Object.keys(iconPaths) as IconName[]).map((name) => (
        <JbmIcon key={name} name={name} size={32} label={name} />
      ))}
      <Link
        href="/icons"
        style={{ gridColumn: "1 / -1", textAlign: "center", fontSize: 14 }}
      >
        Explore & review all 12 icons →
      </Link>
    </div>
  )
}
