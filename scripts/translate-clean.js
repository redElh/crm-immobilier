const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const pdfjsLib = require('pdfjs-dist');
const fs = require('fs');
const path = require('path');
const { EN } = require('./translations-en.js');

const ALL_TRANSLATIONS = { en: EN };

async function extractTextFromPDF(pdfPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    const content = await page.getTextContent();
    const items = content.items.filter(item => item.str !== undefined).map(item => ({
      text: item.str,
      x: item.transform[4],
      y: item.transform[5],
      fontSize: Math.abs(item.transform[3]),
      fontName: item.fontName
    }));
    pages.push({ pageNum: i, width: viewport.width, height: viewport.height, items });
  }
  return pages;
}

async function translatePDF(lang, sourcePath, outputPath) {
  console.log(`Translating to ${lang}...`);
  const dictionary = ALL_TRANSLATIONS[lang];
  if (!dictionary) { console.error(`No translations for ${lang}`); return false; }

  const pages = await extractTextFromPDF(sourcePath);
  const pdfBytes = fs.readFileSync(sourcePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const textColor = rgb(0.13, 0.15, 0.35);

  let count = 0;
  for (let pi = 0; pi < pages.length; pi++) {
    const page = pages[pi];
    const pdfPage = pdfDoc.getPage(pi);
    const { height: ph } = pdfPage.getSize();

    for (const item of page.items) {
      const txt = item.text;
      if (!txt || txt.trim() === '') continue;
      if (/^\d+$/.test(txt.trim())) continue;
      if (/^[_\s-]+$/.test(txt)) continue;

      const translated = dictionary[txt.trim()];
      if (!translated) continue;

      const isBold = item.fontName && (item.fontName.includes('f4') || item.fontName.includes('f2') || item.fontName.includes('f7'));
      const font = isBold ? helveticaBold : helvetica;
      const fontSize = item.fontSize;
      const origWidth = font.widthOfTextAtSize(txt, fontSize);
      const newWidth = font.widthOfTextAtSize(translated, fontSize);

      // White rectangle to cover original - wider to ensure full coverage
      const coverWidth = Math.max(origWidth, newWidth) + 8;
      pdfPage.drawRectangle({
        x: item.x - 1,
        y: item.y - fontSize * 0.3,
        width: coverWidth + 2,
        height: fontSize * 1.5,
        color: rgb(1, 1, 1),
      });

      // Draw translated text
      pdfPage.drawText(translated, {
        x: item.x,
        y: item.y,
        size: fontSize,
        font,
        color: textColor,
      });
      count++;
    }
  }

  const translatedBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, translatedBytes);
  console.log(`  OK: ${count} items translated -> ${outputPath}`);
  return true;
}

async function main() {
  const templates = [
    { source: 'public/templates/SQUARE_METER_template_Bail_Habitation_1_An.pdf', outDir: 'public/templates/langues/bail-habitation-1-an', prefix: 'Bail_Habitation_1_An' },
    { source: 'public/templates/SQUARE_METER_template_Bail_Habitation_3_Ans.pdf', outDir: 'public/templates/langues/bail-habitation-3-ans', prefix: 'Bail_Habitation_3_Ans' },
  ];
  const langs = ['en'];

  for (const t of templates) {
    console.log(`\n=== ${t.prefix} ===`);
    const src = path.resolve(t.source);
    if (!fs.existsSync(src)) { console.error('Source not found:', src); continue; }
    const dir = path.resolve(t.outDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    for (const lang of langs) {
      const out = path.join(dir, `${t.prefix}_${lang.toUpperCase()}.pdf`);
      await translatePDF(lang, src, out);
    }
  }
  console.log('\nDone.');
}

main().catch(console.error);
