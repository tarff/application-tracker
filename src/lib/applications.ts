import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Tables, TablesInsert } from './database.types';

export type Application = Tables<'applications'>;

export const STATUSES = [
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
] as const;

export type StatusFilter = 'all' | (typeof STATUSES)[number]['value'];

export type FormValues = {
  company: string;
  role: string;
  job_url: string;
  date_applied: string;
  status: string;
  notes: string;
};

export type FormErrors = Partial<Record<'company' | 'role' | 'job_url' | 'date_applied', string>>;

// The most rows one request can return: max_rows in supabase/config.toml.
const MAX_ROWS_PER_REQUEST = 1000;

export async function listApplications(client: SupabaseClient<Database>) {
  const applications: Application[] = [];
  while (true) {
    const { data, error, count } = await client
      .from('applications')
      .select('*', { count: 'exact' })
      .order('date_applied', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      // Rows that tie on both dates need a fixed order, or one could repeat or be missed across requests.
      .order('id')
      .range(applications.length, applications.length + MAX_ROWS_PER_REQUEST - 1);
    if (error) return { data: null, error };

    applications.push(...data);
    if (data.length === 0 || applications.length >= (count ?? 0)) {
      return { data: applications, error: null };
    }
  }
}

export function filterByStatus(applications: Application[], filter: StatusFilter) {
  return filter === 'all'
    ? applications
    : applications.filter((application) => application.status === filter);
}

export function countLabel(count: number) {
  return count === 1 ? '1 application' : `${count} applications`;
}

export function statusLabel(value: string) {
  return STATUSES.find((status) => status.value === value)?.label ?? value;
}

// Built from local date parts, because toISOString() gives the UTC date, which is the previous
// day in Melbourne until mid-morning.
export function todayLocal(now = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function isValidJobUrl(url: string) {
  return /^https?:\/\/\S+$/i.test(url);
}

// Parsed as a local date, because new Date('2026-11-06') means UTC midnight and can display as
// the previous day.
function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  const isRealDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isRealDate ? date : null;
}

export function formatDate(value: string | null) {
  const date = value ? parseDate(value) : null;
  return date
    ? date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : 'No date';
}

export function emptyFormValues(now = new Date()): FormValues {
  return {
    company: '',
    role: '',
    job_url: '',
    date_applied: todayLocal(now),
    status: 'applied',
    notes: '',
  };
}

export function toFormValues(application: Application): FormValues {
  return {
    company: application.company,
    role: application.role,
    job_url: application.job_url ?? '',
    date_applied: application.date_applied ?? '',
    status: application.status,
    notes: application.notes ?? '',
  };
}

export function validate(values: FormValues) {
  const errors: FormErrors = {};
  if (!values.company.trim()) errors.company = 'Enter the company.';
  if (!values.role.trim()) errors.role = 'Enter the role.';
  const jobUrl = values.job_url.trim();
  if (jobUrl && !isValidJobUrl(jobUrl)) {
    errors.job_url = 'Enter a link starting with http:// or https://.';
  }
  const date = values.date_applied.trim();
  if (date && !parseDate(date)) {
    errors.date_applied = 'Enter a real date as YYYY-MM-DD, or leave this empty.';
  }
  return errors;
}

export function toRow(values: FormValues): TablesInsert<'applications'> {
  return {
    company: values.company.trim(),
    role: values.role.trim(),
    job_url: values.job_url.trim() || null,
    date_applied: values.date_applied.trim() || null,
    status: values.status,
    notes: values.notes.trim() || null,
  };
}
