import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FFC627",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#8C1D40",
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: "-0.02em",
        }}
      >
        AI
      </div>
    ),
    { ...size }
  );
}
