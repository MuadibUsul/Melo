import { redirect } from "next/navigation";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  redirect(params.next ? `/login?next=${encodeURIComponent(params.next)}` : "/login");
}
