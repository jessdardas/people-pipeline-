/* ---------- .xlsx reader (Drive file → rows), no extra services needed ---------- */
function readXlsx_(fileId) {
  const blob = DriveApp.getFileById(fileId).getBlob().setContentType('application/zip');
  const files = {};
  Utilities.unzip(blob).forEach(function (b) {
    files[b.getName()] = b;
  });
  const txt = function (n) {
    return files[n] ? files[n].getDataAsString('UTF-8') : '';
  };
  const dec = function (s) {
    return s
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, function (m, d) {
        return String.fromCharCode(+d);
      })
      .replace(/&amp;/g, '&');
  };
  const shared = [];
  const sst = txt('xl/sharedStrings.xml');
  let m;
  const siRe = /<si>([\s\S]*?)<\/si>/g;
  while ((m = siRe.exec(sst))) {
    let s = '',
      t;
    const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g;
    while ((t = tRe.exec(m[1]))) s += t[1];
    shared.push(dec(s));
  }
  const rels = {};
  const relRe = /<Relationship [^>]*?Id="([^"]+)"[^>]*?Target="([^"]+)"/g,
    relRe2 = /<Relationship [^>]*?Target="([^"]+)"[^>]*?Id="([^"]+)"/g;
  const rx = txt('xl/_rels/workbook.xml.rels');
  while ((m = relRe.exec(rx))) rels[m[1]] = m[2];
  while ((m = relRe2.exec(rx))) rels[m[2]] = m[1];
  const colNum = function (ref) {
    let n = 0;
    for (let i = 0; i < ref.length; i++) {
      const c = ref.charCodeAt(i);
      if (c < 65) break;
      n = n * 26 + c - 64;
    }
    return n - 1;
  };
  const out = [];
  const shRe = /<sheet [^>]*?name="([^"]+)"[^>]*?r:id="([^"]+)"/g;
  const wb = txt('xl/workbook.xml');
  while ((m = shRe.exec(wb))) {
    const path = rels[m[2]].replace(/^\/?(xl\/)?/, 'xl/');
    const xml = txt(path),
      rows = [];
    const cRe = /<c r="([A-Z]+)(\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let c;
    while ((c = cRe.exec(xml))) {
      const col = colNum(c[1]),
        row = +c[2] - 1,
        attrs = c[3],
        body = c[4] || '';
      const tm = attrs.match(/t="(\w+)"/),
        t = tm ? tm[1] : 'n';
      const vm = body.match(/<v>([\s\S]*?)<\/v>/);
      let val = '';
      if (t === 's') val = vm ? shared[+vm[1]] : '';
      else if (t === 'inlineStr') {
        const im = body.match(/<t[^>]*>([\s\S]*?)<\/t>/);
        val = im ? dec(im[1]) : '';
      } else if (vm) val = t === 'n' ? Number(vm[1]) : dec(vm[1]);
      (rows[row] = rows[row] || [])[col] = val;
    }
    const w = rows[0] ? rows[0].length : 0;
    for (let i = 0; i < rows.length; i++) {
      const r = (rows[i] = rows[i] || []);
      for (let j = 0; j < Math.max(w, r.length); j++) if (r[j] === undefined) r[j] = '';
    }
    out.push({ name: dec(m[1]), rows: rows });
  }
  return out;
}
