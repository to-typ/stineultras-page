import { Event } from "@/types/planner";
import { blockText, buildPlanGrid, PlanGrid, rowLabel } from "./stundenplan-layout";

/**
 * Rendert den Stundenplan als PDF im Stil der LaTeX-Vorlage:
 * A4 quer, Serifenschrift, graue Kopfzeile und Zeitspalte, feste Termine
 * groß in Schwarz, Alternativtermine klein in Grau.
 */

const PAGE = { width: 297, height: 210 };
const MARGIN = { x: 20, y: 20 };
const HEADER_HEIGHT = 14;
const CELL_PADDING = 1.2;
const LINE_HEIGHT = 1.15;
/** Punkt in Millimeter — Schriftgrößen sind pt, das Raster ist mm. */
const PT_TO_MM = 25.4 / 72;

const GRAY_FILL: [number, number, number] = [230, 230, 230];
const LINE_COLOR: [number, number, number] = [0, 0, 0];
const TEXT_COLOR: [number, number, number] = [0, 0, 0];
const MUTED_COLOR: [number, number, number] = [140, 140, 140];

const DAY_NAMES: Record<string, string> = {
  Mo: "Montag",
  Di: "Dienstag",
  Mi: "Mittwoch",
  Do: "Donnerstag",
  Fr: "Freitag",
};

type Doc = import("jspdf").jsPDF;

type TextStyle = {
  maxSize: number;
  minSize: number;
  bold?: boolean;
  color: [number, number, number];
};

/**
 * Setzt Text zentriert in die Zelle und verkleinert die Schrift so lange,
 * bis der (ggf. umbrochene) Text in die Zelle passt.
 */
function drawFittedText(doc: Doc, text: string, x: number, y: number, width: number, height: number, style: TextStyle) {
  const maxWidth = Math.max(width - 2 * CELL_PADDING, 1);
  const maxHeight = Math.max(height - 2 * CELL_PADDING, 1);

  doc.setFont("times", style.bold ? "bold" : "normal");

  const words = text.split(/\s+/);

  let size = style.maxSize;
  let lines: string[] = [text];
  for (; size > style.minSize; size -= 0.5) {
    doc.setFontSize(size);
    lines = doc.splitTextToSize(text, maxWidth);
    const fitsHeight = lines.length * size * PT_TO_MM * LINE_HEIGHT <= maxHeight;
    // Einzelne Wörter dürfen nicht breiter als die Zelle sein, sonst trennt
    // jsPDF mitten im Wort statt an der Leerstelle.
    const fitsWidth = words.every((word) => doc.getTextWidth(word) <= maxWidth);
    if (fitsHeight && fitsWidth) break;
  }

  doc.setFontSize(size);
  doc.setTextColor(...style.color);

  const lineHeight = size * PT_TO_MM * LINE_HEIGHT;
  const firstBaseline = y + height / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    doc.text(line, x + width / 2, firstBaseline + index * lineHeight, {
      align: "center",
      baseline: "middle",
    });
  });
}

function drawCell(doc: Doc, x: number, y: number, width: number, height: number, filled = false) {
  if (filled) {
    doc.setFillColor(...GRAY_FILL);
    doc.rect(x, y, width, height, "FD");
  } else {
    doc.rect(x, y, width, height, "D");
  }
}

function drawGrid(doc: Doc, grid: PlanGrid) {
  const tableWidth = PAGE.width - 2 * MARGIN.x;
  const tableHeight = PAGE.height - 2 * MARGIN.y;
  const colWidth = tableWidth / (grid.days.length + 1);
  const rowCount = grid.endHour - grid.startHour;
  const rowHeight = (tableHeight - HEADER_HEIGHT) / rowCount;

  doc.setDrawColor(...LINE_COLOR);
  doc.setLineWidth(0.2);

  const columnX = (index: number) => MARGIN.x + index * colWidth;
  const rowY = (row: number) => MARGIN.y + HEADER_HEIGHT + row * rowHeight;

  // Kopfzeile: leere Ecke + Wochentage
  drawCell(doc, MARGIN.x, MARGIN.y, colWidth, HEADER_HEIGHT, true);
  grid.days.forEach((day, index) => {
    const x = columnX(index + 1);
    drawCell(doc, x, MARGIN.y, colWidth, HEADER_HEIGHT, true);
    drawFittedText(doc, DAY_NAMES[day.day] ?? day.day, x, MARGIN.y, colWidth, HEADER_HEIGHT, {
      maxSize: 17,
      minSize: 9,
      bold: true,
      color: TEXT_COLOR,
    });
  });

  // Zeitspalte
  for (let row = 0; row < rowCount; row++) {
    const y = rowY(row);
    drawCell(doc, MARGIN.x, y, colWidth, rowHeight, true);
    drawFittedText(doc, rowLabel(grid, row), MARGIN.x, y, colWidth, rowHeight, {
      maxSize: 17,
      minSize: 8,
      bold: true,
      color: TEXT_COLOR,
    });
  }

  // Tagesspalten
  grid.days.forEach((day, dayIndex) => {
    const x = columnX(dayIndex + 1);

    for (let row = 0; row < rowCount; row++) {
      const covering = day.blocks.filter((block) => block.rowStart <= row && row < block.rowEnd);

      // Keine Termine: eine Zelle über die volle Spaltenbreite.
      if (covering.length === 0) {
        drawCell(doc, x, rowY(row), colWidth, rowHeight);
        continue;
      }

      // Parallele Termine teilen sich die Spalte in gleich breite Spuren.
      const lanes = covering[0].lanes;
      const laneWidth = colWidth / lanes;

      for (let lane = 0; lane < lanes; lane++) {
        const block = covering.find((candidate) => candidate.lane === lane);
        const laneX = x + lane * laneWidth;

        if (!block) {
          drawCell(doc, laneX, rowY(row), laneWidth, rowHeight);
          continue;
        }
        // Mehrstündige Termine werden einmal über alle Zeilen gezeichnet.
        if (block.rowStart !== row) continue;

        const blockHeight = (block.rowEnd - block.rowStart) * rowHeight;
        drawCell(doc, laneX, rowY(row), laneWidth, blockHeight);
        drawFittedText(doc, blockText(block), laneX, rowY(row), laneWidth, blockHeight, {
          maxSize: block.muted ? 12 : 17,
          minSize: 6,
          color: block.muted ? MUTED_COLOR : TEXT_COLOR,
        });
      }
    }
  });
}

/** Dateiname ohne Zeichen, die Browser oder Dateisystem stolpern lassen. */
function toFileName(name: string): string {
  const cleaned = name.trim().replace(/[\\/:*?"<>|]/g, "-");
  return `${cleaned || "stundenplan"}.pdf`;
}

/**
 * Baut das PDF-Dokument. jsPDF wird dynamisch geladen, damit die Bibliothek
 * nicht im Initial-Bundle landet.
 */
export async function createStundenplanPdf(events: Event[], planName?: string): Promise<Doc> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setProperties({ title: planName || "Stundenplan", creator: "STiNE Ultras" });
  drawGrid(doc, buildPlanGrid(events));
  return doc;
}

/** Baut das PDF und stößt den Download im Browser an. */
export async function exportPDF(events: Event[], planName?: string) {
  const doc = await createStundenplanPdf(events, planName);
  doc.save(toFileName(planName || "stundenplan"));
}
