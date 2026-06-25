name: check-trophy-mirrors

on:
  schedule:
    - cron: "0 */6 * * *"   # checks every 6 hours
  workflow_dispatch:          # lets you trigger it manually from the Actions tab

permissions:
  contents: write

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Check trophy mirrors and update README
        run: node scripts/check-trophy-mirrors.js

      - name: Commit changes if anything updated
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add README.md
          git diff --staged --quiet || git commit -m "🔄 switch trophy mirror if needed [skip ci]"
          git push