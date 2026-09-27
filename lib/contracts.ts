// Server-side reader for the generated agent contracts (props, stage sizes, examples, QA notes).
// Client code reads the lean contracts/generated/gallery.json through item-meta instead.
import type { ContractEntry } from "@/contracts/schema"
import generated from "@/contracts/generated/catalog.json"

const entries = generated.items as ContractEntry[]
const byName = new Map(entries.map((entry) => [entry.name, entry]))

export function getContracts(): ContractEntry[] {
  return entries
}

export function getContract(name: string): ContractEntry {
  const contract = byName.get(name)
  if (!contract)
    throw new Error(`Missing agent contract for ${name}; run pnpm contracts:build`)
  return contract
}
