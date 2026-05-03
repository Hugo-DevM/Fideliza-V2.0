// Middleware redirects / to /en or /es based on Accept-Language.
// This page is a fallback that should never be rendered in practice.
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/en');
}
