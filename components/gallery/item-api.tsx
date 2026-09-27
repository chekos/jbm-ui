import Link from "next/link"
import type {
  ApiField,
  ContractEntry,
  StageBox,
  StageSize,
} from "@/contracts/schema"

// The /c/<name> contract section: declared stage size, then one compact table per export.
// Server-rendered from contracts/generated/catalog.json.

/** Renders `code` spans in authored prose. */
function Prose({ text }: { text: string }) {
  return text
    .split(/(`[^`]+`)/)
    .map((part, i) =>
      part.startsWith("`") && part.endsWith("`") ? (
        <code key={i}>{part.slice(1, -1)}</code>
      ) : (
        part
      )
    )
}

const size = ({ width, height }: StageBox) => (
  <>
    {width}
    <span aria-hidden="true"> × </span>
    <span className="sr-only"> by </span>
    {height}
  </>
)

function Stage({ stage }: { stage: StageSize }) {
  if (stage.mode !== "declared")
    return (
      <dl className="item-stage" aria-label="Stage size">
        <dt>Stage</dt>
        <dd>
          <code>{stage.mode}</code>
          <p>
            <Prose text={stage.reason} />
          </p>
        </dd>
      </dl>
    )
  return (
    <dl className="item-stage" aria-label="Stage size in stage pixels">
      <dt>Stage px</dt>
      <dd>Declared at the documented defaults</dd>
      <dt>Landscape</dt>
      <dd>
        <code>{size(stage.landscape)}</code>
      </dd>
      <dt>Vertical</dt>
      <dd>
        <code>{size(stage.vertical)}</code>
      </dd>
      <dt>Basis</dt>
      <dd>
        <p>
          <Prose text={stage.basis} />
        </p>
      </dd>
    </dl>
  )
}

function FieldTable({ fields, label }: { fields: ApiField[]; label: string }) {
  if (!fields.length) return <p>No {label.toLowerCase()}.</p>
  return (
    <table className="api-table">
      <colgroup>
        <col className="api-col-name" />
        <col className="api-col-type" />
        <col className="api-col-default" />
        <col />
      </colgroup>
      <thead>
        <tr>
          <th scope="col">{label.replace(/s$/, "")}</th>
          <th scope="col">Type</th>
          <th scope="col">Default</th>
          <th scope="col">Description</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((field) => (
          <tr key={field.name}>
            <th scope="row">
              <code>{field.name}</code>
            </th>
            <td data-label="Type">
              <code>{field.type}</code>
            </td>
            <td data-label="Default">
              {field.required ? (
                <span className="api-required">required</span>
              ) : field.default !== null ? (
                <code>{field.default}</code>
              ) : (
                <span className="api-none">none</span>
              )}
            </td>
            <td className="api-description">
              <Prose text={field.description} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function ItemApi({ contract }: { contract: ContractEntry }) {
  const single = contract.api.length === 1
  return (
    <section className="item-api" aria-labelledby="api-heading">
      <div className="item-api-head">
        <h2 id="api-heading">{single ? "Props" : "API"}</h2>
        <Stage stage={contract.stage} />
      </div>
      {contract.api.map((entry) => (
        <div className="api-entry" key={entry.export}>
          {entry.kind === "re-export" ? (
            <p>
              <code>{entry.export}</code> is re-exported from{" "}
              <Link href={`/c/${entry.from}`}>{entry.from}</Link>.
            </p>
          ) : (
            <>
              {(!single || entry.kind !== "component") && (
                <h3>
                  <code>{entry.export}</code>
                  <span className="api-kind">{entry.kind}</span>
                </h3>
              )}
              <p>
                <Prose text={entry.summary} />
              </p>
              {entry.kind === "component" && (
                <>
                  <FieldTable fields={entry.props} label="Props" />
                  {entry.passthrough.length > 0 && (
                    <p>
                      Also accepts{" "}
                      {entry.passthrough.map((type, i) => (
                        <span key={type}>
                          {i > 0 && ", "}
                          <code>{type}</code>
                        </span>
                      ))}
                      .
                    </p>
                  )}
                </>
              )}
              {(entry.kind === "hook" || entry.kind === "function") && (
                <>
                  <FieldTable fields={entry.params} label="Params" />
                  <p>
                    Returns <Prose text={entry.returns} />
                  </p>
                </>
              )}
            </>
          )}
        </div>
      ))}
      {contract.qa.length > 0 && (
        <div className="api-entry">
          <h3>QA checks</h3>
          <ul className="api-qa">
            {contract.qa.map((note) => (
              <li key={note}>
                <Prose text={note} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
