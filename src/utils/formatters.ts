/**
 * MTN ENTERPRISE HUB - UTILITY FORMATTERS & HELPERS
 */

/**
 * Format numbers as Ghanaian Cedis (GHS)
 * Example: 450000 -> "GH₵ 450,000"
 */
export function formatCurrencyGHS(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return 'GH₵ 0';
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 0,
  }).format(amount).replace('GHS', 'GH₵');
}

/**
 * Format ISO dates to clean human-readable Ghanaian enterprise format
 * Example: "2026-09-18T17:00:00Z" -> "18 Sep 2026"
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

/**
 * Color classes for opportunity pipeline stages
 */
export function getStageColor(stage: string): { bg: string; text: string; border: string } {
  switch (stage) {
    case 'New':
      return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' };
    case 'Qualification':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'Discovery':
      return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
    case 'Presales':
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' };
    case 'Proposal':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case 'Negotiation':
      return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    case 'Won':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' };
    case 'Lost':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
  }
}

/**
 * Priority badge styling
 */
export function getPriorityColor(priority: string): { bg: string; text: string } {
  switch (priority) {
    case 'Critical':
      return { bg: 'bg-red-100', text: 'text-red-800' };
    case 'High':
      return { bg: 'bg-orange-100', text: 'text-orange-800' };
    case 'Medium':
      return { bg: 'bg-amber-100', text: 'text-amber-800' };
    case 'Low':
      return { bg: 'bg-slate-100', text: 'text-slate-700' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
  }
}

/**
 * Category badge styling (Mobile, Fixed, Digital, Converged)
 */
export function getCategoryBadge(category: string): { bg: string; text: string; iconBg: string } {
  switch (category) {
    case 'Fixed':
      return { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700', iconBg: 'bg-blue-500' };
    case 'Converged':
      return { bg: 'bg-amber-50 text-amber-900 border-amber-200', text: 'text-amber-800', iconBg: 'bg-mtn-yellow' };
    case 'Digital':
      return { bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-700', iconBg: 'bg-purple-500' };
    case 'Mobile':
      return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700', iconBg: 'bg-emerald-500' };
    default:
      return { bg: 'bg-gray-50 text-gray-700 border-gray-200', text: 'text-gray-700', iconBg: 'bg-gray-500' };
  }
}
