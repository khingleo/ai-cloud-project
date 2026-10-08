import type ExcelJS from 'exceljs';
import type { TransferCollection } from '../context/AppStateContext';

export type TransferFormat = 'xlsx' | 'docx' | 'pdf';
export type TransferBundle = {
  format: 'mtn-enterprise-hub-data';
  version: 1;
  exportedAt: string;
  collections: Partial<Record<TransferCollection, Array<Record<string, unknown>>>>;
};

const DOCX_START = 'MTN_HUB_JSON_START';
const DOCX_END = 'MTN_HUB_JSON_END';
const PDF_START = 'MTN_HUB_BASE64_START';
const PDF_END = 'MTN_HUB_BASE64_END';
const wordNamespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

const collectionLabels: Record<TransferCollection, string> = {
  customers: 'Customers',
  products: 'Products & Services Catalogue',
  leads: 'Leads',
  opportunities: 'Opportunities',
  presales: 'Presales Requests',
  documents: 'Document Metadata',
  approvals: 'Approvals',
  serviceDeliveries: 'Service Deliveries',
  activeServices: 'Active Services',
  subscriptions: 'Subscriptions',
  networkConfigs: 'Network & Circuit Configurations',
  standardPrices: 'Standard Tariffs',
  customerPrices: 'Customer-specific Pricing',
  billingAccounts: 'Billing Accounts',
  invoices: 'Invoices',
  tasks: 'Tasks',
  auditLogs: 'Audit History (read-only)',
};

function toBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(value: string): string {
  const binary = atob(value.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function createBundle(
  data: Partial<Record<TransferCollection, Array<Record<string, unknown>>>>,
): TransferBundle {
  return {
    format: 'mtn-enterprise-hub-data',
    version: 1,
    exportedAt: new Date().toISOString(),
    collections: data,
  };
}

function parseBundle(value: unknown): TransferBundle {
  if (
    !value || typeof value !== 'object'
    || (value as Record<string, unknown>).format !== 'mtn-enterprise-hub-data'
    || (value as Record<string, unknown>).version !== 1
    || !(value as Record<string, unknown>).collections
    || typeof (value as Record<string, unknown>).collections !== 'object'
  ) {
    throw new Error('This file does not contain a supported MTN Enterprise Hub data export.');
  }

  const input = (value as { collections: Record<string, unknown> }).collections;
  const collections: Partial<Record<TransferCollection, Array<Record<string, unknown>>>> = {};
  for (const collection of Object.keys(collectionLabels) as TransferCollection[]) {
    const records = input[collection];
    if (records === undefined) continue;
    if (!Array.isArray(records)) {
      throw new Error(`The ${collectionLabels[collection]} section is not a valid record list.`);
    }
    const seen = new Set<string>();
    const validRecords = records.filter((record): record is Record<string, unknown> => {
      if (!record || typeof record !== 'object' || Array.isArray(record)) return false;
      const id = (record as Record<string, unknown>).id;
      if (typeof id !== 'string' || !id.trim() || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    if (validRecords.length !== records.length) {
      throw new Error(`${collectionLabels[collection]} contains records with missing or duplicate IDs.`);
    }
    collections[collection] = validRecords;
  }

  if (Object.keys(collections).length === 0) {
    throw new Error('No supported data modules were found in this file.');
  }
  return {
    format: 'mtn-enterprise-hub-data',
    version: 1,
    exportedAt: String((value as Record<string, unknown>).exportedAt || ''),
    collections,
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFilename(label: string): string {
  return label.replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '') || 'Enterprise_Data';
}

function excelCellValue(value: unknown): ExcelJS.CellValue {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  return String(value);
}

export async function exportExcel(
  data: Partial<Record<TransferCollection, Array<Record<string, unknown>>>>,
  label: string,
) {
  const { default: ExcelJS } = await import('exceljs');
  const bundle = createBundle(data);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MTN Enterprise Hub';
  workbook.created = new Date(bundle.exportedAt);
  const metadata = workbook.addWorksheet('_MTN_Hub_Info');
  metadata.addRows([
    ['Format', bundle.format],
    ['Version', bundle.version],
    ['Exported at', bundle.exportedAt],
    ['Import behavior', 'Rows with matching IDs update existing records; new IDs are added.'],
    ['Nested values', 'Arrays and objects are stored as JSON text in their cells.'],
  ]);
  metadata.getColumn(1).width = 25;
  metadata.getColumn(2).width = 100;
  metadata.getRow(1).font = { bold: true };

  for (const [collection, records] of Object.entries(bundle.collections) as [
    TransferCollection,
    Array<Record<string, unknown>>,
  ][]) {
    const worksheet = workbook.addWorksheet(collection.slice(0, 31));
    const keys = Array.from(new Set(['id', ...records.flatMap((record) => Object.keys(record))]));
    worksheet.addRow(keys);
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FF101828' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCC00' } };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: keys.length } };
    for (const record of records) {
      worksheet.addRow(keys.map((key) => excelCellValue(record[key])));
    }
    worksheet.columns = keys.map((key) => ({
      header: key,
      key,
      width: Math.min(Math.max(key.length + 4, 16), 42),
    }));
  }

  const content = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([content as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${safeFilename(label)}.xlsx`,
  );
}

export async function exportWord(
  data: Partial<Record<TransferCollection, Array<Record<string, unknown>>>>,
  label: string,
) {
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import('docx');
  const bundle = createBundle(data);
  const children: InstanceType<typeof Paragraph>[] = [
    new Paragraph({ text: 'MTN Ghana Enterprise Hub', heading: HeadingLevel.TITLE }),
    new Paragraph({ text: `${label} data export`, heading: HeadingLevel.HEADING_1 }),
    new Paragraph(`Exported ${new Date(bundle.exportedAt).toLocaleString()}`),
    new Paragraph('Edit the data in the sections below. Keep each record ID unchanged to update that record when importing.'),
  ];
  for (const [collection, records] of Object.entries(bundle.collections) as [
    TransferCollection,
    Array<Record<string, unknown>>,
  ][]) {
    children.push(new Paragraph({ text: `${collectionLabels[collection]} (${records.length})`, heading: HeadingLevel.HEADING_2 }));
    records.forEach((record) => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${record.id}: `, bold: true }),
          new TextRun(JSON.stringify(record)),
        ],
        spacing: { after: 140 },
      }));
    });
    if (records.length === 0) children.push(new Paragraph('No records.'));
  }

  children.push(
    new Paragraph({ text: 'MTN Enterprise Hub import data (JSON)', heading: HeadingLevel.HEADING_1 }),
    new Paragraph(DOCX_START),
    ...JSON.stringify(bundle).match(/.{1,1200}/g)?.map((chunk) => new Paragraph(chunk)) || [],
    new Paragraph(DOCX_END),
  );
  const document = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(document);
  downloadBlob(blob, `${safeFilename(label)}.docx`);
}

export async function exportPdf(
  data: Partial<Record<TransferCollection, Array<Record<string, unknown>>>>,
  label: string,
) {
  const { jsPDF } = await import('jspdf');
  const bundle = createBundle(data);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  doc.setFillColor(255, 204, 0);
  doc.rect(0, 0, pageWidth, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('MTN Ghana Enterprise Hub', margin, 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`${label} data export`, margin, 34);
  doc.setFontSize(9);
  doc.text(`Generated ${new Date(bundle.exportedAt).toLocaleString()}`, margin, 41);
  doc.text('Data summary', margin, 54);
  let y = 62;
  doc.setFontSize(10);
  for (const [collection, records] of Object.entries(bundle.collections) as [
    TransferCollection,
    Array<Record<string, unknown>>,
  ][]) {
    if (y > pageHeight - 22) {
      doc.addPage();
      y = 18;
    }
    doc.text(`${collectionLabels[collection]}: ${records.length} record(s)`, margin, y);
    y += 7;
  }
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('MTN_HUB_BASE64_START', margin, 14);
  doc.setFont('courier', 'normal');
  doc.setFontSize(6);
  y = 19;
  const payload = toBase64(JSON.stringify(bundle));
  for (let offset = 0; offset < payload.length; offset += 100) {
    if (y > pageHeight - 12) {
      doc.addPage();
      y = 14;
    }
    doc.text(payload.slice(offset, offset + 100), margin, y);
    y += 4;
  }
  if (y > pageHeight - 18) {
    doc.addPage();
    y = 14;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('MTN_HUB_BASE64_END', margin, y + 2);
  doc.setProperties({ title: `${label} - MTN Enterprise Hub`, creator: 'MTN Enterprise Hub' });
  doc.save(`${safeFilename(label)}.pdf`);
}

function parseCell(value: ExcelJS.CellValue): unknown {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if ('result' in value) return parseCell(value.result as ExcelJS.CellValue);
    if ('text' in value && typeof value.text === 'string') return value.text;
    if ('richText' in value && Array.isArray(value.richText)) return value.richText.map((part) => part.text).join('');
    return JSON.stringify(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try { return JSON.parse(trimmed); } catch { return value; }
    }
  }
  return value;
}

async function parseExcel(file: File): Promise<TransferBundle> {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const collections: Partial<Record<TransferCollection, Array<Record<string, unknown>>>> = {};
  const knownCollections = Object.keys(collectionLabels) as TransferCollection[];
  for (const worksheet of workbook.worksheets) {
    const collection = knownCollections.find((key) => key === worksheet.name);
    if (!collection) continue;
    const headers = worksheet.getRow(1).values as Array<ExcelJS.CellValue>;
    const keys = headers.slice(1).map((cell) => String(cell ?? '').trim());
    if (!keys.includes('id')) continue;
    const records: Array<Record<string, unknown>> = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const record: Record<string, unknown> = {};
      keys.forEach((key, index) => {
        if (key) record[key] = parseCell(row.getCell(index + 1).value);
      });
      if (record.id !== undefined && record.id !== '') records.push(record);
    });
    if (records.length) collections[collection] = records;
  }
  return parseBundle({ format: 'mtn-enterprise-hub-data', version: 1, collections });
}

async function parseWord(file: File): Promise<TransferBundle> {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const documentXml = await zip.file('word/document.xml')?.async('text');
  if (!documentXml) throw new Error('The Word document does not contain a readable document body.');
  const xml = new DOMParser().parseFromString(documentXml, 'application/xml');
  if (xml.querySelector('parsererror')) throw new Error('The Word document contains invalid XML.');
  const paragraphs = Array.from(xml.getElementsByTagNameNS(wordNamespace, 'p')).map((paragraph) =>
    Array.from(paragraph.getElementsByTagNameNS(wordNamespace, 't')).map((node) => node.textContent || '').join(''));
  const start = paragraphs.indexOf(DOCX_START);
  const end = paragraphs.indexOf(DOCX_END, start + 1);
  if (start === -1 || end === -1) {
    throw new Error('Import Word files exported from MTN Enterprise Hub. For manually prepared editable data, use Excel.');
  }
  return parseBundle(JSON.parse(paragraphs.slice(start + 1, end).join('')));
}

async function parsePdf(file: File): Promise<TransferBundle> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();
  const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const lines: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    lines.push(...content.items.map((item) => 'str' in item ? item.str : ''));
  }
  const text = lines.join('\n');
  const start = text.indexOf(PDF_START);
  const end = text.indexOf(PDF_END, start + PDF_START.length);
  if (start === -1 || end === -1) {
    throw new Error('Import PDF files exported from MTN Enterprise Hub. Use Excel for third-party or manually prepared data.');
  }
  return parseBundle(JSON.parse(fromBase64(text.slice(start + PDF_START.length, end))));
}

export async function parseTransferFile(file: File): Promise<TransferBundle> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'xlsx') return parseExcel(file);
  if (extension === 'docx') return parseWord(file);
  if (extension === 'pdf') return parsePdf(file);
  throw new Error('Choose an .xlsx, .docx, or MTN Enterprise Hub .pdf export.');
}

export function getCollectionLabel(collection: TransferCollection): string {
  return collectionLabels[collection];
}

export function getSupportedCollections(): TransferCollection[] {
  return Object.keys(collectionLabels) as TransferCollection[];
}
