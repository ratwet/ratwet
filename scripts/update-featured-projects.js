// Fetches the owner's top public, non-fork repos (by stars) and writes a
// markdown card table into README.md between the START/END_SECTION:projects
// markers. Run by .github/workflows/update-featured-projects.yml

const fs = require("fs");

const USERNAME = process.env.GITHUB_REPOSITORY_OWNER;
const TOKEN = process.env.GITHUB_TOKEN;
const TOP_N = 3; // <- change this number to feature more or fewer projects
const README_PATH = "README.md";
const START = "<!--START_SECTION:projects-->";
const END = "<!--END_SECTION:projects-->";

async function main() {
  const res = await fetch(
    `https://api.github.com/users/${USERNAME}/repos?type=public&per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "profile-readme-bot",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  let repos = await res.json();

  // Drop forks and the profile repo itself (e.g. ratwet/ratwet)
  repos = repos.filter(
    (r) => !r.fork && r.name.toLowerCase() !== USERNAME.toLowerCase()
  );

  // Rank by stars, then by most recently pushed
  repos.sort(
    (a, b) =>
      b.stargazers_count - a.stargazers_count ||
      new Date(b.pushed_at) - new Date(a.pushed_at)
  );

  const top = repos.slice(0, TOP_N);

  let section;
  if (top.length === 0) {
    section = "_No public repositories yet — check back soon!_";
  } else {
    const width = Math.floor(100 / top.length);
    const cards = top.map((r) => {
      const desc = (r.description || "No description provided.").replace(
        /\|/g,
        "\\|"
      );
      const lang = r.language || "—";
      return `<td width="${width}%" valign="top">\n\n**[${r.name}](${r.html_url})**\n\n${desc}\n\n\`${lang}\` &nbsp;·&nbsp; ⭐ ${r.stargazers_count}\n\n</td>`;
    });
    section = `<table>\n<tr>\n${cards.join("\n")}\n</tr>\n</table>`;
  }

  const readme = fs.readFileSync(README_PATH, "utf8");
  const startIdx = readme.indexOf(START);
  const endIdx = readme.indexOf(END);

  if (startIdx === -1 || endIdx === -1) {
    throw new Error(
      `Could not find ${START} / ${END} markers in ${README_PATH}`
    );
  }

  const newReadme =
    readme.slice(0, startIdx + START.length) +
    "\n" +
    section +
    "\n" +
    readme.slice(endIdx);

  fs.writeFileSync(README_PATH, newReadme);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});