/**
 * Renders `html` as a parser-blocking inline script in the server HTML only, so it runs while the
 * prerendered page is parsed, before first paint. A script React creates on the client never runs
 * (and React warns about it), so client renders emit an inert text/plain copy;
 * suppressHydrationWarning covers the type difference. Used by the bench host, Install once, and
 * the index filter.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
