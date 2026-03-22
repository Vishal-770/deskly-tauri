import fs from "node:fs";
import path from "node:path";

function readArg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  return process.env[name.toUpperCase()] || fallback;
}

function findFirstByRegex(files, regex) {
  return files.find((file) => regex.test(file)) || null;
}

function getAllFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function readSig(sigPath) {
  return fs.readFileSync(sigPath, "utf-8").trim();
}

const assetsDir = path.resolve(readArg("assetsDir", "release-assets"));
const repository = readArg("repository", process.env.GITHUB_REPOSITORY || "");
const tag = readArg("tag", process.env.GITHUB_REF_NAME || "");
const version = readArg("version", tag.replace(/^v/, ""));
const notes = readArg("notes", `Release ${tag}`);
const pubDate = readArg("pubDate", new Date().toISOString());

if (!fs.existsSync(assetsDir)) {
  throw new Error(`Assets directory not found: ${assetsDir}`);
}

if (!repository || !tag || !version) {
  throw new Error(
    "Missing required metadata. Provide --repository, --tag and --version.",
  );
}

const allFiles = getAllFiles(assetsDir);
const basenames = allFiles.map((file) => path.basename(file));

const windowsAsset =
  findFirstByRegex(basenames, /\.msi$/i) ||
  findFirstByRegex(basenames, /setup\.exe$/i) ||
  findFirstByRegex(basenames, /\.exe$/i);
const linuxAsset = findFirstByRegex(basenames, /\.AppImage$/i);
const macAsset = findFirstByRegex(basenames, /\.app\.tar\.gz$/i);

const platforms = {};

function addPlatform(key, assetName) {
  if (!assetName) {
    return;
  }
  const sigName = `${assetName}.sig`;
  const sigPath = allFiles.find((file) => path.basename(file) === sigName);
  if (!sigPath) {
    throw new Error(
      `Missing signature file for ${assetName}. Expected ${sigName}.`,
    );
  }

  platforms[key] = {
    signature: readSig(sigPath),
    url: `https://github.com/${repository}/releases/download/${tag}/${assetName}`,
  };
}

addPlatform("windows-x86_64", windowsAsset);
addPlatform("linux-x86_64", linuxAsset);
addPlatform("darwin-x86_64", macAsset);

if (Object.keys(platforms).length === 0) {
  throw new Error(
    "No updater assets found. Ensure .msi/.exe/.AppImage/.app.tar.gz files are present.",
  );
}

const latestJson = {
  version,
  notes,
  pub_date: pubDate,
  platforms,
};

const outputPath = path.join(assetsDir, "latest.json");
fs.writeFileSync(
  outputPath,
  `${JSON.stringify(latestJson, null, 2)}\n`,
  "utf-8",
);
console.log(`Generated ${outputPath}`);
