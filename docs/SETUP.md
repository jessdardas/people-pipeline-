# Setup: from GitHub to a running web app

**GitHub** keeps the code and every change ever made to it (you can always go back).
**Google Apps Script** runs the app. You edit on GitHub, then put the code into Apps Script and publish a new version.

```
edit code (GitHub / Claude)  ──►  copy or "clasp push" to Apps Script  ──►  Deploy → new version  ──►  users see it
```

Your web app URL **stays the same** as long as you update the *existing* deployment (step 3 below).

---

## Option A: copy and paste (nothing to install)

Good for small edits.

1. Open your Apps Script project (script.google.com → *People Pipeline*).
2. For every file in [`src/`](../src), make a file with the **same name** in Apps Script:
   - `.gs` files: click **+** → **Script**, type the name **without** `.gs` (e.g. `XlsxReader`).
   - `.html` files: click **+** → **HTML**, type the name **without** `.html` (e.g. `css_base`, `js_config`).
   - Open the file on GitHub, click the **Copy raw file** button (two squares icon), paste it into Apps Script, replacing everything.
   - The first time you do this, create all the files. After that, only paste the files you changed.
3. Publish: **Deploy → Manage deployments →** pencil icon on your deployment → **Version: New version → Deploy**.
   To try it first, use **Deploy → Test deployments**. That link always runs the latest saved code, and only you can open it.

## Option B: `clasp` (recommended once you're comfortable)

`clasp` is Google's command-line tool: one command sends every file to Apps Script.

**One time only**

1. Install [Node.js](https://nodejs.org) (LTS).
2. In a terminal:
   ```bash
   npm install -g @google/clasp
   clasp login                     # opens the browser, log in with your Google account
   ```
3. Turn on the Apps Script API: <https://script.google.com/home/usersettings> → **Google Apps Script API: On**.
4. Get the code:
   ```bash
   git clone https://github.com/jessdardas/people-pipeline-.git
   cd people-pipeline-
   cp .clasp.json.example .clasp.json
   ```
5. In Apps Script: **Project Settings** (gear icon) → copy the **Script ID** → paste it into `.clasp.json` instead of `PASTE-YOUR-SCRIPT-ID-HERE`.
6. Still in Project Settings, tick **Show "appsscript.json" manifest file in editor**. Open that file and copy its contents into `src/appsscript.json`, so your time zone and settings are kept.

**Every time you change something**

```bash
git pull          # get the latest code from GitHub
clasp push        # send all files in src/ to Apps Script
```

Then publish as in Option A step 3 (**Deploy → Manage deployments → edit → New version**).

> `clasp push` makes the Apps Script project **exactly like `src/`**. Files that exist only in Apps Script are deleted. The first time, the old single `Index.html` is replaced by the new small files; that is expected.

---

## Editing the code

- **On GitHub**: open a file → pencil icon (**Edit**) → change → **Commit changes**.
- **With Claude**: ask for the change in a Claude Code session on this repository. Claude commits it to a branch and you merge the pull request.
- **Check your change** with *Deploy → Test deployments* before publishing a new version.
- **Something broke?** Every change is in the GitHub history (**Commits**). You can see exactly what changed and go back.

## Good to know

- This repository is **public**: anyone can read the code. There are no passwords in it, and the Drive file itself stays private (only people you shared it with can open it). If you'd rather keep the code private, go to **Settings → General → Danger Zone → Change visibility** on GitHub.
- The web app runs as whoever it is deployed as (**Execute as** in the deployment settings). That person needs access to the Drive file.
