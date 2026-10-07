import { groupItemsIntoLines, type PdfLine, type PdfTextItem } from "./dominio-coa";

/** Subconjunto do PDFDocumentProxy do pdfjs usado aqui; vale para o build normal e o legacy. */
export type PdfDocumentLike = {
  numPages: number;
  getPage(pageNumber: number): Promise<{
    getTextContent(): Promise<{ items: unknown[] }>;
  }>;
};

function isTextItem(item: unknown): item is { str: string; transform: number[] } {
  return typeof item === "object" && item !== null && "str" in item && "transform" in item;
}

export async function extractLinesFromDocument(doc: PdfDocumentLike): Promise<PdfLine[]> {
  const lines: PdfLine[] = [];
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const items: PdfTextItem[] = content.items
      .filter(isTextItem)
      .map((item) => ({ str: item.str, x: item.transform[4] ?? 0, y: item.transform[5] ?? 0 }));
    lines.push(...groupItemsIntoLines(pageNumber, items));
  }
  return lines;
}

/** Só roda no navegador: o pdfjs e o worker são carregados sob demanda. */
export async function extractPdfLines(buffer: ArrayBuffer): Promise<PdfLine[]> {
  const [pdfjs, worker] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const task = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  try {
    return await extractLinesFromDocument(await task.promise);
  } finally {
    void task.destroy();
  }
}
