import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  LoaderCircle,
  UploadCloud,
} from 'lucide-react';
import {
  exportExcel,
  exportPdf,
  exportWord,
  getCollectionLabel,
  getSupportedCollections,
  parseTransferFile,
  type TransferFormat,
} from '../utils/dataTransfer';
import type { MutableTransferCollection, TransferCollection } from '../context/AppStateContext';
import { useAppState } from '../context/AppStateContext';

type ExportScope = 'all' | 'dossier' | TransferCollection;
type ImportState = 'idle' | 'parsing' | 'ready' | 'importing' | 'done' | 'error';

const dossierCollections: TransferCollection[] = [
  'customers',
  'subscriptions',
  'activeServices',
  'networkConfigs',
  'billingAccounts',
  'invoices',
  'customerPrices',
  'documents',
  'auditLogs',
];

const formatLabels: Record<TransferFormat, string> = {
  xlsx: 'Excel workbook (.xlsx)',
  docx: 'Word document (.docx)',
  pdf: 'PDF document (.pdf)',
};

const collectionOrder = getSupportedCollections();

function toTransferRecords<T extends object>(records: T[]): Array<Record<string, unknown>> {
  return records.map((record) => {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) result[key] = value;
    return result;
  });
}

export const DataImportPage: React.FC = () => {
  const app = useAppState();
  const [scope, setScope] = useState<ExportScope>('all');
  const [format, setFormat] = useState<TransferFormat>('xlsx');
  const [file, setFile] = useState<File | null>(null);
  const [importState, setImportState] = useState<ImportState>('idle');
  const [bundle, setBundle] = useState<Awaited<ReturnType<typeof parseTransferFile>> | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');

  const collections = useMemo(() => {
    const available: Record<TransferCollection, Array<Record<string, unknown>>> = {
      customers: toTransferRecords(app.customers),
      products: toTransferRecords(app.products),
      leads: toTransferRecords(app.leads),
      opportunities: toTransferRecords(app.opportunities),
      presales: toTransferRecords(app.presales),
      documents: toTransferRecords(app.documents),
      approvals: toTransferRecords(app.approvals),
      serviceDeliveries: toTransferRecords(app.serviceDeliveries),
      activeServices: toTransferRecords(app.activeServices),
      subscriptions: toTransferRecords(app.subscriptions),
      networkConfigs: toTransferRecords(app.networkConfigs),
      standardPrices: toTransferRecords(app.standardPrices),
      customerPrices: toTransferRecords(app.customerPrices),
      billingAccounts: toTransferRecords(app.billingAccounts),
      invoices: toTransferRecords(app.invoices),
      tasks: toTransferRecords(app.tasks),
      auditLogs: toTransferRecords(app.auditLogs),
    };
    return available;
  }, [
    app.activeServices,
    app.approvals,
    app.auditLogs,
    app.billingAccounts,
    app.customerPrices,
    app.customers,
    app.documents,
    app.invoices,
    app.leads,
    app.networkConfigs,
    app.opportunities,
    app.presales,
    app.products,
    app.serviceDeliveries,
    app.standardPrices,
    app.subscriptions,
    app.tasks,
  ]);

  const selectedCollections = useMemo(() => {
    if (scope === 'all') return collectionOrder;
    if (scope === 'dossier') return dossierCollections;
    return [scope];
  }, [scope]);

  const onExport = async () => {
    setError('');
    setResult('');
    try {
      const payload = Object.fromEntries(
        selectedCollections.map((collection) => [collection, collections[collection]]),
      ) as Partial<Record<TransferCollection, Array<Record<string, unknown>>>>;
      const label = scope === 'all'
        ? 'All Enterprise Modules'
        : scope === 'dossier'
          ? 'Customer Dossiers'
          : getCollectionLabel(scope);
      if (format === 'xlsx') await exportExcel(payload, label);
      else if (format === 'docx') await exportWord(payload, label);
      else await exportPdf(payload, label);
      setResult(`${label} exported as ${formatLabels[format]}.`);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'The export could not be created.');
    }
  };

  const onChooseFile = async (selectedFile?: File) => {
    setFile(selectedFile || null);
    setBundle(null);
    setError('');
    setResult('');
    if (!selectedFile) {
      setImportState('idle');
      return;
    }
    setImportState('parsing');
    try {
      const parsed = await parseTransferFile(selectedFile);
      setBundle(parsed);
      setImportState('ready');
    } catch (parseError) {
      setImportState('error');
      setError(parseError instanceof Error ? parseError.message : 'The selected file could not be read.');
    }
  };

  const onImport = async () => {
    if (!bundle) return;
    setImportState('importing');
    setError('');
    try {
      let added = 0;
      let updated = 0;
      const mutableCollections = Object.keys(bundle.collections)
        .filter((collection): collection is MutableTransferCollection => collection !== 'auditLogs')
        .sort((a, b) => {
          if (a === 'customers') return -1;
          if (b === 'customers') return 1;
          return collectionOrder.indexOf(a) - collectionOrder.indexOf(b);
        });

      for (const collection of mutableCollections) {
        const summary = app.importRecords(collection, bundle.collections[collection] || []);
        added += summary.added;
        updated += summary.updated;
      }
      const auditCount = bundle.collections.auditLogs?.length || 0;
      const skipped = auditCount ? ` ${auditCount} audit history record(s) were not imported because audit history is read-only.` : '';
      setResult(`Imported ${added} new record(s) and updated ${updated} existing record(s).${skipped}`);
      setImportState('done');
    } catch (importError) {
      setImportState('error');
      setError(importError instanceof Error ? importError.message : 'The selected data could not be imported.');
    }
  };

  const totalRecords = bundle
    ? Object.values(bundle.collections).reduce((count, records) => count + (records?.length || 0), 0)
    : 0;
  const previewRecords = bundle
    ? Object.entries(bundle.collections).flatMap(([collection, records]) =>
      (records || []).slice(0, 3).map((record) => ({
        collection: getCollectionLabel(collection as TransferCollection),
        record,
      })))
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-7 pb-12">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Data management center</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Import &amp; Export</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Transfer customer dossiers or complete app modules. Excel exports are editable spreadsheets; imported rows
          are merged by ID so you can continue editing them in their normal app pages.
        </p>
      </header>

      {app.databaseSyncError && (
        <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Shared database synchronization is reporting an error: {app.databaseSyncError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-amber-100 p-2 text-amber-800"><Download size={20} /></div>
            <div>
              <h2 className="font-semibold text-slate-900">Export app data</h2>
              <p className="mt-1 text-sm text-slate-600">Choose the records and file format to download.</p>
            </div>
          </div>

          <label className="mt-5 block text-sm font-medium text-slate-700" htmlFor="export-scope">Data to export</label>
          <select
            id="export-scope"
            value={scope}
            onChange={(event) => setScope(event.target.value as ExportScope)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
          >
            <option value="all">All app modules</option>
            <option value="dossier">Customer dossiers and related records</option>
            {collectionOrder.map((collection) => (
              <option key={collection} value={collection}>{getCollectionLabel(collection)}</option>
            ))}
          </select>

          <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="export-format">File format</label>
          <select
            id="export-format"
            value={format}
            onChange={(event) => setFormat(event.target.value as TransferFormat)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
          >
            {Object.entries(formatLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            {format === 'xlsx'
              ? 'Excel workbooks use one sheet per module. You can edit cells and import the workbook again.'
              : 'Word and PDF exports include a data section for app round-trips. Edit imported records in the relevant app module.'}
            {' '}Audit history is included in exports but is never imported.
          </div>
          <button
            type="button"
            onClick={onExport}
            disabled={!app.databaseReady}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-900 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={17} /> Export {format.toUpperCase()}
          </button>
          {!app.databaseReady && <p className="mt-2 text-xs text-slate-500">Waiting for shared customer data to load.</p>}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-sky-100 p-2 text-sky-800"><UploadCloud size={20} /></div>
            <div>
              <h2 className="font-semibold text-slate-900">Import data</h2>
              <p className="mt-1 text-sm text-slate-600">Select an app export and review its records before merging.</p>
            </div>
          </div>

          <label
            htmlFor="transfer-file"
            className="mt-5 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 text-center hover:border-amber-400 hover:bg-amber-50"
          >
            {importState === 'parsing'
              ? <LoaderCircle className="mb-2 animate-spin text-amber-700" />
              : <UploadCloud className="mb-2 text-slate-500" />}
            <span className="text-sm font-medium text-slate-800">{file?.name || 'Choose an .xlsx, .docx, or .pdf file'}</span>
            <span className="mt-1 text-xs text-slate-500">PDF and Word imports must be exported from this app.</span>
            <input
              id="transfer-file"
              type="file"
              accept=".xlsx,.docx,.pdf"
              className="sr-only"
              onChange={(event) => { void onChooseFile(event.target.files?.[0]); }}
            />
          </label>

          {bundle && (
            <div className="mt-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <span className="font-semibold text-slate-800">Import preview</span>
                <span className="text-slate-600">{totalRecords} record(s)</span>
              </div>
              <div className="max-h-56 overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-white text-slate-500">
                    <tr><th className="px-3 py-2 font-medium">Module</th><th className="px-3 py-2 font-medium">ID</th><th className="px-3 py-2 font-medium">Preview</th></tr>
                  </thead>
                  <tbody>
                    {previewRecords.map(({ collection, record }, index) => (
                      <tr key={`${collection}-${String(record.id)}-${index}`} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium text-slate-700">{collection}</td>
                        <td className="px-3 py-2 text-slate-600">{String(record.id)}</td>
                        <td className="max-w-48 truncate px-3 py-2 text-slate-500">{JSON.stringify(record)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalRecords > previewRecords.length && (
                  <p className="px-3 py-2 text-xs text-slate-500">Showing up to three sample rows per module.</p>
                )}
              </div>
              <p className="border-t border-slate-200 px-3 py-2 text-xs text-slate-500">
                Matching IDs update existing records; other IDs are added. Audit history remains read-only.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => { void onImport(); }}
            disabled={importState !== 'ready' || !bundle}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {importState === 'importing' ? <LoaderCircle size={17} className="animate-spin" /> : <FileSpreadsheet size={17} />}
            {importState === 'importing' ? 'Importing…' : 'Import reviewed records'}
          </button>
        </section>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" /> <span>{error}</span>
        </div>
      )}
      {result && (
        <div role="status" className="flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> <span>{result}</span>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <FileText size={18} className="mt-0.5 shrink-0 text-slate-500" />
        <p>
          Supported formats: editable Excel workbook, and Word/PDF files produced by this app. Data changes are merged
          by record ID; imported records remain available to edit in their regular module screens.
        </p>
      </div>
    </div>
  );
};
