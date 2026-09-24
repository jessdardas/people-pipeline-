/**
 * PEOPLE PIPELINE – Google Apps Script Web App
 * Source of truth: the "people pipeline.xlsx" query export in Google Drive.
 * Every sheet in the file is read by its COLUMN NAMES (sheet names / order don't matter):
 *   - the accounts sheet  = the sheet that has "accountid" + "name" + "classification"      (Query1)
 *   - one-row-per-account sheets are merged into the account                                 (Query2 …)
 *   - many-rows-per-account sheets are attached to the account as lists                      (Query3 social, Query4 projects …)
 * All sheets are linked on "accountid". New columns / new sheets added to the file show up automatically
 * in the account details. READ ONLY: the app never writes, edits or deletes anything – it only reads the .xlsx on every load.
 */

const SOURCE_FILE_ID = '1dhU0tMGZQL3n8Jfn6LOSfkcsksnrYRKt'; // "people pipeline.xlsx" in Drive (fallback)
const SOURCE_FILE_NAME = 'people pipeline.xlsx'; // newest Drive file with this name is used

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('People Pipeline')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Pastes another project file into the page: <?!= include('css_base'); ?> in Index.html. */
function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

function hKey_(s) {
  return String(s == null ? '' : s)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** The newest non-trashed "people pipeline.xlsx" in Drive (so re-uploads are picked up), else the fixed file id. */
function sourceFile_() {
  let best = null;
  const it = DriveApp.getFilesByName(SOURCE_FILE_NAME);
  while (it.hasNext()) {
    const f = it.next();
    if (!f.isTrashed() && (!best || f.getLastUpdated() > best.getLastUpdated())) best = f;
  }
  return best || DriveApp.getFileById(SOURCE_FILE_ID);
}

/** Cheap check used by the page to see if the file changed (auto refresh). */
function getStamp() {
  const f = sourceFile_();
  return { id: f.getId(), updated: f.getLastUpdated().getTime() };
}

/** Everything the web app needs, read fresh from the Drive file on every call. */
function getData() {
  const file = sourceFile_();
  const sheets = readXlsx_(file.getId()).filter(function (s) {
    return s.rows.length > 0 && s.rows[0].length;
  });
  const hasCols = function (s, cols) {
    const hk = s.rows[0].map(hKey_);
    return cols.every(function (c) {
      return hk.indexOf(hKey_(c)) >= 0;
    });
  };

  // 1. the accounts sheet
  let master =
    sheets.filter(function (s) {
      return hasCols(s, ['accountid', 'name', 'classification']);
    })[0] ||
    sheets.filter(function (s) {
      return hasCols(s, ['accountid', 'name']);
    })[0];
  if (!master) throw new Error('No sheet with the columns "accountid" and "name" found in ' + file.getName());

  const mk = master.rows[0].map(hKey_).indexOf('accountid');
  const accIndex = {};
  const mRows = [];
  for (let i = 1; i < master.rows.length; i++) {
    const r = master.rows[i];
    const id = String(r[mk] || '')
      .trim()
      .toUpperCase();
    if (!id || accIndex[id] !== undefined) continue;
    accIndex[id] = mRows.length;
    mRows.push(r);
  }

  const out = [packSheet_(master.name, master.rows[0], mRows, null, 'accounts')];

  // 2. every other sheet that has an accountid column
  sheets.forEach(function (s) {
    if (s === master) return;
    const hk = s.rows[0].map(hKey_);
    const k = hk.indexOf('accountid');
    if (k < 0) return;
    const rows = [],
      link = [],
      seen = {},
      cnt = {};
    let multi = false;
    for (let i = 1; i < s.rows.length; i++) {
      const r = s.rows[i];
      const id = String(r[k] || '')
        .trim()
        .toUpperCase();
      const a = accIndex[id];
      if (a === undefined) continue;
      if (
        !r.some(function (v, j) {
          return j !== k && v !== '' && v !== null && v !== 'NULL';
        })
      )
        continue; // empty row (no data besides accountid)
      const sig = r.join('\u0001'); // drop exact duplicate rows (joins in the query)
      if (seen[sig]) continue;
      seen[sig] = 1;
      cnt[a] = (cnt[a] || 0) + 1;
      if (cnt[a] > 1) multi = true;
      rows.push(r);
      link.push(a);
    }
    // one row per account → merged into the account; several → attached as a list
    const role =
      hk.indexOf('opportunityid') >= 0
        ? 'projects'
        : hk.some(function (h) {
              return /platform/.test(h);
            })
          ? 'social'
          : multi
            ? 'list'
            : 'merge';
    const drop = function (r) {
      return r.filter(function (v, j) {
        return j !== k;
      });
    }; // accountid travels as "link"
    out.push(packSheet_(s.name, drop(s.rows[0]), rows.map(drop), link, role));
  });

  return {
    source: {
      name: file.getName(),
      id: file.getId(),
      updated: file.getLastUpdated().getTime(),
      loaded: Date.now()
    },
    accounts: mRows.length,
    sheets: out
  };
}

/** Column-oriented, dictionary-encoded sheet (keeps the payload small). */
function packSheet_(name, header, rows, link, role) {
  const cols = header.map(function (h, j) {
    const vals = new Array(rows.length);
    let isNum = true;
    for (let i = 0; i < rows.length; i++) {
      let v = rows[i][j];
      if (v === undefined || v === '' || v === 'NULL' || v === 'null') v = null;
      if (typeof v === 'number') v = Math.round(v * 100000) / 100000;
      else if (v !== null) {
        isNum = false;
        v = String(v);
      }
      vals[i] = v;
    }
    const col = { h: String(h).trim() };
    if (!isNum) {
      for (let i = 0; i < vals.length; i++) if (vals[i] !== null) vals[i] = String(vals[i]); // text column: all text
      const dict = [],
        di = {};
      vals.forEach(function (v) {
        if (v !== null && di[v] === undefined) {
          di[v] = dict.length;
          dict.push(v);
        }
      });
      if (dict.length < rows.length * 0.5) {
        col.d = dict;
        col.v = vals.map(function (v) {
          return v === null ? -1 : di[v];
        });
        return col;
      }
    }
    col.v = vals;
    return col;
  });
  return { name: name, role: role, n: rows.length, link: link, cols: cols };
}
