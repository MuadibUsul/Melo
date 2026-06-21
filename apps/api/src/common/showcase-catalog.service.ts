import { Injectable } from "@nestjs/common";

interface Creator {
  id: string;
  displayName: string;
  style: string;
  bio: string;
}

interface Track {
  id: string;
  title: string;
  description: string;
  lyrics?: string | null;
  genre: string;
  tags: string[];
  playCount: number;
  likeCount: number;
  commentCount: number;
  isAiGenerated: boolean;
  publishedAt: string;
  audioUrl: string;
  durationMs: number;
  creator: Creator;
}

interface PlaylistSeed {
  id: string;
  title: string;
  owner: { id: string; displayName: string };
  trackIds: string[];
}

@Injectable()
export class ShowcaseCatalogService {
  private readonly creators: Creator[] = [
    { id: "creator-lin-ye", displayName: "林野", style: "中文流行", bio: "擅长城市叙事和温柔女声旋律。" },
    { id: "creator-shen-yueqing", displayName: "沈月青", style: "国风", bio: "把古典器乐和现代流行编排融合在一起。" },
    { id: "creator-mo-ran", displayName: "莫燃", style: "R&B", bio: "偏爱松弛律动、低频贝斯和夜色氛围。" },
    { id: "creator-qiao-an", displayName: "乔岸", style: "电子", bio: "将舞曲能量和合成器音墙写进流行结构。" },
    { id: "creator-yu-chuan", displayName: "余川", style: "Lo-fi", bio: "围绕学习、夜雨和低保真采样展开创作。" },
    { id: "creator-nan-xi", displayName: "南汐", style: "纯音乐", bio: "以钢琴和弦乐为主，适合播客与纪录片场景。" },
    { id: "creator-han-su", displayName: "韩溯", style: "影视配乐", bio: "擅长情绪推进和大画面铺陈。" },
    { id: "creator-luo-xing", displayName: "洛星", style: "游戏配乐", bio: "热爱冒险主题、战斗循环和场景音乐。" },
    { id: "creator-xiao-he", displayName: "小赫", style: "说唱", bio: "中文 flow 和街头叙事是他的核心标签。" },
    { id: "creator-tang-wei", displayName: "唐微", style: "民谣", bio: "木吉他、口琴和轻叙事女声是她的标志。" },
  ];

  private readonly tracks: Track[] = [
    {
      id: "track-city-afterglow",
      title: "城市微光",
      description: "轻盈合成器和女声主旋律交织出的夜行单曲。",
      lyrics: "[主歌]\n街灯沿着高架向远处退去\n人群在凌晨里慢慢安静\n\n[副歌]\n让微光落在你我之间\n把晚风写进今夜的和声",
      genre: "中文流行",
      tags: ["夜晚", "女声", "AI 生成", "热门单曲"],
      playCount: 158230,
      likeCount: 18240,
      commentCount: 326,
      isAiGenerated: true,
      publishedAt: "2026-06-20T20:00:00.000Z",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      durationMs: 214000,
      creator: this.creators[0]!,
    },
    {
      id: "track-moon-return",
      title: "月下归舟",
      description: "国风弦乐铺底，笛声和人声层层推进。",
      lyrics: "[主歌]\n潮声落在青瓦上\n一盏旧灯照长巷\n\n[副歌]\n借月光渡一程水色\n把远行唱成归乡",
      genre: "国风",
      tags: ["诗意", "女声", "AI 生成", "新歌"],
      playCount: 143520,
      likeCount: 16510,
      commentCount: 288,
      isAiGenerated: true,
      publishedAt: "2026-06-20T10:20:00.000Z",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      durationMs: 228000,
      creator: this.creators[1]!,
    },
    {
      id: "track-blue-dawn",
      title: "蓝色凌晨",
      description: "带有 R&B 低频律动的深夜单曲。",
      lyrics: "[主歌]\n霓虹在玻璃上缓缓坠落\n心跳和鼓点贴着耳朵\n\n[副歌]\n把这一夜留在蓝色凌晨\n让温度停在你的侧脸",
      genre: "R&B",
      tags: ["暧昧", "男声", "AI 生成", "热榜"],
      playCount: 136840,
      likeCount: 15120,
      commentCount: 251,
      isAiGenerated: true,
      publishedAt: "2026-06-19T23:10:00.000Z",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      durationMs: 205000,
      creator: this.creators[2]!,
    },
    {
      id: "track-neon-pulse",
      title: "霓虹脉冲",
      description: "节拍强劲、适合夜跑和舞池的电子流行。",
      genre: "电子",
      tags: ["热烈", "合唱", "AI 生成", "派对"],
      playCount: 129760,
      likeCount: 13940,
      commentCount: 214,
      isAiGenerated: true,
      publishedAt: "2026-06-19T18:40:00.000Z",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
      durationMs: 198000,
      creator: this.creators[3]!,
    },
    {
      id: "track-rain-study",
      title: "自习室雨声",
      description: "适合专注陪伴的 Lo-fi 轻氛围。",
      genre: "Lo-fi",
      tags: ["治愈", "纯音乐", "AI 生成", "学习"],
      playCount: 121940,
      likeCount: 12870,
      commentCount: 193,
      isAiGenerated: true,
      publishedAt: "2026-06-18T22:15:00.000Z",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
      durationMs: 187000,
      creator: this.creators[4]!,
    },
    {
      id: "track-white-oak",
      title: "白橡回声",
      description: "钢琴与弦乐主导的纯音乐作品。",
      genre: "纯音乐",
      tags: ["平静", "配乐", "AI 生成", "放松"],
      playCount: 117320,
      likeCount: 12010,
      commentCount: 174,
      isAiGenerated: true,
      publishedAt: "2026-06-18T13:00:00.000Z",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
      durationMs: 236000,
      creator: this.creators[5]!,
    },
    {
      id: "track-mountain-prelude",
      title: "远山序章",
      description: "面向影视预告和剧情推进的配乐样例。",
      genre: "影视配乐",
      tags: ["史诗", "纯音乐", "AI 生成", "配乐"],
      playCount: 112880,
      likeCount: 11140,
      commentCount: 162,
      isAiGenerated: true,
      publishedAt: "2026-06-17T17:45:00.000Z",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
      durationMs: 244000,
      creator: this.creators[6]!,
    },
    {
      id: "track-stargate-battle",
      title: "星门战斗",
      description: "适合动作和闯关场景的游戏音乐。",
      genre: "游戏配乐",
      tags: ["冒险", "纯音乐", "AI 生成", "战斗"],
      playCount: 108540,
      likeCount: 10560,
      commentCount: 146,
      isAiGenerated: true,
      publishedAt: "2026-06-17T11:30:00.000Z",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
      durationMs: 221000,
      creator: this.creators[7]!,
    },
    {
      id: "track-north-loop",
      title: "环线以北",
      description: "锋利鼓组和直给表达构成的中文说唱样例。",
      lyrics: "[主歌]\n列车穿过旧城区的天线\n我把故事写在每次转弯\n\n[副歌]\n我们在环线以北发声\n让每一句都落地生根",
      genre: "说唱",
      tags: ["锋利", "男声", "AI 生成", "现场感"],
      playCount: 102760,
      likeCount: 9840,
      commentCount: 139,
      isAiGenerated: true,
      publishedAt: "2026-06-16T20:50:00.000Z",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
      durationMs: 193000,
      creator: this.creators[8]!,
    },
    {
      id: "track-wind-stop",
      title: "风经过站口",
      description: "温暖木吉他和口琴色彩的民谣作品。",
      lyrics: "[主歌]\n晚风吹过旧站台的指针\n有人把告别唱得很轻\n\n[副歌]\n等风经过站口的时候\n你会听见心事慢慢变晴",
      genre: "民谣",
      tags: ["温暖", "女声", "AI 生成", "旅行"],
      playCount: 97410,
      likeCount: 9210,
      commentCount: 127,
      isAiGenerated: true,
      publishedAt: "2026-06-16T09:10:00.000Z",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
      durationMs: 207000,
      creator: this.creators[9]!,
    },
  ];

  private readonly playlists: PlaylistSeed[] = [
    {
      id: "editor-picks",
      title: "编辑精选",
      owner: { id: "editorial", displayName: "声成编辑部" },
      trackIds: [
        "track-city-afterglow",
        "track-moon-return",
        "track-blue-dawn",
        "track-neon-pulse",
        "track-rain-study",
        "track-white-oak",
        "track-mountain-prelude",
        "track-stargate-battle",
      ],
    },
    {
      id: "midnight-rnb",
      title: "午夜律动",
      owner: { id: "editorial", displayName: "声成编辑部" },
      trackIds: ["track-blue-dawn", "track-city-afterglow", "track-neon-pulse", "track-wind-stop"],
    },
    {
      id: "focus-lofi",
      title: "专注工作流",
      owner: { id: "editorial", displayName: "声成编辑部" },
      trackIds: ["track-rain-study", "track-white-oak", "track-mountain-prelude", "track-wind-stop"],
    },
    {
      id: "cinematic-journey",
      title: "画面感配乐",
      owner: { id: "editorial", displayName: "声成编辑部" },
      trackIds: ["track-mountain-prelude", "track-stargate-battle", "track-white-oak", "track-moon-return"],
    },
  ];

  getTracks() {
    return this.tracks.slice();
  }

  getTrack(id: string) {
    return this.tracks.find((track) => track.id === id) ?? null;
  }

  getTracksByCreator(creatorId: string) {
    const items = this.tracks.filter((track) => track.creator.id === creatorId);
    return { items, total: items.length };
  }

  listPublicPlaylists() {
    return this.playlists.map((playlist) => this.materializePlaylist(playlist));
  }

  getPlaylist(id: string) {
    const playlist = this.playlists.find((item) => item.id === id);
    return playlist ? this.materializePlaylist(playlist) : null;
  }

  getHotChart(limit = 50) {
    return this.tracks
      .slice()
      .sort((a, b) => b.playCount + b.likeCount * 2 - (a.playCount + a.likeCount * 2))
      .slice(0, limit)
      .map((track, index) => ({
        ...track,
        rank: index + 1,
        score: track.playCount + track.likeCount * 2,
        creator: { id: track.creator.id, displayName: track.creator.displayName, avatarKey: null },
      }));
  }

  getNewChart(limit = 50) {
    return this.tracks
      .slice()
      .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
      .slice(0, limit)
      .map((track, index) => ({
        ...track,
        rank: index + 1,
        score: limit - index,
        creator: { id: track.creator.id, displayName: track.creator.displayName, avatarKey: null },
      }));
  }

  getGenreChart(genre: string, limit = 30) {
    return this.tracks
      .filter((track) => track.genre === genre)
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, limit)
      .map((track, index) => ({
        ...track,
        rank: index + 1,
        score: track.playCount,
        creator: { id: track.creator.id, displayName: track.creator.displayName, avatarKey: null },
      }));
  }

  getCreatorChart(limit = 20) {
    return this.creators
      .map((creator) => {
        const items = this.tracks.filter((track) => track.creator.id === creator.id);
        const playCount = items.reduce((sum, item) => sum + item.playCount, 0);
        const likeCount = items.reduce((sum, item) => sum + item.likeCount, 0);
        return {
          rank: 0,
          creatorId: creator.id,
          creator: { id: creator.id, displayName: creator.displayName, avatarKey: null },
          trackCount: items.length,
          playCount,
          likeCount,
          score: playCount + likeCount * 2,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }

  search(query: string) {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return this.getTracks();
    return this.tracks.filter((track) => {
      const haystack = [track.title, track.description, track.genre, track.creator.displayName, ...track.tags]
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }

  getComments(trackId: string) {
    return {
      items: [
        {
          id: `${trackId}-comment-1`,
          content: "这首歌的情绪推进很完整，副歌很抓耳。",
          createdAt: new Date("2026-06-20T12:00:00.000Z").toISOString(),
          user: { id: "listener-a", displayName: "夜航电台", avatarKey: null },
        },
        {
          id: `${trackId}-comment-2`,
          content: "适合直接加入晚间循环歌单，编曲层次很舒服。",
          createdAt: new Date("2026-06-20T09:30:00.000Z").toISOString(),
          user: { id: "listener-b", displayName: "山海听风", avatarKey: null },
        },
      ],
      total: 2,
    };
  }

  private materializePlaylist(playlist: PlaylistSeed) {
    return {
      id: playlist.id,
      title: playlist.title,
      owner: playlist.owner,
      tracks: playlist.trackIds
        .map((trackId) => this.getTrack(trackId))
        .filter((track): track is Track => Boolean(track))
        .map((track) => ({
          track: {
            ...track,
            creator: { id: track.creator.id, displayName: track.creator.displayName, avatarKey: null },
            asset: {
              id: `asset-${track.id}`,
              storageKey: track.audioUrl,
              streamKey: track.audioUrl,
              durationMs: track.durationMs,
              format: "mp3",
            },
          },
        })),
    };
  }
}
