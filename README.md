# Passync

A pure static web application to import, manage, and export passwords from multiple sources — all in your browser. No backend, no database, no data leaves your machine.

**Hosted at:** `https://windafort.github.io/passync/`

---

## Features

- **Import passwords** from Bitwarden, Chrome, Edge, Opera, Firefox, and Safari
- **View & search** — filter by provider, search across all fields
- **Edit & delete** — modify any entry, remove unwanted ones
- **Copy passwords** to clipboard with one click
- **Remove duplicates** — detects entries with matching URL, username, and password (trailing slashes and case differences are normalized)
- **Export** to any supported format for re-import back into the original platform
- **Encrypted persistence** — encrypt your vault with a passphrase and store it in localStorage (AES‑256‑GCM, Web Crypto API). Unlock on every visit.
- **Lock button** — wipe memory instantly, leaving only ciphertext in storage.
- **Dark mode** — toggle persisted in browser storage
- **100 % client-side** — your data never leaves your browser

---

## Supported Import / Export Formats

| Source | Import Format | Export Format |
|--------|---------------|---------------|
| Bitwarden | `.json` and `.csv` (plaintext) | `.json` or `.csv` |
| Chrome / Edge / Opera | `.csv` | `.csv` |
| Firefox | `.csv` (from `about:logins`) | `.csv` |
| Safari / macOS Passwords | `.csv` | `.csv` |

> Chrome, Edge, and Opera share the same Chromium CSV format and are treated as one provider (`chromium`).

---

## Quick Start

### Online (via GitHub Pages)

1. Fork or clone this repo.
2. Enable **GitHub Pages** in your repo Settings → Pages → source: `main` branch `/`.
3. Open `https://windafort.github.io/passync/` in a browser.
4. Drag your exported password files onto the import area and start managing.

### Local Development

Because the app uses ES modules (`type="module"`), it must be served via HTTP — it will **not** work by opening `index.html` directly from the filesystem (`file://`).

```bash
# With Python
python3 -m http.server 8080

# With Node.js
npx serve .
```

Then open `http://localhost:8080` in your browser.

---

## Usage

### Import

1. Click the import area or drag & drop `.csv` / `.json` files onto it.
2. The app automatically detects the source format (Bitwarden JSON/CSV, Chromium CSV, Firefox CSV, Safari CSV). If detection fails, a prompt lets you choose manually.
3. Imported entries are added to the in-memory vault. Nothing is stored to disk until you explicitly save.

### Encrypt / Save Vault

1. After importing entries, click **Encrypt** in the header.
2. Enter a passphrase (and confirm it) — **you will need this passphrase every time you reopen the app**.
3. Your vault is encrypted with AES-256-GCM and stored in `localStorage`. The passphrase is never stored.

### Unlock on Return

When you come back to the app, you'll see the lock screen. Enter your passphrase to decrypt and access your vault.

### Lock

Click **Lock** at any time to wipe the in-memory vault and return to the lock screen. Only the encrypted ciphertext remains in storage.

### View & Search

- Use the **search bar** to filter entries by name, URL, username, notes, or folder.
- Use the **provider filter** dropdown to show only entries from a specific source.
- Click any column header to sort ascending/descending.

### Edit

Click the pencil icon (✏️) on any row to open the edit modal. You can change the provider, folder, name, URL, username, password, notes, and TOTP seed.

### Delete

Click the trash icon (🗑️) and confirm to remove an entry.

### Copy Password

Click the copy icon (📋) to copy the password to your clipboard.

### Remove Duplicates

Click **Remove duplicates** to find entries with matching URL, username, and password. A modal shows what will be removed before you confirm. Trailing slashes in URLs and case differences are normalized.

### Export

Click **Export** and choose the target format. All current entries are exported as a single file compatible with the chosen platform's import function.

### Clear All

Click **Clear all** to remove every entry from memory. If an encrypted vault exists, it is also removed from storage.

---

## Security & Privacy

- **All sensitive data stays in memory only** — passwords are never persisted to disk in plaintext.
- **Optional encrypted persistence** — use the **Encrypt** button to encrypt your vault with a passphrase (AES-256-GCM + PBKDF2 via the Web Crypto API) and store only ciphertext in `localStorage`.
- **Unlock on every visit** — if you saved an encrypted vault, you must enter your passphrase each time you load the app.
- **Lock button** — clears all entries from memory and shows the lock screen, leaving only ciphertext in storage.
- **"Start Fresh"** — discards the encrypted vault entirely.
- **No analytics, no tracking, no third-party requests.**
- The app is served over HTTPS when hosted on GitHub Pages, which is required for the Clipboard API to work.

---

## Branching Strategy

The following branching model is recommended for this repository:

```
main ──────────────────────────────● (stable, deployed to Pages)
  │
  ├── feature/import-android  ──● ──┘
  ├── feature/csv-escaping    ──● ──┘
  ├── fix/search-encoding     ──● ──┘
  └── hotfix/export-null-url  ──● ──┘
```

### Branches

| Branch | Purpose | Source | Deployable |
|--------|---------|--------|------------|
| `main` | Production-ready code. Always represents the latest stable version. | — | Yes (GitHub Pages) |
| `feature/*` | New features (e.g., `feature/import-android`, `feature/edit-bulk`) | `main` | No |
| `fix/*` | Bug fixes (e.g., `fix/csv-special-chars`) | `main` | No |
| `hotfix/*` | Urgent production fixes that bypass the normal flow | `main` | Yes (after merge) |
| `release/v*` | Pre-release stabilization (optional) | `main` | Yes (after merge to `main`) |

### Workflow

1. **Create a feature/fix branch** from `main`:
   ```bash
   git checkout -b feature/my-feature main
   ```
2. **Commit your changes** with clear, descriptive messages.
3. **Open a Pull Request** against `main`.
4. After review, **merge** the PR (squash or merge commit).
5. Delete the feature branch.

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>

[optional body]
```

Examples:

- `feat: add Android password import support`
- `fix: handle trailing newline in Firefox CSV`
- `docs: update supported format table`
- `refactor: unify CSV parser for all providers`

---

## Project Structure

```
passync/
├── index.html           ← Entry point (UI markup)
├── css/
│   └── style.css        ← All styling (light/dark theme)
├── js/
│   ├── app.js           ← Bootstrap wiring
│   ├── data.js          ← Data model + localStorage persistence
│   ├── crypto.js        ← AES-256-GCM encryption (Web Crypto API)
│   ├── import.js        ← CSV parser + provider-specific parsers
│   ├── export.js        ← Provider-specific exporters
│   └── ui.js            ← DOM rendering, events, modals
├── test-data/           ← Sample export files for manual testing
├── .gitignore
├── LICENSE
└── README.md
```

---

## License

MIT
