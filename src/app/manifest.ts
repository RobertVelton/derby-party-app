import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Velton Derby Party",
    short_name: "Derby Party",
    description: "Live Kentucky Derby odds dashboard.",
    start_url: "/",
    display: "standalone",
    orientation: "landscape",
    background_color: "#0d0805",
    theme_color: "#0d0805",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
