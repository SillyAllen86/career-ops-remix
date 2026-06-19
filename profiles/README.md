# Profile Packs

`career-ops` operates on fixed canonical files:

- `cv.md`
- `config/profile.yml`
- `article-digest.md`
- `portals.yml`

That works well for one active candidate at a time, but it is awkward if you want to reuse the same workspace for multiple people.

This `profiles/` directory solves that by storing one pack per candidate and then activating that pack into the canonical file locations when needed.

## Recommended workflow

1. Save your current profile pack:

```bash
node scripts/profile-manager.mjs capture pravin
```

2. Create a new scaffold for another person:

```bash
node scripts/profile-manager.mjs init sister
```

3. Fill in:

- `profiles/sister/cv.md`
- `profiles/sister/profile.yml`

4. Switch the workspace to that candidate:

```bash
node scripts/profile-manager.mjs activate sister
```

5. Switch back later:

```bash
node scripts/profile-manager.mjs activate pravin
```

## Commands

```bash
node scripts/profile-manager.mjs list
node scripts/profile-manager.mjs init <profile-id>
node scripts/profile-manager.mjs capture <profile-id> [--force]
node scripts/profile-manager.mjs activate <profile-id>
```

## Notes

- `activate` creates a timestamped backup under `.profile-backups/` before replacing canonical files.
- `capture` copies the current canonical files into `profiles/<profile-id>/`.
- Optional files such as `article-digest.md` and `portals.yml` are included when present.
- Keep profile ids simple, for example `pravin`, `sister`, or `anita-sail`.
