// Tests the form and list rules that do not need a database. Run with: npm test
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import {
  countLabel,
  emptyFormValues,
  filterByStatus,
  formatDate,
  isValidJobUrl,
  parseDate,
  toDateValue,
  toFormValues,
  todayLocal,
  toRow,
  validate,
} from '../src/lib/applications.ts';

const originalTimeZone = process.env.TZ;
afterEach(() => {
  process.env.TZ = originalTimeZone;
});

const valid = { ...emptyFormValues(), company: 'Acme', role: 'Engineer' };

test('in early-morning Melbourne, today is the local date and not the UTC date', () => {
  process.env.TZ = 'Australia/Melbourne';
  // 7am on 6 Nov in Melbourne, when UTC is still 5 Nov.
  const now = new Date('2026-11-05T20:00:00Z');
  assert.equal(now.toISOString().slice(0, 10), '2026-11-05');
  assert.equal(todayLocal(now), '2026-11-06');
  assert.equal(emptyFormValues(now).date_applied, '2026-11-06');
});

test('dates pad months and days', () => {
  process.env.TZ = 'UTC';
  assert.equal(todayLocal(new Date('2026-01-02T12:00:00Z')), '2026-01-02');
});

test('a stored date displays as that same day in a timezone behind UTC', () => {
  process.env.TZ = 'America/Los_Angeles';
  assert.match(formatDate('2026-11-06'), /(^|\D)6(\D|$)/);
});

test('a missing date displays as No date', () => {
  assert.equal(formatDate(null), 'No date');
});

for (const url of ['http://a.com', 'https://a.com/job?id=1', 'HTTPS://A.COM']) {
  test(`accepts job link ${url}`, () => assert.equal(isValidJobUrl(url), true));
}

for (const url of [
  'javascript:alert(1)',
  'JaVaScRiPt:alert(1)',
  'data:text/html,hi',
  'ftp://a.com',
  'a.com',
  'https://',
  'x https://a.com',
  'https://a b.com',
]) {
  test(`rejects job link ${url}`, () => assert.equal(isValidJobUrl(url), false));
}

test('a complete form has no errors', () => {
  assert.deepEqual(validate(valid), {});
});

test('empty or blank company and role show errors', () => {
  const errors = validate({ ...valid, company: '   ', role: '' });
  assert.ok(errors.company);
  assert.ok(errors.role);
});

test('an invalid job link shows an error and an empty one does not', () => {
  assert.ok(validate({ ...valid, job_url: 'javascript:alert(1)' }).job_url);
  assert.equal(validate({ ...valid, job_url: '  ' }).job_url, undefined);
});

for (const date of ['06/11/2026', '2026-13-01', '2026-02-30', 'soon', '']) {
  test(`"${date}" opens the picker with no date selected`, () => assert.equal(parseDate(date), null));
}

test('a date chosen in the picker saves as that same day in a timezone ahead of UTC', () => {
  process.env.TZ = 'Australia/Melbourne';
  assert.equal(toDateValue(parseDate('2026-03-15')), '2026-03-15');
});

test('an empty date is allowed and saves as no date', () => {
  const values = { ...valid, date_applied: '' };
  assert.deepEqual(validate(values), {});
  assert.equal(toRow(values).date_applied, null);
});

test('saving trims text and stores empty optional fields as null', () => {
  const row = toRow({ ...valid, company: ' Acme ', role: ' Dev ', job_url: ' ', notes: ' ' });
  assert.equal(row.company, 'Acme');
  assert.equal(row.role, 'Dev');
  assert.equal(row.job_url, null);
  assert.equal(row.notes, null);
});

test('editing shows empty text for missing optional fields', () => {
  const values = toFormValues({
    company: 'Acme',
    role: 'Dev',
    job_url: null,
    date_applied: null,
    status: 'offer',
    notes: null,
  });
  assert.equal(values.job_url, '');
  assert.equal(values.date_applied, '');
  assert.equal(values.status, 'offer');
});

test('the filter returns all rows or only the matching status', () => {
  const rows = [{ status: 'applied' }, { status: 'offer' }, { status: 'applied' }];
  assert.equal(filterByStatus(rows, 'all').length, 3);
  assert.equal(filterByStatus(rows, 'applied').length, 2);
  assert.equal(filterByStatus(rows, 'rejected').length, 0);
});

test('the count reads naturally', () => {
  assert.equal(countLabel(0), '0 applications');
  assert.equal(countLabel(1), '1 application');
  assert.equal(countLabel(2), '2 applications');
});
