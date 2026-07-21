import { redirect } from "next/navigation";

export default async function SongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/tracks/${id}`);
}
