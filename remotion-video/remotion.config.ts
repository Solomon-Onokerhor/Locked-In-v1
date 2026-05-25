/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { enableTailwind } from '@remotion/tailwind-v4';
import path from "path";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

Config.overrideWebpackConfig((currentConfiguration) => {
  const config = enableTailwind(currentConfiguration);
  
  if (!config.resolve) config.resolve = {};
  if (!config.resolve.alias) config.resolve.alias = {};

  config.resolve.alias = {
    ...config.resolve.alias,
    // @/ aliases — specific mocks first, then fallback to real src
    "@/lib/supabase": path.resolve(__dirname, "src/mocks/supabaseMock.ts"),
    "@/components/AuthProvider": path.resolve(__dirname, "src/mocks/AuthProviderMock.tsx"),
    "@/lib/SoloTimerContext": path.resolve(__dirname, "src/mocks/SoloTimerContextMock.tsx"),
    "@/components/Sidebar": path.resolve(__dirname, "src/mocks/SidebarMock.tsx"),
    "@/components/TimerContext": path.resolve(__dirname, "src/mocks/SoloTimerContextMock.tsx"),
    // Next.js stubs
    "next/navigation": path.resolve(__dirname, "src/mocks/nextNavigation.ts"),
    "next/link": path.resolve(__dirname, "src/mocks/nextLink.tsx"),
    "next/image": path.resolve(__dirname, "src/mocks/nextImage.tsx"),
    // Third-party stubs
    "canvas-confetti": path.resolve(__dirname, "src/mocks/canvasConfettiMock.ts"),
    // Fallback @ → real src
    "@": path.resolve(__dirname, "../src"),
  };

  return config;
});
