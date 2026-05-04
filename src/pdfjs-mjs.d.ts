declare module 'pdfjs-dist/build/pdf.mjs' {
  export const GlobalWorkerOptions: { workerSrc: string };

  export function getDocument(src: { data: ArrayBuffer; useSystemFonts?: boolean }): {
    promise: Promise<PdfDocumentProxy>;
  };

  export interface PdfDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PdfPageProxy>;
  }

  export interface PdfPageProxy {
    getTextContent(): Promise<TextContent>;
  }

  export interface TextContent {
    items: TextItem[];
  }

  export type TextItem = { str?: string } | Record<string, unknown>;
}
