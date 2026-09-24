# People Pipeline

A Google Apps Script web app for PSLAB. It reads the **"people pipeline.xlsx"** export from Google Drive and shows every account on four "maps" (matrices), with filters, search, account details and Excel / PDF export.

The app is **read only**. It never changes the Drive file, it only reads it every time the page loads (and checks for a new version every 10 minutes).

> **Where does it run?** GitHub only *stores* the code and its history. The app itself runs on **Google Apps Script**, because it needs Google Drive. You edit the code here, then send it to Apps Script (see [docs/SETUP.md](docs/SETUP.md)).

## The files

Everything the app needs is in [`src/`](src). Each file is one piece of the app:

| File | What it does |
|---|---|
| **Server (runs at Google)** | |
| [`Code.gs`](src/Code.gs) | Opens the web page, finds the Drive file, links all sheets on `accountid` and sends the data to the page. **The Drive file name / id are at the top.** |
| [`XlsxReader.gs`](src/XlsxReader.gs) | Reads the `.xlsx` file (it is a zip of XML files) into rows. |
| [`appsscript.json`](src/appsscript.json) | Apps Script project settings (time zone, runtime). |
| **Page layout** | |
| [`Index.html`](src/Index.html) | The page skeleton: header, tabs, main area, side panel. Pulls in all files below. |
| **Styles (how it looks)** | |
| [`css_base.html`](src/css_base.html) | **Colours** and fonts. |
| [`css_header.html`](src/css_header.html) | Logo, search box, service unit buttons, pipeline menu, tabs, filter panel. |
| [`css_matrix.html`](src/css_matrix.html) | The main area and the coloured matrix. |
| [`css_table.html`](src/css_table.html) | The account table under the matrix. |
| [`css_drawer.html`](src/css_drawer.html) | The account details side panel, the toast message, mobile layout. |
| **Scripts (what it does)** | |
| [`js_config.html`](src/js_config.html) | **Settings you'll change most**: service units, groups, pipelines, phases, value buckets. |
| [`js_helpers.html`](src/js_helpers.html) | Small tools: formatting dates, money, labels. |
| [`js_data.html`](src/js_data.html) | Turns the server data into one object per account. |
| [`js_filters.html`](src/js_filters.html) | The filter list and the rule that decides if an account is shown. |
| [`js_maps.html`](src/js_maps.html) | **The 4 maps**: their rows, columns and where each account lands. |
| [`js_topbar.html`](src/js_topbar.html) | Refresh info, service unit buttons, pipeline menu, tabs. |
| [`js_filter_panel.html`](src/js_filter_panel.html) | The "Filters" button and its panel. |
| [`js_matrix.html`](src/js_matrix.html) | Draws the matrix. |
| [`js_table.html`](src/js_table.html) | The account table: sorting, column filters, "show more". |
| [`js_details.html`](src/js_details.html) | The account details side panel. |
| [`js_search.html`](src/js_search.html) | The search box and "show on map". |
| [`js_export.html`](src/js_export.html) | Excel and PDF export. |
| [`js_main.html`](src/js_main.html) | Loads the data, refresh and auto refresh. Starts the app, so it **must stay last** in `Index.html`. |

## Quick "where do I change…"

- **Add a service unit / change the button order** → `UNIT_ORDER` in `js_config.html`
- **Rename a pipeline or change its description** → `PIPES` in `js_config.html`
- **Change the rows or columns of a map** → `MAPS` in `js_maps.html`
- **Add a filter** → `FDEF` in `js_filters.html` (and the value in `a.fv` in `js_data.html`)
- **Add a column to the account table** → `TCOLS` in `js_table.html`
- **Change colours** → `:root` in `css_base.html`
- **Change the columns in the Excel / PDF export** → `expRecord` and `PDF_COLS` in `js_export.html`
- **Use another Drive file** → `SOURCE_FILE_NAME` / `SOURCE_FILE_ID` in `Code.gs`

## More

- [docs/SETUP.md](docs/SETUP.md): how to get the code from GitHub into Apps Script and publish it
- [docs/HOW-IT-WORKS.md](docs/HOW-IT-WORKS.md): how the code works, step by step
