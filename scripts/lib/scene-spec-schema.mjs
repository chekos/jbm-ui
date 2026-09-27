// Generates the scene-spec JSON Schema (served at /schemas/scene-spec.json) from the types in
// registry/jbm/motion/spec.ts with the TypeScript compiler. Field descriptions come from JSDoc;
// the tags @default (JSON), @pattern, @minimum, @maximum, @exclusiveMinimum, @exclusiveMaximum,
// and @integer add the matching JSON Schema keywords. `pnpm contracts:build` writes the file and
// `pnpm contracts:check` fails when it drifts from the types.
import { join } from "node:path"
import ts from "typescript"

const specPath = "registry/jbm/motion/spec.ts"
export const sceneSpecSchemaFile = "public/schemas/scene-spec.json"
export const sceneSpecSchemaPath = "/schemas/scene-spec.json"

/** Type aliases emitted as named $defs (everything else is inlined). */
const named = [
  "SceneSpec",
  "CompositionOptions",
  "Block",
  "StatItem",
  "SafeArea",
  "SceneLayout",
  "PerOrientation",
  "At",
]
const numericTags = ["minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum"]

const clean = (text) => text.replace(/\s+/g, " ").trim()

export function buildSceneSpecSchema(root, { id } = {}) {
  const file = join(root, specPath)
  const program = ts.createProgram([file], {
    target: ts.ScriptTarget.ES2022,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
  })
  const checker = program.getTypeChecker()
  const source = program.getSourceFile(file)
  const aliases = new Map()
  for (const statement of source.statements)
    if (ts.isTypeAliasDeclaration(statement)) aliases.set(statement.name.text, statement)
  for (const name of [...named, "ScenesFile"])
    if (!aliases.has(name)) throw new Error(`${specPath}: missing type ${name}`)

  const tagText = (tag) =>
    typeof tag.comment === "string" ? tag.comment : ts.getTextOfJSDocComment(tag.comment) ?? ""

  /** Description and keyword tags from a symbol's (or declaration's) JSDoc. */
  function annotations(symbol, declaration) {
    const out = {}
    const doc = symbol
      ? ts.displayPartsToString(symbol.getDocumentationComment(checker))
      : ts.getTextOfJSDocComment(ts.getJSDocCommentsAndTags(declaration).find(ts.isJSDoc)?.comment) ?? ""
    if (clean(doc)) out.description = clean(doc)
    const tags = symbol
      ? symbol.getJsDocTags(checker).map((tag) => ({ name: tag.name, text: ts.displayPartsToString(tag.text) }))
      : ts.getJSDocTags(declaration).map((tag) => ({ name: tag.tagName.text, text: tagText(tag) }))
    for (const { name, text } of tags) {
      const value = text.trim()
      if (name === "default") out.default = JSON.parse(value)
      else if (name === "pattern") out.pattern = value
      else if (name === "integer") out.integer = true
      else if (numericTags.includes(name)) out[name] = Number(value)
    }
    return out
  }

  /** Applies numeric/pattern keywords to the branch of a schema they belong to. */
  function constrain(schema, { integer, pattern, ...rest }) {
    const numeric = Object.fromEntries(numericTags.filter((key) => key in rest).map((key) => [key, rest[key]]))
    const apply = (node) => {
      if (node.type === "number") {
        if (integer) node.type = "integer"
        Object.assign(node, numeric)
      }
      if (node.type === "string" && pattern) node.pattern = pattern
      for (const branch of node.anyOf ?? []) if (!branch.enum) apply(branch)
      // A PerOrientation branch keeps its own bounds (both fields @minimum 0); the tags on the
      // union constrain its number branch only.
    }
    apply(schema)
    const meta = {}
    if (rest.description) meta.description = rest.description
    if ("default" in rest) meta.default = rest.default
    return { ...meta, ...schema }
  }

  const defs = {}
  const aliasName = (type) => {
    const name = type.aliasSymbol?.name
    return name && named.includes(name) && aliases.has(name) ? name : undefined
  }

  function ref(name) {
    if (!(name in defs)) {
      defs[name] = {}
      const declaration = aliases.get(name)
      const type = checker.getTypeAtLocation(declaration.name)
      const { description, ...tags } = annotations(undefined, declaration)
      const body = constrain(convert(type, true), tags)
      defs[name] = { ...(description ? { title: name, description } : { title: name }), ...body }
    }
    return { $ref: `#/$defs/${name}` }
  }

  function convert(type, top = false) {
    const alias = aliasName(type)
    if (alias && !top) return ref(alias)
    if (type.flags & ts.TypeFlags.String) return { type: "string" }
    if (type.flags & ts.TypeFlags.Number) return { type: "number" }
    if (type.flags & ts.TypeFlags.Boolean) return { type: "boolean" }
    if (type.flags & ts.TypeFlags.StringLiteral) return { const: type.value }
    if (type.flags & ts.TypeFlags.NumberLiteral) return { const: type.value }
    if (type.isUnion()) {
      let parts = type.types.filter((part) => !(part.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null)))
      const booleans = parts.filter((part) => part.flags & ts.TypeFlags.BooleanLiteral)
      if (booleans.length === 2) parts = [...parts.filter((part) => !booleans.includes(part)), checker.getBooleanType()]
      if (parts.length === 1) return convert(parts[0])
      const literals = parts.filter((part) => part.flags & ts.TypeFlags.StringLiteral)
      const literalSchema = { type: "string", enum: literals.map((part) => part.value) }
      if (literals.length === parts.length) return literalSchema
      const branches = parts.filter((part) => !literals.includes(part)).map((part) => convert(part))
      // Objects told apart by a `type` constant: validate `type` first, then only the matching
      // member, so an invalid block reports its own field instead of every alternative.
      if (!literals.length && branches.every((branch) => branch.properties?.type?.const !== undefined))
        return {
          type: "object",
          required: ["type"],
          properties: { type: { enum: branches.map((branch) => branch.properties.type.const) } },
          allOf: branches.map((branch) => ({
            if: { properties: { type: { const: branch.properties.type.const } } },
            then: branch,
          })),
        }
      return { anyOf: [...(literals.length ? [literalSchema] : []), ...branches] }
    }
    if (checker.isArrayType(type)) return { type: "array", items: convert(checker.getTypeArguments(type)[0]) }
    if (type.flags & ts.TypeFlags.Object || type.isIntersection()) {
      const properties = {}
      const required = []
      for (const symbol of checker.getPropertiesOfType(type)) {
        const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0]
        const propType = checker.getNonNullableType(
          declaration ? checker.getTypeOfSymbolAtLocation(symbol, declaration) : checker.getTypeOfSymbol(symbol)
        )
        properties[symbol.name] = constrain(convert(propType), annotations(symbol))
        if (!(symbol.flags & ts.SymbolFlags.Optional)) required.push(symbol.name)
      }
      const index = checker.getIndexInfosOfType(type)[0]
      const schema = { type: "object", properties, ...(required.length ? { required } : {}) }
      schema.additionalProperties = index ? convert(index.type) : false
      if (index && !Object.keys(properties).length) delete schema.properties
      // A block member's description is its `type` field's doc.
      if (properties.type?.const && properties.type.description) {
        schema.description = properties.type.description
        properties.type = { const: properties.type.const }
      }
      return schema
    }
    throw new Error(`${specPath}: cannot express ${checker.typeToString(type)} in JSON Schema`)
  }

  const root_ = convert(checker.getTypeAtLocation(aliases.get("ScenesFile").name), true)
  ref("SceneSpec")
  const ordered = Object.fromEntries(named.filter((name) => name in defs).map((name) => [name, defs[name]]))
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    ...(id ? { $id: id } : {}),
    title: "jbm-ui scene spec",
    description:
      "A parsed scenes file for @jbm/scene-spec (SceneFromSpec). Generated from the types in motion/spec.ts, which the item installs; do not edit. Validate one scene against #/$defs/SceneSpec. Runtime rules the schema cannot express are listed under Errors in https://jbm-ui.bns.studio/docs/scene-spec.md.",
    ...root_,
    $defs: ordered,
  }
}
