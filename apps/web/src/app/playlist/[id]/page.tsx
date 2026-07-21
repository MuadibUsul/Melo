import { redirect } from "next/navigation";

export default async function PlaylistAliasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/playlists/${id}`);
}
