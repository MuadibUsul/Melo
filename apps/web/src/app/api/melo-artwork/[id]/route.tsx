import { ImageResponse } from "next/og";

export const runtime = "edge";

const palettes = [
  ["#16181d", "#e9c86f", "#27e0a7", "#3858ff"],
  ["#101216", "#ff6f91", "#e9c86f", "#5de0e6"],
  ["#0b0f14", "#7bdff2", "#b2f7ef", "#f7d6e0"],
  ["#140d18", "#f4a261", "#e76f51", "#2a9d8f"],
  ["#08110f", "#27e0a7", "#d6fff6", "#577590"],
  ["#101016", "#cdb4db", "#ffc8dd", "#a2d2ff"],
];

function hash(input: string) {
  let value = 0;
  for (let index = 0; index < input.length; index += 1) {
    value = (value * 31 + input.charCodeAt(index)) >>> 0;
  }
  return value;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const seed = hash(id);
  const palette = palettes[seed % palettes.length]!;
  const angle = 110 + (seed % 90);
  const bars = Array.from({ length: 18 }, (_, index) => ({
    left: 58 + index * 30,
    height: 64 + ((seed >> (index % 12)) % 118),
    opacity: 0.24 + (index % 4) * 0.08,
  }));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(${angle}deg, ${palette[0]} 0%, ${palette[1]} 42%, ${palette[3]} 100%)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 28% 24%, rgba(255,255,255,0.32), transparent 24%), radial-gradient(circle at 76% 68%, rgba(0,0,0,0.34), transparent 30%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 74,
            top: 74,
            width: 492,
            height: 492,
            borderRadius: 48,
            border: "1px solid rgba(255,255,255,0.28)",
            background: "rgba(0,0,0,0.18)",
            boxShadow: "0 38px 120px rgba(0,0,0,0.38)",
          }}
        />
        {bars.map((bar, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              left: bar.left,
              bottom: 118,
              width: 14,
              height: bar.height,
              borderRadius: 999,
              background: index % 3 === 0 ? palette[2] : "rgba(255,255,255,0.82)",
              opacity: bar.opacity,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            right: 72,
            top: 82,
            width: 118,
            height: 118,
            borderRadius: 999,
            border: "18px solid rgba(255,255,255,0.30)",
            boxShadow: `0 0 0 22px ${palette[2]}44`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 82,
            bottom: 72,
            width: 210,
            height: 16,
            borderRadius: 999,
            background: "rgba(255,255,255,0.62)",
          }}
        />
      </div>
    ),
    {
      width: 640,
      height: 640,
    },
  );
}
