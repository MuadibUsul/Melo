export function formatMeloName(name?: string | null, fallback = "Melo 编辑部") {
  if (!name) return fallback;
  return name
    .replace(/声成编辑部/g, "Melo 编辑部")
    .replace(/声成/g, "Melo")
    .replace(/MiniMax/g, "Melo")
    .replace(/Suno/gi, "Melo");
}
