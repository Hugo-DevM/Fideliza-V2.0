/**
 * Shared naming for the installed portal card.
 *
 * Both platforms read the label from a different place — Android from the
 * manifest's `short_name`, iOS from `apple-mobile-web-app-title` — so this
 * lives in one module to stop the two from drifting apart.
 */

/**
 * Home screen labels are truncated at roughly 12 characters on both iOS and
 * Android. Cutting on a word boundary reads better than a mid-word chop.
 */
export function portalShortName(name: string): string {
  const clean = name.trim();
  if (clean.length <= 12) return clean;

  const cut = clean.slice(0, 12);
  const lastSpace = cut.lastIndexOf(' ');

  // Only honour the word boundary if it does not leave a stub.
  return (lastSpace >= 6 ? cut.slice(0, lastSpace) : cut).trimEnd();
}
