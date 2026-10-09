// Git exports/checkouts may use CRLF on Windows. Installation text must be
// reproducible across hosts; never apply this to signed archives or binaries.
export function normalizeBuildText(text) {
  return text.replace(/\r\n?/g, "\n");
}
