const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'index.html');
const cssPath = path.join(root, 'styles.css');
const jsPath = path.join(root, 'app.js');
const faviconPath = path.join(root, 'favicon.svg');
const outPath = path.join(root, 'prompt-trimmer.html');

function read(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (e) { return ''; }
}

const index = read(indexPath);
const css = read(cssPath);
const js = read(jsPath);
const favicon = read(faviconPath);

if (!index) {
  console.error('index.html not found');
  process.exit(1);
}

let out = index;

// Remove download button markup if present (exact match for safety)
out = out.replace(/<button id="download-standalone"[\s\S]*?<\/button>/i, '');

// Inline CSS by replacing the exact link tag occurrence
const cssLink = '<link rel="stylesheet" href="styles.css" />';
const cssLinkAlt = '<link rel="stylesheet" href="styles.css">';
const safeCss = css.replace(/<\/style>/gi, '<\\/style>');
if (out.includes(cssLink)) {
  const i = out.indexOf(cssLink);
  out = out.slice(0, i) + `<style>\n${safeCss}\n</style>` + out.slice(i + cssLink.length);
} else if (out.includes(cssLinkAlt)) {
  const i = out.indexOf(cssLinkAlt);
  out = out.slice(0, i) + `<style>\n${safeCss}\n</style>` + out.slice(i + cssLinkAlt.length);
}

// Inline favicon if present
if (favicon) {
  const data = encodeURIComponent(favicon);
  const favTag = '<link rel="icon" href="favicon.svg" type="image/svg+xml">';
  const favTagAlt = '<link rel="icon" href="favicon.svg">';
  const replacement = `<link rel="icon" href="data:image/svg+xml;utf8,${data}" type="image/svg+xml">`;
    if (out.includes(favTag)) {
      const i = out.indexOf(favTag);
      out = out.slice(0, i) + replacement + out.slice(i + favTag.length);
    } else if (out.includes(favTagAlt)) {
      const i = out.indexOf(favTagAlt);
      out = out.slice(0, i) + replacement + out.slice(i + favTagAlt.length);
    }
}

// Inline JS by finding the exact script tag and replacing it with an inline script
const scriptTag = '<script src="app.js"></script>';
const scriptTagAlt = '<script src="app.js"></script>';
const safeJs = js.replace(/<\/script>/gi, '<\\/script>');
if (out.includes(scriptTag)) {
  const i = out.indexOf(scriptTag);
  out = out.slice(0, i) + `<script>\n${safeJs}\n</script>` + out.slice(i + scriptTag.length);
} else if (out.includes(scriptTagAlt)) {
  const i = out.indexOf(scriptTagAlt);
  out = out.slice(0, i) + `<script>\n${safeJs}\n</script>` + out.slice(i + scriptTagAlt.length);
} else {
  // fallback: append script before </body>
  const bodyClose = out.search(/<\/body>/i);
  if (bodyClose !== -1) {
    out = out.slice(0, bodyClose) + `<script>\n${safeJs}\n</script>` + out.slice(bodyClose);
  } else {
    out += `<script>\n${safeJs}\n</script>`;
  }
}

fs.writeFileSync(outPath, out, 'utf8');
console.log('Written', outPath);
