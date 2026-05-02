import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d0805",
          backgroundImage:
            "radial-gradient(circle at 50% 40%, rgba(200,160,75,0.25), transparent 70%)",
          fontSize: 130,
          lineHeight: 1,
        }}
      >
        🌹
      </div>
    ),
    {
      ...size,
      emoji: "twemoji",
    },
  );
}
