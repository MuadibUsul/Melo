import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Plans ──
  const plans = [
    { code: "free", name: "免费版", priceCents: 0, currency: "CNY", interval: "none", monthlyCredits: 30, features: { proMode: false, voiceClone: false, maxConcurrent: 1, maxDurationSec: 120, commercial: false, watermarkFree: false, priorityQueue: false } },
    { code: "monthly", name: "专业版·月付", priceCents: 2900, currency: "CNY", interval: "month", monthlyCredits: 300, features: { proMode: true, voiceClone: true, maxConcurrent: 5, maxDurationSec: 300, commercial: true, watermarkFree: true, priorityQueue: false } },
    { code: "yearly", name: "专业版·年付", priceCents: 19900, currency: "CNY", interval: "year", monthlyCredits: 500, features: { proMode: true, voiceClone: true, maxConcurrent: 10, maxDurationSec: 300, commercial: true, watermarkFree: true, priorityQueue: true } },
  ];
  for (const plan of plans) {
    await prisma.plan.upsert({ where: { code: plan.code }, create: plan, update: plan });
  }
  console.log(`  ✅ ${plans.length} plans`);

  // ── Official Presets ──
  const presets = [
    { id: "off_music_pop", type: "music_style", name: "中文流行 Pop", category: "风格", params: { genre: "中文流行", mood: "温暖", vocal: "男女对唱", durationPreset: "60 秒 Demo" }, isOfficial: true },
    { id: "off_music_gufeng", type: "music_style", name: "古风国风", category: "风格", params: { genre: "国风", mood: "悠远", vocal: "女声", durationPreset: "90 秒标准" }, isOfficial: true },
    { id: "off_music_rnb", type: "music_style", name: "都市 R&B", category: "风格", params: { genre: "R&B", mood: "性感", vocal: "男声", durationPreset: "60 秒 Demo" }, isOfficial: true },
    { id: "off_mood_morning", type: "mood", name: "清晨通勤", category: "情绪", params: { genre: "独立民谣", mood: "轻快", vocal: "无人声", durationPreset: "90 秒标准" }, isOfficial: true },
    { id: "off_mood_night", type: "mood", name: "深夜独处", category: "情绪", params: { genre: "氛围电子", mood: "孤独", vocal: "无人声", durationPreset: "120 秒完整" }, isOfficial: true },
    { id: "off_tts_podcast", type: "tts", name: "温柔女声播客", category: "TTS", params: { voiceId: "female-sweet", speed: 0.9, emotion: "calm" }, isOfficial: true },
    { id: "off_tts_bold", type: "tts", name: "激昂男声解说", category: "TTS", params: { voiceId: "male-bold", speed: 1.1, emotion: "happy" }, isOfficial: true },
    { id: "off_lyrics_vc", type: "lyrics_template", name: "Verse-Chorus 标准", category: "歌词模板", params: { structure: ["verse", "chorus", "verse", "chorus", "bridge", "chorus"] }, isOfficial: true },
  ];
  for (const p of presets) {
    await prisma.preset.upsert({ where: { id: p.id }, create: p, update: p });
  }
  console.log(`  ✅ ${presets.length} presets`);

  // ── Voices ──
  const voices = [
    { providerVoiceId: "female-sweet", name: "甜美女声", language: "zh", gender: "female", tags: ["播客", "有声书"] },
    { providerVoiceId: "male-bold", name: "浑厚男声", language: "zh", gender: "male", tags: ["解说", "广告"] },
    { providerVoiceId: "female-calm", name: "温柔女声", language: "zh", gender: "female", tags: ["冥想", "助眠"] },
    { providerVoiceId: "male-young", name: "青年男声", language: "zh", gender: "male", tags: ["配音", "Vlog"] },
    { providerVoiceId: "female-cute", name: "可爱女声", language: "zh", gender: "female", tags: ["动画", "游戏"] },
    { providerVoiceId: "male-mature", name: "成熟男声", language: "zh", gender: "male", tags: ["纪录片", "课程"] },
  ];
  for (const v of voices) {
    await prisma.voice.upsert({ where: { providerVoiceId: v.providerVoiceId }, create: v, update: v });
  }
  console.log(`  ✅ ${voices.length} voices`);

  // ── Demo admin user ──
  const bcryptModule = await import("bcryptjs");
  const bcrypt = bcryptModule.default ?? bcryptModule;
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@music.local" },
    create: { email: "admin@music.local", passwordHash: adminHash, displayName: "管理员", role: "ADMIN" },
    update: {},
  });
  await prisma.creditLedger.create({
    data: { userId: admin.id, type: "grant", amount: 1000, reason: "seed" },
  });
  console.log(`  ✅ Admin: admin@music.local / admin123 (1000 credits)`);

  console.log("\n🎵 Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
