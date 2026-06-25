// Checks each trophy mirror in order and writes the first healthy one into
// README.md between the START/END_SECTION:trophy markers. If a mirror is
// down or returning an error SVG, it's skipped in favor of the next one.
// Run by .github/workflows/check-trophy-mirrors.yml

const fs = require("fs");

const USERNAME = process.env.GITHUB_REPOSITORY_OWNER;
const README_PATH = "README.md";
const START = "<!--START_SECTION:trophy-->";
const END = "<!--END_SECTION:trophy-->";

// Ordered by preference — first one that returns a real trophy SVG wins.
// Add/remove/reorder mirrors here any time.
const MIRRORS = [
  "https://github-profile-trophy.vercel.app",
  "https://github-profile-trophy-fork-two.vercel.app",
  "https://github-profile-trophy-liard-delta.vercel.app",
  "https://github-profile-trophy-winning.vercel.app",
  "https://github-profile-trophy-kannan.vercel.app",
];

const QUERY = `username=${USERNAME}&theme=tokyonight&no-frame=true&row=1&column=6&margin-w=10`;

async function isHealthy(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return false;
    const text = await res.text();
    // A real trophy SVG is reasonably large and starts with an <svg> tag.
    // Error responses from these services tend to be tiny or mention
    // "wrong" / "error" / "not found" instead of rendering trophies.
    return (
      text.trim().startsWith("<svg") &&
      text.length > 1000 &&
      !/something went wrong|not found/i.test(text)
    );
  } catch {
    return false;
  }
}

async function main() {
  let working = null;

  for (const base of MIRRORS) {
    const url = `${base}/?${QUERY}`;
    console.log(`Checking ${base} ...`);
    if (await isHealthy(url)) {
      working = url;
      console.log(`✅ healthy: ${base}`);
      break;
    }
    console.log(`❌ down or erroring: ${base}`);
  }

  const readme = fs.readFileSync(README_PATH, "utf8");
  const startIdx = readme.indexOf(START);
  const endIdx = readme.indexOf(END);

  if (startIdx === -1 || endIdx === -1) {
    throw new Error(
      `Could not find ${START} / ${END} markers in ${README_PATH}`
    );
  }

  const block = working
    ? `\n<img src="${working}" width="100%"/>\n`
    : `\n_Trophy widget is temporarily unavailable — every mirror is down right now. Check back later._\n`;

  const newReadme =
    readme.slice(0, startIdx + START.length) +
    block +
    readme.slice(endIdx);

  fs.writeFileSync(README_PATH, newReadme);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});