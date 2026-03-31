// ============================================================
// KVRD Phase 1 Wireframes Generator — Figma Plugin
// Creates all 4 screens at 390x844px with brand colors
// Run via: Plugins > Development > Run Last Plugin
// ============================================================

const C = {
  bg:       { r: 10/255,  g: 10/255,  b: 10/255  }, // #0A0A0A Rich Black
  cream:    { r: 245/255, g: 239/255, b: 230/255  }, // #F5EFE6 Warm Cream
  gold:     { r: 201/255, g: 148/255, b: 58/255   }, // #C9943A Antique Gold
  green:    { r: 27/255,  g: 67/255,  b: 50/255   }, // #1B4332 Forest Green
  purple:   { r: 155/255, g: 127/255, b: 204/255  }, // #9B7FCC Lavender Amethyst
  safe:     { r: 34/255,  g: 197/255, b: 94/255   }, // #22C55E
  caution:  { r: 245/255, g: 158/255, b: 11/255   }, // #F59E0B
  risk:     { r: 239/255, g: 68/255,  b: 68/255   }, // #EF4444
  mapBg:    { r: 26/255,  g: 26/255,  b: 26/255   }, // #1A1A1A
  card:     { r: 20/255,  g: 20/255,  b: 20/255   }, // card background
  divider:  { r: 40/255,  g: 40/255,  b: 40/255   }, // subtle borders
  muted:    { r: 153/255, g: 145/255, b: 138/255  }, // muted text
  white:    { r: 1,       g: 1,       b: 1        },
  black:    { r: 0,       g: 0,       b: 0        },
};

const FW = 390;
const FH = 844;
const GAP = 80;
const TAB_H = 80;
const STATUS_H = 44;

// ─── Fonts to preload ───────────────────────────────────────
const FONTS = [
  { family: "Fraunces",          style: "Regular"  },
  { family: "Fraunces",          style: "Bold"     },
  { family: "Plus Jakarta Sans", style: "Regular"  },
  { family: "Plus Jakarta Sans", style: "Medium"   },
  { family: "Plus Jakarta Sans", style: "SemiBold" },
  { family: "Plus Jakarta Sans", style: "Bold"     },
];

// ─── Helpers ────────────────────────────────────────────────

function fill(color, opacity = 1) {
  return [{ type: "SOLID", color, opacity }];
}

function noFill() {
  return [];
}

function makeFrame(name, x, y, w, h, color, parent) {
  const f = figma.createFrame();
  f.name = name;
  f.resize(w, h);
  f.x = x;
  f.y = y;
  f.fills = color ? fill(color) : noFill();
  f.clipsContent = false;
  if (parent) parent.appendChild(f);
  return f;
}

function makeRect(name, x, y, w, h, color, opacity = 1, radius = 0, parent) {
  const r = figma.createRectangle();
  r.name = name;
  r.x = x; r.y = y;
  r.resize(w, h);
  r.fills = fill(color, opacity);
  if (radius > 0) r.cornerRadius = radius;
  if (parent) parent.appendChild(r);
  return r;
}

function makeCircle(name, x, y, d, color, opacity = 1, parent) {
  const e = figma.createEllipse();
  e.name = name;
  e.x = x; e.y = y;
  e.resize(d, d);
  e.fills = fill(color, opacity);
  if (parent) parent.appendChild(e);
  return e;
}

function makeOutlineRect(name, x, y, w, h, strokeColor, radius = 0, parent) {
  const r = figma.createRectangle();
  r.name = name;
  r.x = x; r.y = y;
  r.resize(w, h);
  r.fills = noFill();
  r.strokes = fill(strokeColor);
  r.strokeWeight = 1.5;
  r.strokeAlign = "INSIDE";
  if (radius > 0) r.cornerRadius = radius;
  if (parent) parent.appendChild(r);
  return r;
}

// Text must be created with font already loaded
function makeText(name, x, y, content, size, color, family, style, parent, maxWidth) {
  const t = figma.createText();
  t.name = name;
  t.fontName = { family, style };
  t.fontSize = size;
  t.fills = fill(color);
  t.characters = content;
  if (maxWidth) {
    t.textAutoResize = "HEIGHT";
    t.resize(maxWidth, t.height);
  }
  t.x = x; t.y = y;
  if (parent) parent.appendChild(t);
  return t;
}

function jk(content, x, y, size, color, parent, style = "Regular", maxW) {
  return makeText(content, x, y, content, size, color, "Plus Jakarta Sans", style, parent, maxW);
}

function fr(content, x, y, size, color, parent, style = "Regular", maxW) {
  return makeText(content, x, y, content, size, color, "Fraunces", style, parent, maxW);
}

// ─── Reusable Components ─────────────────────────────────────

function makeStatusBar(parent) {
  const sb = makeFrame("Status Bar", 0, 0, FW, STATUS_H, C.bg, parent);
  jk("9:41", 16, 14, 14, C.cream, sb, "SemiBold");
  jk("●●● WiFi 100%", FW - 120, 14, 12, C.cream, sb, "Regular");
  return sb;
}

function makeTabBar(parent, activeTab) {
  const tabs = ["Home", "Explore", "Destination", "Profile"];
  const icons = ["⌂", "◎", "📍", "◌"];

  const bar = makeFrame("Tab Bar", 0, FH - TAB_H, FW, TAB_H, C.card, parent);
  // top divider
  makeRect("Divider", 0, 0, FW, 1, C.divider, 1, 0, bar);

  const tabW = FW / tabs.length;
  tabs.forEach((tab, i) => {
    const isActive = tab === activeTab;
    const color = isActive ? C.gold : C.muted;
    const tx = i * tabW;

    // active indicator bar
    if (isActive) {
      makeRect("Active Indicator", tx + tabW / 2 - 16, 0, 32, 3, C.gold, 1, 2, bar);
    }

    // icon circle
    makeCircle(`${tab} Icon`, tx + tabW / 2 - 10, 14, 20, color, isActive ? 1 : 0.5, bar);

    // label
    const label = jk(tab, tx + 4, 40, 10, color, bar, isActive ? "SemiBold" : "Regular", tabW - 8);
    label.textAlignHorizontal = "CENTER";
    label.x = tx + 4;
  });

  return bar;
}

function makeDestCard(parent, x, y, city, flag, score, status, statusColor) {
  const card = makeFrame(`Card — ${city}`, x, y, 160, 200, C.green, parent);
  card.cornerRadius = 12;
  card.clipsContent = true;

  // image placeholder
  makeRect("Image Placeholder", 0, 0, 160, 118, { r: 18/255, g: 50/255, b: 36/255 }, 1, 0, card);
  jk("[ photo ]", 52, 50, 11, C.muted, card);

  // score badge
  makeCircle("Score Badge BG", 112, 8, 36, C.gold, 1, card);
  const scoreLabel = jk(score, 120, 16, 12, C.bg, card, "Bold");
  scoreLabel.textAlignHorizontal = "CENTER";

  // info area
  makeRect("Card Info BG", 0, 118, 160, 82, C.green, 1, 0, card);
  jk(flag, 12, 124, 16, C.cream, card);
  fr(city, 12, 144, 14, C.cream, card);

  // status pill
  makeRect("Status Pill", 12, 168, 68, 22, statusColor, 0.18, 11, card);
  jk(status, 20, 172, 10, statusColor, card, "SemiBold");

  return card;
}

// ─── Screen 1: HOME ─────────────────────────────────────────

function buildHome(page, ox) {
  const screen = makeFrame("01 — Home", ox, 0, FW, FH, C.bg, page);

  makeStatusBar(screen);

  // ── Header
  const header = makeFrame("Header", 0, STATUS_H, FW, 56, null, screen);
  fr("KVRD", 16, 10, 30, C.gold, header, "Bold");
  makeCircle("Bell BG", FW - 52, 8, 36, C.card, 1, header);
  makeOutlineRect("Bell Ring", FW - 52, 8, 36, 36, C.divider, 18, header);
  jk("🔔", FW - 41, 16, 16, C.cream, header);

  // ── Greeting
  const greetY = STATUS_H + 56 + 8;
  jk("Good morning, Jordan", 16, greetY, 20, C.cream, screen, "SemiBold");

  // ── Section 1: Recent
  const sec1Y = greetY + 36;
  jk("Recent destinations", 16, sec1Y, 13, C.muted, screen, "SemiBold");

  // Destination cards row 1
  const row1Y = sec1Y + 28;
  makeDestCard(screen, 16, row1Y, "Cape Town",  "🇿🇦", "8.4", "Safe",    C.safe);
  makeDestCard(screen, 192, row1Y, "Mexico City","🇲🇽", "7.1", "Caution", C.caution);
  // Half-visible third card (scroll hint)
  makeRect("Card — Berlin (partial)", 368, row1Y, 24, 200, C.green, 1, 12, screen);

  // ── Section 2: Trending
  const sec2Y = row1Y + 216;
  jk("Trending destinations", 16, sec2Y, 13, C.muted, screen, "SemiBold");

  const row2Y = sec2Y + 28;
  makeDestCard(screen, 16, row2Y, "Lisbon",    "🇵🇹", "8.8", "Safe",    C.safe);
  makeDestCard(screen, 192, row2Y, "Bangkok",  "🇹🇭", "6.5", "Caution", C.caution);

  // ── Section 3: Community
  const sec3Y = row2Y + 216;
  jk("From the community", 16, sec3Y, 13, C.muted, screen, "SemiBold");

  // Article card (full-width editorial)
  const artY = sec3Y + 28;
  const artCard = makeFrame("Article Card", 16, artY, FW - 32, 100, C.card, screen);
  artCard.cornerRadius = 12;
  artCard.clipsContent = true;
  makeRect("Article Image BG", 0, 0, FW - 32, 58, { r: 28/255, g: 28/255, b: 28/255 }, 1, 0, artCard);
  jk("[ editorial photo ]", 100, 20, 11, C.muted, artCard);
  fr("The 10 Most Welcoming Cities for Black LGBTQ+ Travelers", 12, 66, 12, C.cream, artCard, "Regular", FW - 56);

  makeTabBar(screen, "Home");
  return screen;
}

// ─── Screen 2: EXPLORE (Map) ─────────────────────────────────

function buildExplore(page, ox) {
  const screen = makeFrame("02 — Explore", ox, 0, FW, FH, C.bg, page);

  // Full-screen dark map tile
  makeRect("Map Background", 0, 0, FW, FH, C.mapBg, 1, 0, screen);
  jk("[ Mapbox Dark Map ]", FW / 2 - 70, FH / 2 - 8, 14, C.divider, screen);

  // ── Floating search bar
  const searchBar = makeFrame("Search Bar", 16, 58, FW - 32, 48, C.card, screen);
  searchBar.cornerRadius = 24;
  makeCircle("Search Icon BG", 13, 13, 22, C.divider, 1, searchBar);
  jk("⌕", 16, 13, 16, C.muted, searchBar);
  jk("Search destinations...", 46, 15, 15, C.muted, searchBar);

  // ── Filter chips
  const chips = [
    { label: "All",      active: true  },
    { label: "Safe",     active: false },
    { label: "Legal",    active: false },
    { label: "Verified", active: false },
  ];

  const chipRow = makeFrame("Filter Chips", 16, 118, FW - 32, 36, null, screen);
  let cx = 0;
  for (const chip of chips) {
    const cw = chip.label.length * 9 + 28;
    makeRect(`Chip — ${chip.label}`, cx, 0, cw, 36,
      chip.active ? C.gold : C.card, 1, 18, chipRow);
    jk(chip.label, cx + 14, 10, 13,
      chip.active ? C.bg : C.cream, chipRow, chip.active ? "SemiBold" : "Regular");
    cx += cw + 10;
  }

  // ── Map pins
  const pins = [
    { x: 72,  y: 260, color: C.safe,    selected: false },
    { x: 180, y: 360, color: C.caution, selected: false },
    { x: 280, y: 240, color: C.safe,    selected: false },
    { x: 130, y: 460, color: C.safe,    selected: false },
    { x: 310, y: 390, color: C.risk,    selected: false },
    { x: 210, y: 500, color: C.safe,    selected: true  }, // selected
  ];

  for (const pin of pins) {
    if (!pin.selected) {
      makeCircle("Map Pin", pin.x, pin.y, 14, pin.color, 0.9, screen);
      // soft glow ring
      makeCircle("Pin Glow", pin.x - 4, pin.y - 4, 22, pin.color, 0.2, screen);
    } else {
      // larger selected pin
      makeCircle("Selected Pin", pin.x - 2, pin.y - 2, 18, pin.color, 1, screen);
      makeCircle("Selected Pin Glow", pin.x - 8, pin.y - 8, 30, pin.color, 0.25, screen);

      // Connector
      makeRect("Pin Connector", pin.x + 6, pin.y - 20, 2, 20, pin.color, 1, 0, screen);

      // Floating info card
      const cardX = pin.x - 80;
      const cardY = pin.y - 100;
      const floatCard = makeFrame("Selected Pin Card", cardX, cardY, 190, 74, C.card, screen);
      floatCard.cornerRadius = 12;
      // shadow via outer rect (Figma shadow effect not settable via simple API, use border)
      makeOutlineRect("Card Border", 0, 0, 190, 74, C.divider, 12, floatCard);

      fr("Lisbon", 12, 10, 17, C.cream, floatCard, "Regular");
      makeCircle("Score BG", 12, 36, 28, C.gold, 1, floatCard);
      jk("8.8", 17, 43, 11, C.bg, floatCard, "Bold");
      jk("View destination →", 50, 40, 12, C.gold, floatCard, "SemiBold");
      jk("🇵🇹 Portugal", 12, 28, 11, C.muted, floatCard);
    }
  }

  makeTabBar(screen, "Explore");
  return screen;
}

// ─── Screen 3: DESTINATION ───────────────────────────────────

function buildDestination(page, ox) {
  const screen = makeFrame("03 — Destination", ox, 0, FW, FH, C.bg, page);

  makeStatusBar(screen);

  // ── Nav header
  const nav = makeFrame("Nav Header", 0, STATUS_H, FW, 48, null, screen);
  makeCircle("Back BG", 16, 10, 28, C.card, 1, nav);
  jk("←", 23, 12, 16, C.cream, nav);
  makeCircle("Share BG", FW - 56, 10, 28, C.card, 1, nav);
  jk("↗", FW - 49, 12, 16, C.cream, nav);

  // ── Hero image
  const heroY = STATUS_H + 48;
  makeRect("Hero Image Placeholder", 0, heroY, FW, 200, { r: 28/255, g: 28/255, b: 28/255 }, 1, 0, screen);
  jk("[ destination hero photo ]", FW / 2 - 80, heroY + 90, 13, C.divider, screen);

  // ── City name
  const titleY = heroY + 210;
  fr("Cape Town", 16, titleY, 34, C.cream, screen, "Regular");
  jk("South Africa", 16, titleY + 42, 15, C.muted, screen);

  // ── Score section
  const scoreSection = makeFrame("Score Section", 16, titleY + 70, FW - 32, 148, null, screen);

  const scoreRows = [
    { label: "Community Score", value: "8.4", color: C.safe,    pct: 0.84, big: false },
    { label: "Legal Score",     value: "7.2", color: C.caution, pct: 0.72, big: false },
    { label: "Composite Score", value: "7.9", color: C.gold,    pct: 0.79, big: true  },
  ];

  let scoreY = 0;
  for (const row of scoreRows) {
    const rowH = row.big ? 52 : 44;
    if (row.big) {
      makeRect("Composite Row BG", -8, scoreY - 4, FW - 16, rowH + 6, C.card, 1, 8, scoreSection);
    }
    const labelStyle = row.big ? "SemiBold" : "Regular";
    const labelColor = row.big ? C.cream : C.muted;
    jk(row.label, 0, scoreY + (row.big ? 6 : 4), row.big ? 14 : 12, labelColor, scoreSection, labelStyle);

    const barY = scoreY + (row.big ? 26 : 22);
    const barW = FW - 110;
    makeRect("Track", 0, barY, barW, 6, C.divider, 1, 3, scoreSection);
    makeRect("Fill", 0, barY, barW * row.pct, 6, row.color, 1, 3, scoreSection);

    jk(`${row.value} / 10`, barW + 10, scoreY + (row.big ? 8 : 4),
      row.big ? 16 : 13, row.big ? C.gold : C.cream, scoreSection, row.big ? "Bold" : "SemiBold");

    scoreY += rowH + 4;
  }

  // ── Legal status strip
  const legalY = titleY + 70 + 160;
  const legalFrame = makeFrame("Legal Status Strip", 16, legalY, FW - 32, 36, null, screen);

  const legalItems = [
    { text: "Same-sex legal ✓",     color: C.safe },
    { text: "No marriage rights ✗", color: C.risk },
    { text: "Anti-discrimination ✓",color: C.safe },
  ];
  let lx = 0;
  for (const item of legalItems) {
    const lw = item.text.length * 7 + 18;
    makeRect(`Legal — ${item.text}`, lx, 0, lw, 28, item.color, 0.15, 14, legalFrame);
    jk(item.text, lx + 9, 8, 10, item.color, legalFrame, "SemiBold");
    lx += lw + 8;
  }

  // ── Top cities
  const citiesY = legalY + 48;
  jk("Top cities", 16, citiesY, 13, C.muted, screen, "SemiBold");
  const citiesRow = makeFrame("Top Cities Row", 16, citiesY + 24, FW - 32, 36, null, screen);
  let ccx = 0;
  for (const city of ["Cape Town", "Jo'burg", "Durban"]) {
    const cw = city.length * 8 + 22;
    makeRect(`City Chip — ${city}`, ccx, 0, cw, 36, C.card, 1, 18, citiesRow);
    jk(city, ccx + 11, 10, 12, C.cream, citiesRow);
    ccx += cw + 8;
  }

  // ── Reviews
  const reviewsY = citiesY + 72;
  jk("What travelers say", 16, reviewsY, 13, C.muted, screen, "SemiBold");

  const revCard = makeFrame("Review Card", 16, reviewsY + 24, FW - 32, 96, C.card, screen);
  revCard.cornerRadius = 12;
  makeCircle("Avatar", 12, 12, 38, C.green, 1, revCard);
  jk("M", 28, 23, 16, C.cream, revCard, "Bold"); // initial
  jk("Marcus T.", 58, 12, 13, C.cream, revCard, "SemiBold");
  jk("Black · Gay · Solo traveler", 58, 30, 11, C.muted, revCard);
  jk("★★★★☆", 12, 60, 13, C.gold, revCard);
  jk("Mar 2025", FW - 104, 12, 11, C.muted, revCard);
  fr("\"Cape Town is genuinely one of the most affirming places I've ever been.\"",
    12, 76, 11, C.muted, revCard, "Regular", FW - 56);

  // ── Sticky CTA bar (above tab bar)
  const ctaBar = makeFrame("CTA Bar", 0, FH - TAB_H - 64, FW, 64, C.bg, screen);
  makeRect("Save Button", 16, 10, (FW - 48) / 2, 44, C.green, 1, 10, ctaBar);
  jk("Save destination", 28, 22, 13, C.cream, ctaBar, "SemiBold");
  makeOutlineRect("Review Button", 16 + (FW - 48) / 2 + 16, 10, (FW - 48) / 2, 44, C.cream, 10, ctaBar);
  jk("Write a review", 16 + (FW - 48) / 2 + 28, 22, 13, C.cream, ctaBar, "SemiBold");

  makeTabBar(screen, "Destination");
  return screen;
}

// ─── Screen 4: PROFILE ───────────────────────────────────────

function buildProfile(page, ox) {
  const screen = makeFrame("04 — Profile", ox, 0, FW, FH, C.bg, page);

  makeStatusBar(screen);

  // ── Header
  const header = makeFrame("Header", 0, STATUS_H, FW, 56, null, screen);
  fr("My Passport", 16, 10, 28, C.cream, header, "Regular");

  // ── World map placeholder
  const mapY = STATUS_H + 56;
  makeRect("World Map Placeholder", 0, mapY, FW, 180, C.card, 1, 0, screen);
  jk("[ World Map — visited countries highlighted ]", 72, mapY + 82, 12, C.divider, screen);

  // Gold dots for visited countries
  const dots = [
    { x: 70,  y: mapY + 65  },
    { x: 138, y: mapY + 72  },
    { x: 215, y: mapY + 58  },
    { x: 282, y: mapY + 80  },
    { x: 336, y: mapY + 62  },
    { x: 98,  y: mapY + 105 },
  ];
  for (const d of dots) {
    makeCircle("Visited Country Dot", d.x, d.y, 9, C.gold, 1, screen);
  }

  // ── Stats row
  const statsY = mapY + 192;
  const statsFrame = makeFrame("Stats Row", 16, statsY, FW - 32, 48, null, screen);
  const statsData = ["12 Countries", "8 Reviews", "4 Badges"];
  const statW = (FW - 32 - 16) / 3;
  statsData.forEach((stat, i) => {
    const sx = i * (statW + 8);
    makeRect(`Stat BG — ${stat}`, sx, 0, statW, 48, C.card, 1, 24, statsFrame);
    const label = jk(stat, sx, 14, 12, C.cream, statsFrame, "SemiBold", statW);
    label.textAlignHorizontal = "CENTER";
    label.x = sx;
  });

  // ── Badges section
  const badgesY = statsY + 64;
  jk("My Badges", 16, badgesY, 13, C.muted, screen, "SemiBold");
  const badgesRow = makeFrame("Badges Row", 16, badgesY + 24, FW - 32, 80, null, screen);

  const badgeNames = ["Explorer", "Reviewer", "Trailblazer", "Verified"];
  badgeNames.forEach((b, i) => {
    const bx = i * 84;
    const circle = figma.createEllipse();
    circle.name = `Badge — ${b}`;
    circle.x = bx + 4; circle.y = 0;
    circle.resize(52, 52);
    circle.fills = fill(C.card);
    circle.strokes = fill(C.gold);
    circle.strokeWeight = 1.5;
    badgesRow.appendChild(circle);
    jk("★", bx + 20, 14, 20, C.gold, badgesRow);
    const bl = jk(b, bx, 58, 10, C.muted, badgesRow, "Regular", 60);
    bl.textAlignHorizontal = "CENTER";
    bl.x = bx;
  });

  // ── Saved destinations
  const savedY = badgesY + 120;
  jk("Saved Destinations", 16, savedY, 13, C.muted, screen, "SemiBold");
  makeDestCard(screen, 16, savedY + 24, "Lisbon",     "🇵🇹", "8.8", "Safe",    C.safe);
  makeDestCard(screen, 192, savedY + 24, "São Paulo", "🇧🇷", "7.0", "Caution", C.caution);

  // ── Settings
  const settY = savedY + 240;
  const settings = makeFrame("Settings", 16, settY, FW - 32, 112, null, screen);

  // Discreet Mode row
  makeRect("Discreet Row BG", 0, 0, FW - 32, 48, C.card, 1, 10, settings);
  jk("Discreet Mode", 12, 14, 14, C.cream, settings);
  // Purple toggle (on state)
  makeRect("Toggle Track — On", FW - 74, 13, 44, 22, C.purple, 1, 11, settings);
  makeCircle("Toggle Knob — On", FW - 56, 17, 14, C.white, 1, settings);

  // Notifications row
  makeRect("Notifications Row BG", 0, 56, FW - 32, 48, C.card, 1, 10, settings);
  jk("Notifications", 12, 70, 14, C.cream, settings);
  // Grey toggle (off state)
  makeRect("Toggle Track — Off", FW - 74, 69, 44, 22, C.divider, 1, 11, settings);
  makeCircle("Toggle Knob — Off", FW - 90, 73, 14, C.white, 1, settings);

  // Sign out
  jk("Sign out", FW / 2 - 24, settY + 120, 13, C.muted, screen, "Regular");

  makeTabBar(screen, "Profile");
  return screen;
}

// ─── Main ────────────────────────────────────────────────────

(async () => {
  try {
    figma.notify("Loading fonts...", { timeout: 30000 });

    await Promise.all(FONTS.map(f => figma.loadFontAsync(f)));

    const page = figma.currentPage;
    page.name = "KVRD — Phase 1 Wireframes";

    // Remove any existing children (fresh start)
    for (const node of [...page.children]) {
      node.remove();
    }

    figma.notify("Building screens...", { timeout: 30000 });

    buildHome(page, 0);
    buildExplore(page, FW + GAP);
    buildDestination(page, (FW + GAP) * 2);
    buildProfile(page, (FW + GAP) * 3);

    // Zoom to fit all 4 frames
    figma.viewport.scrollAndZoomIntoView(page.children);

    figma.closePlugin("✅ KVRD Phase 1 wireframes created — all 4 screens ready!");
  } catch (err) {
    figma.closePlugin(`❌ Error: ${err.message}`);
  }
})();
