import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import type { TextItem } from 'pdfjs-dist/build/pdf.mjs';

const MAX_CHARS = 80_000;

function workerSrcFromBase(): string {
  const baseEl = document.getElementsByTagName('base')[0]?.href;
  const base = baseEl || `${window.location.origin}/`;
  return new URL('pdfjs/pdf.worker.mjs', base.endsWith('/') ? base : `${base}/`).toString();
}

@Injectable({ providedIn: 'root' })
export class PatientPdfTextExtractService {
  /**
   * Extracts text from a PDF in the browser (patient record, letter, etc.).
   * Image-only scans may return little or no text.
   */
  extractText(file: File): Observable<{ text: string; truncated: boolean; pageCount: number }> {
    if (!file || file.type !== 'application/pdf') {
      const name = file?.name?.toLowerCase() ?? '';
      if (!name.endsWith('.pdf')) {
        return throwError(() => new Error('Please select a PDF file.'));
      }
    }

    return from(this.extractWithPdfJs(file)).pipe(
      map(({ text, pageCount }) => {
        let out = text.replace(/\s+/g, ' ').trim();
        let truncated = false;
        if (out.length > MAX_CHARS) {
          out = out.slice(0, MAX_CHARS);
          truncated = true;
        }
        return { text: out, truncated, pageCount };
      })
    );
  }

  private async extractWithPdfJs(file: File): Promise<{ text: string; pageCount: number }> {
    const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrcFromBase();

    const data = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data, useSystemFonts: true });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const parts: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const line = content.items
        .map((item: TextItem) => ('str' in item && typeof item.str === 'string' ? item.str : ''))
        .filter(Boolean)
        .join(' ');
      parts.push(`[Page ${i}] ${line}`);
    }

    return { text: parts.join('\n'), pageCount: numPages };
  }
}
