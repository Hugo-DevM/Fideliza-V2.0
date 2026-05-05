// This route is no longer used.
// The manual lives at /[lang]/manual (e.g. /es/manual, /en/manual).
// The proxy redirects bare /manual → /es/manual or /en/manual based on Accept-Language.
import { redirect } from 'next/navigation';
export default function ManualRedirect() {
  redirect('/es/manual');
}
