// Tests the live database through its public API, using only the publishable key.
// Run with: npm run test:rls
// Each run signs up two throwaway users. Their rows are deleted at the end, but the users stay
// until removed in the Supabase dashboard, because deleting them needs the service role key.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';

import { createClient } from '@supabase/supabase-js';

import { listApplications } from '../../src/lib/applications.ts';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const newClient = () => createClient(url, key, { auth: { persistSession: false } });

const anon = newClient();
const userA = newClient();
const userB = newClient();
let idA;
let idB;
let rowA;

async function signUp(client) {
  const { data, error } = await client.auth.signUp({
    email: `rls-test-${randomUUID()}@example.com`,
    password: randomUUID(),
  });
  assert.ifError(error);
  assert.ok(data.session, 'Sign-up gave no session. Is Confirm email turned off?');
  return data.user.id;
}

async function rowInDatabase(id) {
  const { data, error } = await userA.from('applications').select().eq('id', id).maybeSingle();
  assert.ifError(error);
  return data;
}

before(async () => {
  idA = await signUp(userA);
  idB = await signUp(userB);
  const { data, error } = await userA
    .from('applications')
    .insert({ company: 'Acme', role: 'Engineer', notes: 'private note' })
    .select()
    .single();
  assert.ifError(error);
  rowA = data;
});

after(async () => {
  await userA.from('applications').delete().eq('user_id', idA);
  await userB.from('applications').delete().eq('user_id', idB);
});

test('a wrong password returns the code the sign-in form expects', async () => {
  const { data } = await userA.auth.getUser();
  const { error } = await anon.auth.signInWithPassword({
    email: data.user.email,
    password: randomUUID(),
  });
  assert.equal(error?.code, 'invalid_credentials');
});

test('an email already in use returns a code the sign-up form expects', async () => {
  const { data } = await userA.auth.getUser();
  const { error } = await newClient().auth.signUp({
    email: data.user.email,
    password: randomUUID(),
  });
  assert.ok(['email_exists', 'user_already_exists'].includes(error?.code), `Got ${error?.code}`);
});

test('a weak password returns the code the sign-up form expects', async () => {
  const { error } = await newClient().auth.signUp({
    email: `rls-test-${randomUUID()}@example.com`,
    password: 'a',
  });
  assert.equal(error?.code, 'weak_password');
  assert.ok(error.message, 'The form shows this message, so it must not be empty');
});

test('a new row gets the signed-in user, default status and database timestamps', () => {
  assert.equal(rowA.user_id, idA);
  assert.equal(rowA.status, 'applied');
  assert.ok(rowA.created_at);
  assert.ok(rowA.updated_at);
});

test('a client cannot set created_at, and updated_at changes on every update', async () => {
  const { data, error } = await userA
    .from('applications')
    .update({ notes: 'changed', created_at: '2000-01-01T00:00:00Z' })
    .eq('id', rowA.id)
    .select()
    .single();
  assert.ifError(error);
  assert.equal(data.created_at, rowA.created_at);
  assert.ok(new Date(data.updated_at) > new Date(rowA.updated_at));
});

for (const [name, values] of [
  ['empty company', { company: '', role: 'Engineer' }],
  ['blank company', { company: ' \t ', role: 'Engineer' }],
  ['missing company', { role: 'Engineer' }],
  ['empty role', { company: 'Acme', role: '' }],
  ['blank role', { company: 'Acme', role: '   ' }],
  ['missing role', { company: 'Acme' }],
  ['unknown status', { company: 'Acme', role: 'Engineer', status: 'ghosted' }],
  ['javascript: link', { company: 'Acme', role: 'Engineer', job_url: 'javascript:alert(1)' }],
  ['data: link', { company: 'Acme', role: 'Engineer', job_url: 'data:text/html,hi' }],
  ['link with no scheme', { company: 'Acme', role: 'Engineer', job_url: 'example.com/job' }],
  ['http later in the link', { company: 'Acme', role: 'Engineer', job_url: 'x http://a.com' }],
]) {
  test(`the database rejects ${name}`, async () => {
    const { data, error } = await userA.from('applications').insert(values).select();
    assert.ok(error, `Expected an error but got ${JSON.stringify(data)}`);
  });
}

for (const job_url of ['http://example.com/job', 'https://example.com/job']) {
  test(`the database accepts ${job_url}`, async () => {
    const { error } = await userA
      .from('applications')
      .insert({ company: 'Acme', role: 'Engineer', job_url });
    assert.ifError(error);
  });
}

test('the database accepts every status value', async () => {
  for (const status of ['applied', 'interview', 'offer', 'rejected', 'withdrawn']) {
    const { error } = await userA
      .from('applications')
      .insert({ company: 'Acme', role: 'Engineer', status });
    assert.ifError(error);
  }
});

test('the list sorts newest date first, with no date last', async () => {
  const sorter = newClient();
  await signUp(sorter);
  const dates = ['2026-01-15', null, '2026-03-20', '2025-12-01'];
  for (const date_applied of dates) {
    const { error } = await sorter
      .from('applications')
      .insert({ company: 'Sort', role: 'Test', date_applied });
    assert.ifError(error);
  }
  const { data, error } = await listApplications(sorter);
  assert.ifError(error);
  assert.deepEqual(
    data.map((row) => row.date_applied),
    ['2026-03-20', '2026-01-15', '2025-12-01', null],
  );
  await sorter.from('applications').delete().eq('company', 'Sort');
});

test('User B cannot see User A rows', async () => {
  const { data, error } = await userB.from('applications').select();
  assert.ifError(error);
  assert.deepEqual(data, []);
});

test('User B cannot edit User A rows', async () => {
  const { data } = await userB
    .from('applications')
    .update({ notes: 'hacked' })
    .eq('id', rowA.id)
    .select();
  assert.deepEqual(data ?? [], []);
  assert.notEqual((await rowInDatabase(rowA.id)).notes, 'hacked');
});

test('User B cannot delete User A rows', async () => {
  const { data } = await userB.from('applications').delete().eq('id', rowA.id).select();
  assert.deepEqual(data ?? [], []);
  assert.ok(await rowInDatabase(rowA.id));
});

test('User B cannot add a row under User A', async () => {
  const { error } = await userB
    .from('applications')
    .insert({ user_id: idA, company: 'Fake', role: 'Fake' });
  assert.ok(error);
});

test('User A cannot move a row to User B', async () => {
  const { error } = await userA
    .from('applications')
    .update({ user_id: idB })
    .eq('id', rowA.id)
    .select();
  assert.ok(error);
  assert.equal((await rowInDatabase(rowA.id)).user_id, idA);
});

test('with no sign-in, reading returns no applications', async () => {
  const { data } = await anon.from('applications').select();
  assert.deepEqual(data ?? [], []);
});

test('with no sign-in, adding, editing and deleting all fail', async () => {
  const insert = await anon.from('applications').insert({ company: 'Fake', role: 'Fake' });
  assert.ok(insert.error);
  const update = await anon
    .from('applications')
    .update({ notes: 'hacked' })
    .eq('id', rowA.id)
    .select();
  assert.deepEqual(update.data ?? [], []);
  const remove = await anon.from('applications').delete().eq('id', rowA.id).select();
  assert.deepEqual(remove.data ?? [], []);
  const row = await rowInDatabase(rowA.id);
  assert.ok(row);
  assert.notEqual(row.notes, 'hacked');
});
