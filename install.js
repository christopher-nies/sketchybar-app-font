import { execSync } from "node:child_process";
import { build, startMarker, endMarker } from "./build.js";
import fs from "node:fs";
import path from "node:path";
import os from "os";
import { pathToFileURL } from "node:url";

export function install(replaceInScriptPath, refreshSketchybar = true) {
  const { iconMapBashFn } = build();

  const platform = os.platform(); // 'darwin' for macOS, 'linux' for Linux

  let fontDestDir;

  if (platform === "darwin") {
    fontDestDir = path.join(process.env.HOME, "Library", "Fonts");
  } else if (platform === "linux") {
    fontDestDir = path.join(process.env.HOME, ".local", "share", "fonts");
  } else {
    throw new Error("Unsupported OS. This script supports only macOS and Linux.");
  }

  // Make sure the destination directory exists
  if (!fs.existsSync(fontDestDir)) {
    fs.mkdirSync(fontDestDir, { recursive: true });
  }

  const sourceFontPath = path.resolve("./dist/sketchybar-app-font.ttf");
  const destFontPath = path.join(fontDestDir, "sketchybar-app-font.ttf");

  fs.copyFileSync(sourceFontPath, destFontPath);

  if (replaceInScriptPath) {
    const pathToScript = path.resolve(replaceInScriptPath);
    const scriptContents = fs.readFileSync(pathToScript, "utf8");
    const startMarkerIndex = scriptContents.indexOf(startMarker);
    const endMarkerIndex = scriptContents.indexOf(endMarker);
    if (startMarkerIndex === -1 || endMarkerIndex === -1) {
      console.error(
        `Could not find ${startMarker} or ${endMarker} in ${pathToScript}`
      );
      process.exit(1);
    }
    const newScriptContents =
      scriptContents.slice(0, startMarkerIndex) +
      iconMapBashFn +
      scriptContents.slice(endMarkerIndex + endMarker.length);
    fs.writeFileSync(pathToScript, newScriptContents, "utf8");
  } else {
    fs.copyFileSync(
      "./dist/icon_map.sh",
      `${process.env.HOME}/.config/sketchybar/icon_map.sh`
    );
  }

  if (refreshSketchybar) {
    execSync("sketchybar --reload");
  }
}

// only execute if run directly (ESM)
// use url instead of __filename to support pnpm
if (import.meta.url === pathToFileURL(process.argv[1]).toString()) {
  install(process.argv[2]);
}
