# Release Checklist — v0.1.0

## Pre-Release

- [ ] All tests pass: `pnpm test`
- [ ] Lint passes: `pnpm lint`
- [ ] Type check passes: `pnpm typecheck`
- [ ] Build succeeds: `pnpm build`
- [ ] CLI works: `node dist/cli/index.js --help`
- [ ] test `inspect` on all 3 example projects
- [ ] test `generate --dry-run` on all 3 example projects
- [ ] test `generate` writes correct files
- [ ] test `generate --force` creates backups
- [ ] test `doctor` shows correct status
- [ ] README is up to date
- [ ] CHANGELOG has 0.1.0 entry
- [ ] Version in package.json is 0.1.0

## Publish

- [ ] `git init && git add -A && git commit -m "feat: initial MVP release v0.1.0"`
- [ ] Create GitHub repository
- [ ] `git remote add origin <repo-url>`
- [ ] `git push -u origin main`
- [ ] Verify CI passes on GitHub
- [ ] `npm login` (or `pnpm login`)
- [ ] `pnpm publish --access public`
- [ ] Verify `npx @adas/setup-my-startup --help` works
- [ ] Create GitHub Release with tag `v0.1.0`

## Post-Release

- [ ] Post on X (Twitter)
- [ ] Post on LinkedIn
- [ ] Post on Reddit (r/devops, r/webdev, r/selfhosted)
- [ ] Post on Hacker News (Show HN)
- [ ] Add topics to GitHub repo: `cli`, `devops`, `docker`, `startup`, `infrastructure`
- [ ] Enable GitHub Discussions
- [ ] Star your own repo (seriously, it helps with initial visibility)
