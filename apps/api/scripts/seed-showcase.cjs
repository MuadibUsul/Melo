const { PrismaClient } = require("@prisma/client");
const Redis = require("ioredis");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

const artists = [
  { slug: "lin-ye", name: "林野", style: "中文流行", bio: "擅长城市叙事和温柔女声旋律。", song: "城市微光", mood: "夜晚", vocal: "女声", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { slug: "shen-yue-qing", name: "沈月青", style: "国风", bio: "用古琴、笛声和现代鼓组写东方意境。", song: "月下归舟", mood: "诗意", vocal: "女声", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { slug: "mo-ran", name: "莫燃", style: "R&B", bio: "偏爱松弛律动、低频贝斯和夜色人声。", song: "蓝色凌晨", mood: "暧昧", vocal: "男声", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { slug: "qiao-an", name: "乔安", style: "电子", bio: "把合成器音墙和舞曲律动融合进流行结构。", song: "霓虹脉冲", mood: "热烈", vocal: "合唱", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { slug: "yu-chuan", name: "余川", style: "Lo-fi", bio: "温暖采样、慢速鼓点和学习陪伴型声音。", song: "自习室雨声", mood: "治愈", vocal: "无人声", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
  { slug: "nan-xi", name: "南溪", style: "纯音乐", bio: "钢琴和弦乐为主，适合播客、纪录片和冥想。", song: "白昼回声", mood: "平静", vocal: "无人声", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
  { slug: "han-su", name: "韩肃", style: "影视配乐", bio: "擅长大动态铺陈、情绪推进和画面感配乐。", song: "远山序章", mood: "史诗", vocal: "无人声", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
  { slug: "luo-xing", name: "洛星", style: "游戏配乐", bio: "像素冒险、战斗循环和关卡主题创作者。", song: "星门战斗", mood: "冒险", vocal: "无人声", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
  { slug: "xiao-he", name: "小赫", style: "说唱", bio: "中文 flow、鼓组冲击和街头叙事。", song: "环线以北", mood: "锋利", vocal: "男声", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
  { slug: "tang-wei", name: "唐微", style: "民谣", bio: "木吉他、口琴和轻叙事女声。", song: "风经过站台", mood: "温暖", vocal: "女声", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" },
];

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);
  await redis.del("chart:hot");
  const editorialOwner = await prisma.user.upsert({
    where: { email: "editorial@music.local" },
    create: {
      email: "editorial@music.local",
      passwordHash,
      displayName: "声成编辑部",
      role: "ADMIN",
      status: "ACTIVE",
    },
    update: {
      displayName: "声成编辑部",
      role: "ADMIN",
      status: "ACTIVE",
      passwordHash,
    },
  });
  const seededTrackIds = [];

  for (const [index, item] of artists.entries()) {
    const user = await prisma.user.upsert({
      where: { email: `${item.slug}@music.local` },
      create: {
        email: `${item.slug}@music.local`,
        passwordHash,
        displayName: item.name,
        role: "CREATOR",
        status: "ACTIVE",
      },
      update: {
        displayName: item.name,
        role: "CREATOR",
        status: "ACTIVE",
        passwordHash,
      },
    });

    const job = await prisma.generationJob.upsert({
      where: { id: `seed-job-${item.slug}` },
      create: {
        id: `seed-job-${item.slug}`,
        userId: user.id,
        type: "music",
        mode: "simple",
        status: "succeeded",
        inputParams: { prompt: item.bio, genre: item.style, mood: item.mood, vocal: item.vocal },
        provider: "seed",
        providerModel: "sample-catalog",
        creditCost: 0,
        completedAt: new Date(),
      },
      update: {
        status: "succeeded",
        inputParams: { prompt: item.bio, genre: item.style, mood: item.mood, vocal: item.vocal },
        completedAt: new Date(),
      },
    });

    const asset = await prisma.asset.upsert({
      where: { id: `seed-asset-${item.slug}` },
      create: {
        id: `seed-asset-${item.slug}`,
        jobId: job.id,
        userId: user.id,
        type: "music",
        storageKey: item.url,
        streamKey: item.url,
        durationMs: 180000 + index * 9000,
        format: "mp3",
        status: "published",
        waveform: Array.from({ length: 48 }, (_, n) => Math.round((0.35 + Math.abs(Math.sin((n + index) / 5)) * 0.55) * 100) / 100),
      },
      update: {
        storageKey: item.url,
        streamKey: item.url,
        durationMs: 180000 + index * 9000,
        format: "mp3",
        status: "published",
      },
    });

    const playCount = 9800 - index * 730;
    const likeCount = 1280 - index * 83;
    const publishedAt = new Date(Date.now() - index * 36 * 3600_000);
    const track = await prisma.track.upsert({
      where: { assetId: asset.id },
      create: {
        assetId: asset.id,
        creatorId: user.id,
        title: item.song,
        description: item.bio,
        lyrics: item.vocal === "无人声" ? null : `[Verse]\n${item.bio}\n\n[Chorus]\n让旋律穿过人群，被更多耳朵听见。`,
        genre: item.style,
        tags: [item.mood, item.vocal, "AI 生成", "样例作品"],
        language: "zh",
        visibility: "public",
        isAiGenerated: true,
        status: "published",
        playCount,
        likeCount,
        commentCount: 0,
        publishedAt,
      },
      update: {
        creatorId: user.id,
        title: item.song,
        description: item.bio,
        lyrics: item.vocal === "无人声" ? null : `[Verse]\n${item.bio}\n\n[Chorus]\n让旋律穿过人群，被更多耳朵听见。`,
        genre: item.style,
        tags: [item.mood, item.vocal, "AI 生成", "样例作品"],
        language: "zh",
        visibility: "public",
        isAiGenerated: true,
        status: "published",
        playCount,
        likeCount,
        publishedAt,
      },
    });

    await redis.zadd("chart:hot", playCount + likeCount * 2, track.id);
    seededTrackIds.push(track.id);
  }

  const playlist = await prisma.playlist.upsert({
    where: { id: "editor-picks" },
    create: {
      id: "editor-picks",
      ownerId: editorialOwner.id,
      title: "声成编辑精选",
      isPublic: true,
      type: "editorial",
    },
    update: {
      ownerId: editorialOwner.id,
      title: "声成编辑精选",
      isPublic: true,
      type: "editorial",
    },
  });
  await prisma.playlistTrack.deleteMany({ where: { playlistId: playlist.id } });
  await prisma.playlistTrack.createMany({
    data: seededTrackIds.map((trackId, index) => ({ playlistId: playlist.id, trackId, position: index })),
  });

  const summary = await prisma.track.findMany({
    where: { status: "published" },
    select: { title: true, genre: true, playCount: true, creator: { select: { displayName: true } } },
    orderBy: { playCount: "desc" },
    take: 10,
  });
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .finally(async () => {
    await redis.quit();
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
