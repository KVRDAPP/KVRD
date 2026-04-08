// ============================================================
// KVRD App Icon Concepts — Figma Plugin
// Creates three 1024×1024 app icon frames on "App Icon Concepts" page
// Run via: Plugins › Development › Run Last Plugin
// ============================================================

const SIZE = 1024;
const GAP  = 80;

// ─── Brand colours ───────────────────────────────────────────
const C = {
  black:  { r: 10/255,  g: 10/255,  b: 10/255  }, // #0A0A0A
  cream:  { r: 245/255, g: 239/255, b: 230/255  }, // #F5EFE6
  gold:   { r: 201/255, g: 148/255, b: 58/255   }, // #C9943A
  green:  { r: 27/255,  g: 67/255,  b: 50/255   }, // #1B4332
  purple: { r: 155/255, g: 127/255, b: 204/255  }, // #9B7FCC
  rust:   { r: 193/255, g: 105/255, b: 79/255   }, // #C1694F
};

// ─── Primitive helpers ───────────────────────────────────────
function fill(color, opacity = 1) {
  return [{ type: "SOLID", color, opacity }];
}

function makeRect(name, x, y, w, h, color, opacity, radius, parent) {
  const r = figma.createRectangle();
  r.name = name; r.x = x; r.y = y;
  r.resize(w, h);
  r.fills = fill(color, opacity);
  r.strokes = [];
  if (radius > 0) r.cornerRadius = radius;
  if (parent) parent.appendChild(r);
  return r;
}

function makeStrokedRect(name, x, y, w, h, fillColor, fillOpacity, strokeColor, strokeWeight, radius, parent) {
  const r = figma.createRectangle();
  r.name = name; r.x = x; r.y = y;
  r.resize(w, h);
  r.fills = fill(fillColor, fillOpacity);
  r.strokes = fill(strokeColor);
  r.strokeWeight = strokeWeight;
  r.strokeAlign = "INSIDE";
  if (radius > 0) r.cornerRadius = radius;
  if (parent) parent.appendChild(r);
  return r;
}

function makeEllipse(name, cx, cy, radius, color, opacity, parent) {
  const e = figma.createEllipse();
  e.name = name;
  e.x = cx - radius; e.y = cy - radius;
  e.resize(radius * 2, radius * 2);
  e.fills = fill(color, opacity);
  e.strokes = [];
  if (parent) parent.appendChild(e);
  return e;
}

// Renders a horizontal "line" as a centred 5 px filled rectangle
function makeLine(name, x, y, width, color, opacity, parent) {
  const r = figma.createRectangle();
  r.name = name; r.x = x; r.y = y - 2;
  r.resize(width, 5);
  r.fills = fill(color, opacity);
  r.strokes = [];
  if (parent) parent.appendChild(r);
  return r;
}

function makeVector(name, pathData, fillColor, opacity, parent) {
  const v = figma.createVector();
  v.name = name;
  v.vectorPaths = [{ windingRule: "EVENODD", data: pathData }];
  v.fills = fill(fillColor, opacity);
  v.strokes = [];
  if (parent) parent.appendChild(v);
  return v;
}

// Centres text at (centerX, centerY) inside parent frame
function makeText(name, content, family, style, size, color, letterSpacing, parent, centerX, centerY) {
  const t = figma.createText();
  t.name = name;
  t.fontName = { family, style };
  t.fontSize = size;
  t.characters = content;
  t.fills = fill(color);
  t.letterSpacing = { value: letterSpacing, unit: "PIXELS" };
  t.textAlignHorizontal = "CENTER";
  parent.appendChild(t);
  t.x = centerX - t.width  / 2;
  t.y = centerY - t.height / 2;
  return t;
}

function addExportSetting(frame) {
  frame.exportSettings = [{
    format: "PNG",
    suffix: "@2x",
    constraint: { type: "SCALE", value: 2 },
  }];
}

// ─── Frame 1 — "01 Classic Cover" ────────────────────────────
function buildFrame1(page, ox) {
  const frame = figma.createFrame();
  frame.name = "01 Classic Cover";
  frame.resize(SIZE, SIZE);
  frame.x = ox; frame.y = 0;
  frame.cornerRadius = 235;
  frame.clipsContent = true;
  frame.fills = fill(C.black);
  page.appendChild(frame);

  // Book cover
  makeRect("Book Cover", 154, 117, 716, 790, C.green, 1, 43, frame);

  // Spine base + inner overlap shadow
  makeRect("Spine",        154, 117, 112, 790, C.rust, 1,   43, frame);
  makeRect("Spine Shadow", 204, 117,  62, 790, C.rust, 0.7,  0, frame);

  // Three horizontal lines — x 325→790 = 465 px wide
  for (const lineY of [274, 342, 410]) {
    makeLine(`Line ${lineY}`, 325, lineY, 465, C.cream, 0.2, frame);
  }

  // Gold circle  cx=566 cy=539 r=26
  makeEllipse("Circle", 566, 539, 26, C.gold, 1, frame);

  // KVRD title — Fraunces Bold 188 px, centred at (566, 672)
  makeText("KVRD", "KVRD", "Fraunces", "Bold", 188, C.gold, 16, frame, 566, 672);

  addExportSetting(frame);
  return frame;
}

// ─── Frame 2 — "05 Queer Colorway" ───────────────────────────
function buildFrame2(page, ox) {
  const frame = figma.createFrame();
  frame.name = "05 Queer Colorway";
  frame.resize(SIZE, SIZE);
  frame.x = ox; frame.y = 0;
  frame.cornerRadius = 235;
  frame.clipsContent = true;
  frame.fills = fill(C.black);
  page.appendChild(frame);

  // Book outline — 20 % fill + 13 px stroke, both #9B7FCC
  makeStrokedRect("Book Cover", 154, 117, 716, 790, C.purple, 0.2, C.purple, 13, 43, frame);

  // Spine + overlap
  makeRect("Spine",        154, 117, 110, 790, C.purple, 1,   43, frame);
  makeRect("Spine Shadow", 204, 117,  60, 790, C.purple, 0.7,  0, frame);

  // Three lines — x 325→790, #9B7FCC 30 %
  for (const lineY of [274, 342, 410]) {
    makeLine(`Line ${lineY}`, 325, lineY, 465, C.purple, 0.3, frame);
  }

  // KVRD title — cream
  makeText("KVRD", "KVRD", "Fraunces", "Bold", 188, C.cream, 16, frame, 566, 672);

  // Bottom accent line y=718
  makeLine("Bottom Line", 325, 718, 465, C.purple, 0.3, frame);

  // COVERED subtitle — Plus Jakarta Sans SemiBold 52 px, centred at (566, 808)
  makeText("COVERED", "COVERED", "Plus Jakarta Sans", "SemiBold", 52, C.purple, 20, frame, 566, 808);

  addExportSetting(frame);
  return frame;
}

// ─── Frame 3 — "08 Pocket Guide" ─────────────────────────────
function buildFrame3(page, ox) {
  const frame = figma.createFrame();
  frame.name = "08 Pocket Guide";
  frame.resize(SIZE, SIZE);
  frame.x = ox; frame.y = 0;
  frame.cornerRadius = 235;
  frame.clipsContent = true;
  frame.fills = fill(C.green);
  page.appendChild(frame);

  // Book body — rectangle x=175 y=117 w=690 h=790 r=34, right=865, bottom=907
  // Top-right corner is dog-eared: cut from (760,117) diagonally to (865,220)
  // Clockwise path, quarter-circle arcs on the three remaining corners:
  //   top-left:    (175,151) → (209,117)   centre (209,151)
  //   bottom-right:(865,873) → (831,907)   centre (831,873)
  //   bottom-left: (209,907) → (175,873)   centre (209,873)
  const bookPath = [
    "M 209 117",
    "L 760 117",
    "L 865 220",
    "L 865 873",
    "A 34 34 0 0 1 831 907",
    "L 209 907",
    "A 34 34 0 0 1 175 873",
    "L 175 151",
    "A 34 34 0 0 1 209 117",
    "Z",
  ].join(" ");
  makeVector("Book Body", bookPath, C.cream, 0.95, frame);

  // Dog-ear triangle — gold, points (760,117) (865,117) (760,220)
  makeVector("Dog-ear", "M 760 117 L 865 117 L 760 220 Z", C.gold, 0.8, frame);

  // Spine — x=175 y=117 w=86 h=790 r=34
  makeRect("Spine", 175, 117, 86, 790, C.rust, 1, 34, frame);

  // Three lines — x 295→790 = 495 px wide, #1B4332 20 %
  for (const lineY of [376, 444, 512]) {
    makeLine(`Line ${lineY}`, 295, lineY, 495, C.green, 0.2, frame);
  }

  // Map-pin teardrop — centred at (566, 295)
  // Circle centre (566, 265) r=40 → bounding y: 225–365, mid=(225+365)/2=295 ✓
  // Counterclockwise arc over the top of the circle, bezier curves to the point
  const pinPath = [
    "M 566 365",
    "C 546 350 526 330 526 265",
    "A 40 40 0 0 0 606 265",
    "C 606 330 586 350 566 365",
    "Z",
  ].join(" ");
  makeVector("Map Pin", pinPath, C.rust, 1, frame);

  // Inner pin hole — r=22, centred at (566, 265)
  makeEllipse("Pin Hole", 566, 265, 22, C.cream, 1, frame);

  // KVRD title — Fraunces Bold 172 px, #1B4332, centred at (566, 726)
  makeText("KVRD", "KVRD", "Fraunces", "Bold", 172, C.green, 16, frame, 566, 726);

  addExportSetting(frame);
  return frame;
}

// ─── Main ────────────────────────────────────────────────────
(async () => {
  figma.showUI(__html__, { width: 340, height: 220, title: "KVRD App Icon Concepts" });

  // Wire up UI messages before any awaits so nothing is missed
  figma.ui.onmessage = async (msg) => {
    if (msg.type === "export") {
      try {
        figma.ui.postMessage({ type: "status", text: "Exporting frames…" });
        const page = figma.root.children.find(p => p.name === "App Icon Concepts");
        if (!page) {
          figma.ui.postMessage({ type: "error", text: "Page not found. Re-run the plugin." });
          return;
        }
        const exports = [];
        for (const node of page.children) {
          if (node.type !== "FRAME") continue;
          const bytes = await node.exportAsync({
            format: "PNG",
            constraint: { type: "SCALE", value: 2 },
          });
          exports.push({ name: node.name, bytes: Array.from(bytes) });
        }
        figma.ui.postMessage({ type: "download", exports });
      } catch (err) {
        figma.ui.postMessage({ type: "error", text: err.message });
      }
    }

    if (msg.type === "close") {
      figma.closePlugin();
    }
  };

  try {
    figma.ui.postMessage({ type: "status", text: "Loading fonts…" });

    await Promise.all([
      figma.loadFontAsync({ family: "Fraunces",          style: "Bold"     }),
      figma.loadFontAsync({ family: "Plus Jakarta Sans", style: "SemiBold" }),
    ]);

    // Create the page (or clear it if it already exists)
    let page = figma.root.children.find(p => p.name === "App Icon Concepts");
    if (page) {
      for (const node of [...page.children]) node.remove();
    } else {
      page = figma.createPage();
      page.name = "App Icon Concepts";
    }

    figma.ui.postMessage({ type: "status", text: "Building frames…" });

    buildFrame1(page, 0);
    buildFrame2(page, SIZE + GAP);
    buildFrame3(page, (SIZE + GAP) * 2);

    // Switch to the new page and zoom to fit
    figma.currentPage = page;
    figma.viewport.scrollAndZoomIntoView(page.children);

    figma.ui.postMessage({
      type: "done",
      frameNames: page.children.map(n => n.name),
    });
  } catch (err) {
    figma.ui.postMessage({ type: "error", text: err.message });
  }
})();
