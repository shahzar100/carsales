/**
 * Renders a JSON-LD `<script type="application/ld+json">` tag.
 *
 * The `__html` payload is emitted with `dangerouslySetInnerHTML`, so any
 * admin-editable content that ends up inside `data` (business name, address,
 * description, etc.) could otherwise break out of the script tag or set up
 * an attribute-context attack. We escape:
 *
 *   <  →  <   prevents `</script>` from terminating the tag
 *   >  →  >   prevents `--><script>` HTML-comment breakout
 *   &  →  &   prevents `&lt;`-style HTML-entity tricks
 *   '  →  '   prevents attribute-context escapes
 *
 * `JSON.parse` reverses all four escapes identically, so the payload
 * search engines actually consume is byte-for-byte unchanged.
 *
 * (Hardens against admin-content XSS.)
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const safe = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/'/g, "\\u0027");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
