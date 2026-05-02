import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Velton's Kentucky Derby Party — Live Odds";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d0805",
          backgroundImage:
            "radial-gradient(circle at 20% 15%, rgba(200,160,75,0.30), transparent 60%)",
          color: "#f7f2e7",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 30,
            fontSize: 200,
            lineHeight: 1,
            marginBottom: 40,
          }}
        >
          <span>🏇</span>
          <span>🌹</span>
        </div>
        <div
          style={{
            fontSize: 84,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            marginBottom: 16,
            lineHeight: 1,
            textAlign: "center",
          }}
        >
          Velton&apos;s Kentucky Derby Party
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#c8a04b",
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          Live Odds
        </div>
      </div>
    ),
    { ...size, emoji: "twemoji" },
  );
}
