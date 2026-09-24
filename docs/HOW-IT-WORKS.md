# How it works

```
Google Drive                 Apps Script (server)                   Browser (the page)
people pipeline.xlsx  ──►  Code.gs + XlsxReader.gs  ── getData() ──►  js_*.html files
                           read, link on accountid,                  build accounts, filter,
                           compress                                  draw maps / table / details
```

## 1. The server (`Code.gs`, `XlsxReader.gs`)

1. **`doGet()`** runs when someone opens the web app URL. It builds `Index.html`; every `<?!= include('...') ?>` line pastes in one of the css/js files.
2. **`sourceFile_()`** finds the newest non-trashed Drive file called `people pipeline.xlsx`. If there is none, it uses the fixed `SOURCE_FILE_ID`. This means re-uploading the file is enough; no code change needed.
3. **`readXlsx_()`** reads the `.xlsx` without any add-on: an `.xlsx` is a zip file, so it unzips it and reads the XML of every sheet into rows.
4. **`getData()`** works out what each sheet is **by its column names** (sheet names and order don't matter):
   - The sheet with `accountid` + `name` + `classification` is the **accounts** sheet (one row per account; duplicates are dropped).
   - Every other sheet with an `accountid` column is linked to the accounts. Its role:
     - it has `opportunityid` → **projects**
     - it has a column with "platform" in the name → **social media**
     - otherwise, if an account has several rows → **list** ("Other linked rows")
     - otherwise (one row per account) → **merge**: its columns become extra account fields.
   - Empty rows and exact duplicate rows are skipped.
5. **`packSheet_()`** makes the data smaller before sending it: it stores it column by column, and text that repeats a lot (like "London") is stored once in a dictionary with numbers pointing to it.
6. **`getStamp()`** is a cheap check the page calls every 10 minutes to see if the Drive file changed.

## 2. The page (`js_*.html`)

**Start** (`js_main.html`): `load()` calls `getData()` on the server, then `build()` and `renderAll()`.

**Building accounts** (`js_data.html`, `build()`): for every account row it makes one object with easy fields: `name`, `cls` (classification), `category`, `su` (service unit), `phase`, `pipe`, `lastMeeting` (days ago), `postV` (Post-P1 value), `projects`, `social`… It also gives each account its **filter values** (`a.fv`), e.g. the value bucket "10k–25k".

**Filtering** (`js_filters.html`, `pass()`): an account is shown only if it matches the selected service units, pipelines, every filter in the panel and the social media filters.

**The 4 maps** (`js_maps.html`, `MAPS`): each map has
- `filter`: which accounts belong on it (e.g. classification = "current pipeline"),
- `rows` and `cols`: the matrix headings,
- `place(a)`: returns `[row, column]` for an account.

| Map | Accounts | Rows | Columns |
|---|---|---|---|
| 01 Current pipeline | classification "current pipeline" | last meeting (< 6 mo, 6–12 mo, 1–2 yrs, > 2 yrs, never) | latest project phase P0–P5 |
| 02 Past clients | classification "past client" | last meeting in 3-month steps | last project (0–6, 6–12, 12–18, 18+ months) |
| 03 No business | past demand, met in/out, contacted, not contacted | account category | classification |
| All accounts | everyone | account category | classification |

**Drawing** (`js_matrix.html`, `render()`): counts the accounts per cell and colours each cell darker the more accounts it holds. Clicking a number opens the **account table** (`js_table.html`) for that cell, which you can sort, filter per column, search and export.

**Details** (`js_details.html`, `openDetail()`): the side panel with the overview, projects, social media, and "More details", which lists **every other column in the file**, so new query columns appear there automatically.

**Search** (`js_search.html`): type 2+ letters, pick an account; `goTo()` switches to the right map, loosens only the filters that would hide it and highlights its cell in yellow.

**Export** (`js_export.html`): loads the SheetJS / jsPDF libraries only when you click Excel or PDF, then downloads the current table (Excel also gets a "Projects" and an "Info" sheet).

**Auto refresh** (`js_main.html`): every 10 minutes it asks `getStamp()`; if the file changed (or an hour passed) it reloads the data and keeps the open cell / account.

## Dates

The file stores dates as Excel numbers (days since 1900). `fmtXl()` turns them into readable dates. Dates on or before 1 Jan 2000 (`NEVER = 36600`) mean "never".
