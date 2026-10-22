const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType,
  BorderStyle, ShadingType, AlignmentType, VerticalAlign, Footer, Header, PageNumber,
  SectionType, TabStopType, HeightRule, TableLayoutType, LineRuleType,
} = require('docx');

const LOGO = require('path').join(__dirname, '..', 'logo');
const OUT = process.argv[2];

// ---------- Design-Tokens ----------
const C = {
  ink: '121417', text: '2B2E33', muted: '6B6F76', soft: '9A9EA5',
  gold: '9A7A34', goldBright: 'D9B866', red: 'D0142C',
  line: 'E3DED4', tint: 'F6F3ED', white: 'FFFFFF',
};
const FONT = 'Arial';
const PAGE_W = 11906, MARGIN = 1020, W = PAGE_W - 2 * MARGIN; // 9866

// ---------- Helfer ----------
const t = (text, o = {}) => new TextRun({ text, font: FONT, size: o.size || 18, bold: o.bold, color: o.color || C.text, characterSpacing: o.spacing, italics: o.italics, allCaps: o.caps });
const p = (children, o = {}) => new Paragraph({
  children: Array.isArray(children) ? children : [children],
  alignment: o.align, keepNext: o.keepNext, keepLines: o.keepLines,
  spacing: { before: o.before || 0, after: o.after ?? 0, line: o.line || 264, lineRule: LineRuleType.AUTO },
  indent: o.indent, border: o.border, shading: o.shading, tabStops: o.tabs,
});
const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE };
const tableNoBorders = { ...noBorders, insideHorizontal: NONE, insideVertical: NONE };
const line = (color = C.line, size = 4) => ({ style: BorderStyle.SINGLE, size, color });

function cell(children, o = {}) {
  return new TableCell({
    children: Array.isArray(children) ? children : [children],
    width: { size: o.w, type: WidthType.DXA },
    columnSpan: o.span,
    verticalAlign: o.valign || VerticalAlign.CENTER,
    shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
    margins: o.m || { top: 80, bottom: 80, left: 140, right: 140 },
    borders: { ...noBorders, ...(o.borders || {}) },
  });
}
function table(widths, rows, o = {}) {
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths, layout: TableLayoutType.FIXED,
    borders: o.borders || tableNoBorders, rows,
  });
}
const row = (cells, h) => new TableRow({ children: cells, cantSplit: true, height: h ? { value: h, rule: HeightRule.ATLEAST } : undefined });
const spacer = (after = 120) => p(t(''), { after, line: 200 });

// Abschnittsüberschrift: „01  FAHRZEUGDATEN“
const sectionHead = (num, label, before = 280) => p([
  t(num, { bold: true, color: C.gold, size: 18, spacing: 20 }),
  t('   '),
  t(label.toUpperCase(), { bold: true, color: C.ink, size: 18, spacing: 40 }),
], { before, after: 120, keepNext: true, border: { bottom: line(C.ink, 8) } });

// ---------- Kopfbereich (dunkle Karte) ----------
const logoHell = fs.readFileSync(`${LOGO}/merz-logo-hell.png`);
const logoDunkel = fs.readFileSync(`${LOGO}/merz-logo-dunkel.png`);
const LOGO_RATIO = 538 / 132;

const headCard = table([5400, W - 5400], [row([
  cell(p(new ImageRun({ type: 'png', data: logoHell, transformation: { width: 236, height: Math.round(236 / LOGO_RATIO) } })),
    { w: 5400, fill: C.ink, m: { top: 300, bottom: 300, left: 340, right: 120 }, borders: { bottom: line(C.goldBright, 18) } }),
  cell([
    p(t('Merz-Automobile', { bold: true, color: C.white, size: 22 }), { align: AlignmentType.RIGHT, after: 20 }),
    p(t('Inh. Segvan Demir', { color: 'B9BCC2', size: 16 }), { align: AlignmentType.RIGHT }),
    p(t('Zigelhuettenstr. 45 · 64832 Babenhausen', { color: 'B9BCC2', size: 16 }), { align: AlignmentType.RIGHT, after: 60 }),
    p(t('0162 7777611', { bold: true, color: C.goldBright, size: 16 }), { align: AlignmentType.RIGHT }),
    p(t('merz-automobile@gmx.de', { bold: true, color: C.goldBright, size: 16 }), { align: AlignmentType.RIGHT }),
  ], { w: W - 5400, fill: C.ink, m: { top: 260, bottom: 260, left: 120, right: 340 }, borders: { bottom: line(C.goldBright, 18) } }),
])]);

// ---------- Empfänger + Rechnungsdaten ----------
const LEFT = 5300, GAP = 366, RIGHT = W - LEFT - GAP; // 4200
const fillRow = (label) => row([
  cell(p(t(label, { size: 16, color: C.muted })), { w: 1500, valign: VerticalAlign.BOTTOM, m: { top: 150, bottom: 50, left: 0, right: 80 } }),
  cell(p(t('', { size: 18 })), { w: LEFT - 1500, valign: VerticalAlign.BOTTOM, m: { top: 150, bottom: 50, left: 80, right: 0 }, borders: { bottom: line('BFB8AA', 6) } }),
]);
const recipient = [
  p(t('Merz-Automobile · Zigelhuettenstr. 45 · 64832 Babenhausen', { size: 13, color: C.soft }), { after: 100, border: { bottom: line(C.line, 4) } }),
  p(t('KÄUFER / RECHNUNGSEMPFÄNGER', { bold: true, size: 15, color: C.gold, spacing: 30 }), { after: 0 }),
  table([1500, LEFT - 1500], [fillRow('Name / Firma'), fillRow('Straße / Nr.'), fillRow('PLZ / Ort')]),
];
const metaRow = (label, value, o = {}) => row([
  cell(p(t(label, { size: 15, color: C.muted })), { w: 1700, fill: C.tint, m: { top: 90, bottom: 90, left: 200, right: 80 }, borders: { bottom: line(C.white, 8) } }),
  cell(p(t(value, { size: o.size || 17, bold: o.bold, color: o.color || C.ink })), { w: RIGHT - 1700, fill: C.tint, m: { top: 90, bottom: 90, left: 80, right: 200 }, borders: { bottom: line(C.white, 8) } }),
]);
const meta = table([1700, RIGHT - 1700], [
  metaRow('Rechnung Nr.', '01.2025', { bold: true, size: 20 }),
  metaRow('Rechnungsdatum', '12.09.2026', { bold: true }),
  metaRow('Lieferdatum', 'entspricht Rechnungsdatum'),
  metaRow('Steuer-Nr.', '00881132280'),
], { borders: { ...tableNoBorders, left: line(C.gold, 18) } });

const addressBlock = table([LEFT, GAP, RIGHT], [row([
  cell(recipient, { w: LEFT, valign: VerticalAlign.TOP, m: { top: 0, bottom: 0, left: 0, right: 0 } }),
  cell(p(t('')), { w: GAP }),
  cell(meta, { w: RIGHT, valign: VerticalAlign.TOP, m: { top: 0, bottom: 0, left: 0, right: 0 } }),
])]);

// ---------- Titel ----------
const title = [
  p(t('GEBRAUCHTFAHRZEUG', { bold: true, size: 15, color: C.red, spacing: 60 }), { before: 380, after: 40 }),
  p(t('Kaufvertrag und Rechnung', { bold: true, size: 44, color: C.ink }), { after: 0, line: 240 }),
];

// ---------- Fahrzeugdaten ----------
const LBL = 1850, VAL = (W - 2 * LBL) / 2; // 3083
const vb = { top: line(), bottom: line(), left: line(), right: line() };
const lbl = (s, w = LBL) => cell(p(t(s, { size: 15, bold: true, color: C.muted })), { w, fill: C.tint, borders: vb, m: { top: 90, bottom: 90, left: 160, right: 100 } });
const val = (s = '', span, w = VAL) => cell(p(t(s, { size: 18, color: C.ink })), { w, span, borders: vb, m: { top: 90, bottom: 90, left: 160, right: 120 } });
const full = W - LBL;
const vehicle = table([LBL, VAL, LBL, VAL], [
  row([lbl('Fahrzeug'), val(), lbl('Typ / Modell'), val()], 440),
  row([lbl('VIN (FIN)'), val('', 3, full)], 440),
  row([lbl('Erstzulassung'), val(), lbl('Leistung (kW)'), val()], 440),
  row([lbl('Laufleistung'), val(), lbl('Antriebsart'), val()], 440),
  row([lbl('Vorschaden bekannt'), val('Ja (Höhe unbekannt)', 3, full)], 440),
  row([lbl('Sonder\u00ADinformationen'), val('', 3, full)], 820),
  row([lbl('Zubehör / Unterlagen'), val('', 3, full)], 820),
]);

const taxNote = p([
  t('Hinweis zur Besteuerung: ', { bold: true, size: 16, color: C.ink }),
  t('Differenzbesteuerung gemäß § 25a UStG. Umsatzsteuer wird nicht gesondert ausgewiesen.', { size: 16, color: C.text }),
], { before: 160, after: 0, indent: { left: 160 }, border: { left: { style: BorderStyle.SINGLE, size: 18, color: C.gold, space: 8 } } });

// ---------- Gesamtbetrag ----------
const total = table([W - 4200, 4200], [row([
  cell([
    p(t('GESAMTBETRAG', { bold: true, size: 18, color: C.white, spacing: 60 })),
    p(t('Differenzbesteuert gem. § 25a UStG', { size: 14, color: 'A9ADB4' }), { before: 30 }),
  ], { w: W - 4200, fill: C.ink, m: { top: 200, bottom: 200, left: 300, right: 120 }, borders: { left: line(C.red, 36) } }),
  cell(p(t('6.300,00 €', { bold: true, size: 40, color: C.goldBright }), { align: AlignmentType.RIGHT }),
    { w: 4200, fill: C.ink, m: { top: 160, bottom: 160, left: 120, right: 300 } }),
])]);

const box = (label) => [t('☐ ', { size: 20, color: C.ink }), t(label, { size: 17, color: C.ink }), t('      ')];
const payment = p([
  t('ZAHLUNGSART', { bold: true, size: 15, color: C.gold, spacing: 30 }), t('\t'),
  ...box('Barzahlung'), ...box('Überweisung'),
  t('☐ ', { size: 20, color: C.ink }), t('Sonstige: ', { size: 17, color: C.ink }),
  t('______________________', { size: 17, color: 'BFB8AA' }),
], { before: 200, tabs: [{ type: TabStopType.LEFT, position: 1700 }] });

// ---------- Übergabe & Unterschriften ----------
const handover = p(t('Der Käufer bestätigt den Erhalt und die Übernahme des oben bezeichneten Fahrzeugs sowie den Erhalt der beigefügten AGB.', { size: 17 }), { after: 60, keepNext: true });
function signatures(labels, height = 760, total = W) {
  const n = labels.length, g = 400, cw = Math.floor((total - g * (n - 1)) / n);
  const widths = []; labels.forEach((_, i) => { widths.push(cw); if (i < n - 1) widths.push(g); });
  widths[widths.length - 1] += total - widths.reduce((a, b) => a + b, 0);
  const lineCells = [], capCells = [];
  labels.forEach((l, i) => {
    const w = widths[i * 2];
    lineCells.push(cell(p(t('')), { w, borders: { bottom: line(C.ink, 6) } }));
    capCells.push(cell(p(t(l, { size: 14, color: C.muted })), { w, m: { top: 60, bottom: 0, left: 0, right: 0 } }));
    if (i < n - 1) { lineCells.push(cell(p(t('')), { w: g })); capCells.push(cell(p(t('')), { w: g })); }
  });
  return table(widths, [row(lineCells, height), row(capCells)]);
}

// ---------- Fußzeile ----------
const footCol = (head, lines, w) => cell([
  p(t(head, { bold: true, size: 13, color: C.ink }), { after: 20 }),
  ...lines.map((l) => p(t(l, { size: 13, color: C.muted }))),
], { w, valign: VerticalAlign.TOP, m: { top: 120, bottom: 0, left: 0, right: 100 } });
const fw = [2900, 2500, 3366, W - 2900 - 2500 - 3366];
const footer = new Footer({ children: [table(fw, [row([
  footCol('Merz-Automobile', ['Inh. Segvan Demir', 'Zigelhuettenstr. 45', '64832 Babenhausen'], fw[0]),
  footCol('Kontakt', ['0162 7777611', 'merz-automobile@gmx.de', 'Steuer-Nr. 00881132280'], fw[1]),
  footCol('Bankverbindung', ['Volksbank Dreieich', 'IBAN DE95 5059 2200 0005 4668 73'], fw[2]),
  cell(p(new TextRun({ font: FONT, size: 13, color: C.muted, children: ['Seite ', PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES] }), { align: AlignmentType.RIGHT }),
    { w: fw[3], valign: VerticalAlign.TOP, m: { top: 120, bottom: 0, left: 0, right: 0 } }),
])], { borders: { ...tableNoBorders, top: line(C.gold, 8) } })] });

// ---------- AGB ----------
const agbHeader = new Header({ children: [
  table([4900, W - 4900], [row([
    cell(p(new ImageRun({ type: 'png', data: logoDunkel, transformation: { width: 150, height: Math.round(150 / LOGO_RATIO) } })), { w: 4900, m: { top: 0, bottom: 100, left: 0, right: 0 } }),
    cell(p([t('ANLAGE ZUR RECHNUNG', { bold: true, size: 13, color: C.gold, spacing: 30 }), t('   ·   AGB', { size: 13, color: C.muted })], { align: AlignmentType.RIGHT }),
      { w: W - 4900, valign: VerticalAlign.BOTTOM, m: { top: 0, bottom: 110, left: 0, right: 0 } }),
  ])], { borders: { ...tableNoBorders, bottom: line(C.ink, 8) } }),
] });

// [Nummer, Titel, [[Ziffer, Text, fett?], ...]]
const AGB = [
  ['1', 'Prüf- und Besichtigungsrechte des Käufers', [
    ['1.1.', 'Der Käufer hat vor Abschluss des Kaufvertrags das Recht, das Fahrzeug umfassend zu besichtigen, zu prüfen, eine Probefahrt durchzuführen sowie eine Untersuchung durch eine unabhängige Prüforganisation (z. B. TÜV, Dekra) vornehmen zu lassen.'],
    ['1.2.', 'Mit Vertragsabschluss bestätigt der Käufer, dass ihm diese Möglichkeiten uneingeschränkt zur Verfügung standen.'],
    ['1.3.', 'Der Käufer trägt die Verantwortung, sich vor Vertragsabschluss über den tatsächlichen Zustand des Fahrzeugs ein vollständiges Bild zu verschaffen.'],
    ['1.4.', 'Der Käufer bestätigt, dass er sich vor dem Kauf sowohl technisch als auch optisch vom Zustand des Fahrzeugs überzeugt hat und das Fahrzeug bewusst in diesem Zustand erwirbt.'],
    ['1.5.', 'Dem Käufer ist bewusst, welchen technischen und optischen Zustand das Fahrzeug beim Kauf aufweist.'],
    ['1.6.', 'Vor dem Kauf hat der Käufer das Recht, das Fahrzeug bei TÜV, Dekra, einer freien Werkstatt, einer Fachwerkstatt oder von einer sachkundigen Person seiner Wahl prüfen zu lassen.'],
    ['1.7.', 'Fahrzeugprüfung: Das Fahrzeug wurde vom Käufer vor Vertragsabschluss eingehend besichtigt, Probe gefahren und kontrolliert. Der Käufer erklärt, dass er sich vom Zustand des Fahrzeugs überzeugt hat. Die Haftung für offensichtliche Mängel, die bei einer sorgfältigen Prüfung erkennbar gewesen wären, ist ausgeschlossen.'],
  ]],
  ['2', 'Ausschluss der Sachmängelhaftung', [
    ['2.1.', 'Das Fahrzeug wird ausschließlich „wie besichtigt“ und „im gegenwärtigen Zustand“ verkauft.'],
    ['2.2.', 'Die Sachmängelhaftung wird – soweit gesetzlich zulässig – vollständig ausgeschlossen. Dies gilt für sämtliche offenen, verdeckten und später auftretenden Mängel.'],
    ['2.3.', 'Nach Übergabe bestehen keine Ansprüche des Käufers auf Nachbesserung, Rücktritt, Minderung und/oder Schadensersatz, sofern nicht ausdrücklich schriftlich im Kaufvertrag vereinbart.'],
    ['2.4.', 'Nachträgliche Reklamationen, technische Beanstandungen oder Wertminderungsforderungen sind ausgeschlossen.'],
    ['2.5.', 'Bei Privatkäufen ist die Gewährleistung maximal 12 Monate begrenzt und darüber hinaus ausgeschlossen, soweit gesetzlich zulässig.', true],
    ['2.6.', 'Bei gewerblichen Käufen ist die Gewährleistung vollständig ausgeschlossen. Nach dem Kauf gilt: gekauft wie besichtigt, gefahren und geprüft.', true],
    ['2.7.', 'Für Verschleißteile wie Reifen, Bremsen, Stoßdämpfer, Zahnriemen, Steuerketten usw. wird keine Haftung übernommen. Reklamationen nach dem Kauf werden nicht angenommen.', true],
  ]],
  ['3', 'Arglistige Täuschung', [
    ['3.1.', 'Arglist setzt voraus, dass dem Verkäufer ein wesentlicher Mangel bekannt war und dieser vorsätzlich verschwiegen wurde.'],
    ['3.2.', 'Das Auftreten eines späteren Defekts begründet keinen Verdacht auf Arglist.'],
    ['3.3.', 'Der Käufer erkennt ausdrücklich an, dass Gebrauchtfahrzeuge alters-, nutzungs- und laufleistungsbedingtem Verschleiß unterliegen.'],
  ]],
  ['4', 'Garantie über Partnerunternehmen', [
    ['4.1.', 'Auf Wunsch kann der Käufer eine Garantie über ein Partnerunternehmen des Verkäufers abschließen.'],
    ['4.2.', 'Die Garantie wird laufleistungsabhängig berechnet.'],
    ['4.3.', 'Der Käufer entscheidet eigenständig über Art und Umfang des gewünschten Garantiepakets.'],
    ['4.4.', 'Im Garantiefall ist ausschließlich der Käufer für Meldung, Kommunikation und Abwicklung mit der Garantiegesellschaft verantwortlich.'],
    ['4.5.', 'Der Verkäufer übernimmt keinerlei Haftung für Entscheidungen, Ablehnungen oder Leistungsumfänge der Garantiegesellschaft.'],
    ['4.6.', 'Im Garantie- oder Gewährleistungsfall trägt der Käufer die Kosten und Verantwortung für den Transport des Fahrzeugs zum Verkäufer.', true],
  ]],
  ['5', 'Vertragsgrundlagen', [
    ['5.1.', 'Eigenschaften des Fahrzeugs gelten nur dann als zugesichert, wenn sie schriftlich im Kaufvertrag festgehalten sind.'],
    ['5.2.', 'Mündliche Nebenabreden bestehen nicht.'],
    ['5.3.', 'Angaben aus Online-Anzeigen, mündlichen Aussagen oder sonstigen externen Informationsquellen sind unverbindlich und werden nur wirksam, wenn sie schriftlich im Kaufvertrag festgehalten sind.'],
    ['5.4.', 'Der Käufer bestätigt, dass er das Fahrzeug in Person besichtigt hat und sämtliche vorhandenen Ausstattungen und Extras vor Ort auf deren Funktion prüfen konnte.'],
    ['5.5.', 'Nach dem Kauf werden keinerlei Reklamationen bezüglich Ausstattungsmerkmalen, Funktionen oder fehlenden Extras akzeptiert.'],
  ]],
  ['6', 'Haftungsausschlüsse', [
    ['6.0.', 'Im Hinblick auf mögliche Vorschäden gilt: Sollte dem Verkäufer ein Vorschaden bekannt sein, wird dieser ausdrücklich und schriftlich im Kaufvertrag vermerkt. Wird im Kaufvertrag kein Hinweis auf einen Vorschaden aufgeführt, bedeutet dies, dass dem Verkäufer kein Vorschaden bekannt ist und keine Zusicherung über einen nicht vorhandenen Vorschaden abgegeben wird. Der Käufer ist darüber informiert und erkennt an, dass der Verkäufer keine Verpflichtung hat, eine Vorschadensprüfung vorab durchzuführen.'],
    ['6.1.', 'Wir weisen bewusst darauf hin, dass in unseren Kaufverträgen nicht festgehalten wird, ob ein Vorschaden bekannt oder nicht bekannt ist. Da wir lediglich als Zwischenhändler auftreten und die Fahrzeuge häufig bereits mehrere Halter hatten, können wir weder zusichern noch garantieren, ob ein Fahrzeug einen Vorschaden hatte oder nicht. Dies ist dem Käufer bekannt.'],
    ['6.2.', 'Jegliche Haftung für technische Defekte, Motorschäden, Getriebeschäden, elektrische Störungen, Verschleißteile und Betriebsstoffe, die nach Übergabe auftreten, ist ausgeschlossen.'],
    ['6.3.', 'Ebenso ausgeschlossen sind Folgeschäden, wirtschaftliche Verluste, Nutzungsausfälle oder Wertminderungen.'],
  ]],
  ['7', 'Eigentumsübergang', [
    ['7.1.', 'Eigentum geht erst nach vollständiger Zahlung des Kaufpreises auf den Käufer über.'],
    ['7.2.', 'Mit Übergabe erkennt der Käufer den Zustand des Fahrzeugs verbindlich an.'],
  ]],
  ['8', 'Salvatorische Klausel', [
    ['', 'Sollte eine Bestimmung dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.'],
  ]],
];
const HANG = 400, COL_SPACE = 520, COL_W = Math.floor((W - COL_SPACE) / 2);
const agbBody = [];
AGB.forEach(([n, head, items], i) => {
  agbBody.push(p([
    t(n.padStart(2, '0'), { bold: true, size: 17, color: C.gold }), t('  '),
    t(head, { bold: true, size: 17, color: C.ink }),
  ], { before: i === 0 ? 0 : 150, after: 70, keepNext: true, border: { bottom: line(C.line, 4) } }));
  items.forEach(([num, text, bold]) => {
    agbBody.push(num
      ? p([t(num, { bold: true, size: 15, color: C.gold }), t('\t'), t(text, { size: 15, bold, color: bold ? C.ink : C.text })],
        { after: 50, line: 250, indent: { left: HANG, hanging: HANG }, tabs: [{ type: TabStopType.LEFT, position: HANG }] })
      : p(t(text, { size: 15 }), { after: 50, line: 250 }));
  });
});

const agbIntro = [
  p(t('VERTRAGSBEDINGUNGEN', { bold: true, size: 15, color: C.red, spacing: 60 }), { before: 60, after: 30 }),
  p(t('AGB für den Verkauf von Gebrauchtfahrzeugen', { bold: true, size: 32, color: C.ink }), { after: 40, line: 240 }),
  p(t('Merz-Automobile · Inh. Segvan Demir · Zigelhuettenstr. 45 · 64832 Babenhausen', { size: 16, color: C.muted }), { after: 80 }),
  table([1100, W - 1100], [row([
    cell(p(t('Käufer:', { bold: true, size: 17, color: C.ink })), { w: 1100, valign: VerticalAlign.BOTTOM, m: { top: 60, bottom: 50, left: 0, right: 0 } }),
    cell(p(t('')), { w: W - 1100, valign: VerticalAlign.BOTTOM, m: { top: 60, bottom: 50, left: 0, right: 0 }, borders: { bottom: line('BFB8AA', 6) } }),
  ])]),
  spacer(80),
];

// ---------- Dokument ----------
const pageProps = (o = {}) => ({
  page: { size: { width: PAGE_W, height: 16838 }, margin: { top: o.top || 720, bottom: 1250, left: MARGIN, right: MARGIN, header: 500, footer: 420 } },
});

const doc = new Document({
  creator: 'Merz-Automobile',
  title: 'Kaufvertrag und Rechnung – Merz-Automobile',
  styles: { default: { document: { run: { font: FONT, size: 18, color: C.text } } } },
  sections: [
    {
      properties: pageProps({ top: 640 }),
      footers: { default: footer },
      children: [
        headCard, spacer(260), addressBlock, ...title,
        sectionHead('01', 'Fahrzeugdaten', 260), vehicle, taxNote,
        spacer(120), total, payment,
        sectionHead('02', 'Übergabe und Bestätigung', 300), handover,
        signatures(['Ort / Datum', 'Unterschrift Käufer', 'Unterschrift / Stempel Verkäufer'], 700),
      ],
    },
    {
      properties: { ...pageProps({ top: 1160 }), type: SectionType.NEXT_PAGE },
      headers: { default: agbHeader },
      footers: { default: footer },
      children: agbIntro,
    },
    {
      properties: { ...pageProps({ top: 1160 }), type: SectionType.CONTINUOUS, column: { count: 2, space: COL_SPACE } },
      headers: { default: agbHeader },
      footers: { default: footer },
      children: [...agbBody, spacer(60), signatures(['Datum', 'Unterschrift Käufer'], 620, COL_W)],
    },
  ],
});

Packer.toBuffer(doc).then((b) => { fs.writeFileSync(OUT, b); console.log('ok', OUT); });
