const http = require("http");

const port = Number(process.env.MINIMAX_SMOKE_PORT || 9010);
const audio = Buffer.from("MELO-WORKER-MINIMAX-SMOKE").toString("hex");

function json(res, body) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url?.startsWith("/v1/music_generation")) {
    json(res, {
      trace_id: "trace-melo-worker-music-smoke",
      base_resp: { status_code: 0, status_msg: "ok" },
      data: { audio },
      extra_info: {
        music_duration: 123000,
        music_sample_rate: 44100,
        bitrate: 256000,
        music_size: audio.length / 2,
      },
    });
    return;
  }

  if (req.method === "POST" && req.url?.startsWith("/v1/t2a_v2")) {
    json(res, {
      trace_id: "trace-melo-worker-tts-smoke",
      base_resp: { status_code: 0, status_msg: "ok" },
      data: { audio },
    });
    return;
  }

  if (req.method === "POST" && req.url?.startsWith("/v1/lyrics_generation")) {
    json(res, {
      trace_id: "trace-melo-worker-lyrics-smoke",
      base_resp: { status_code: 0, status_msg: "ok" },
      song_title: "Melo Smoke",
      lyrics: "[Verse]\nMelo turns a line into a song\n[Chorus]\nThe queue keeps moving all night long",
      style_tags: "pop, electronic",
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(port, "127.0.0.1", () => {
  console.log(`minimax-smoke-server listening on http://127.0.0.1:${port}`);
});
