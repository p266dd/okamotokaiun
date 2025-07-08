import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Okamoto Kaiun",
    short_name: "OkamotoKaiun",
    id: "okamoto-kaiun",
    description: "Internal system for Okamoto Kaiun.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f5f6",
    theme_color: "#01499c",
    orientation: "portrait",
    lang: "ja-JP",
    categories: ["Office", "Utilities"],
    icons: [
      {
        src: "/web-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/web-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    screenshots: [
      {
        src: "/screenshot.png",
        sizes: "817x1344",
        type: "image/png",
        form_factor: "narrow",
        label: "Okamoto Kaiun",
      },
    ],
  };
}
