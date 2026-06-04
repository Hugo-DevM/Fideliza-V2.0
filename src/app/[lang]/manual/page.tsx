import { redirect } from "next/navigation";

// Language-specific URLs are no longer used.
// The manual lives at /manual with a client-side language toggle.
export default function ManualLangRedirect() {
  redirect("/manual");
}
