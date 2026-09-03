import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Real PostgreSQL in memory, with only the Supabase Auth identity surface stubbed.
// This does not test hosted Auth, email delivery, or PostgREST configuration.
test('migrations, studio workflows, and tenant isolation', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;
    `);
    const directory = new URL('../supabase/migrations/', import.meta.url);
    for (const file of (await readdir(directory)).filter(f => f.endsWith('.sql')).sort()) {
      // PGlite includes gen_random_uuid; it doesn't bundle the pgcrypto extension.
      const sql = (await readFile(new URL(file, directory), 'utf8'))
        .replace('create extension if not exists "pgcrypto";', '');
      await db.exec(sql);
    }
    const teacher = '00000000-0000-4000-8000-000000000001';
    const student = '00000000-0000-4000-8000-000000000002';
    const outsider = '00000000-0000-4000-8000-000000000003';
    const otherTeacher = '00000000-0000-4000-8000-000000000004';
    for (const [id, email, role] of [[teacher,'teacher@example.test','teacher'],[student,'student@example.test','student'],[outsider,'other@example.test','student'],[otherTeacher,'teacher2@example.test','teacher']]) {
      await db.query('insert into auth.users values ($1, $2, $3)', [id, email, {full_name:role, role}]);
    }
    const asUser = async (id) => {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
      await db.exec('set role authenticated');
    };
    const one = async (sql, args = []) => (await db.query(sql, args)).rows[0];
    await asUser(teacher);
    const studio = await one("select * from create_studio_with_owner('Test studio')");
    assert.equal(studio.owner_id, teacher);
    const invite = await one("select * from create_student_invite($1, 'student@example.test', 'Student')", [studio.id]);
    await asUser(outsider);
    await assert.rejects(db.query('select * from redeem_student_invite($1)', [invite.invite_code]), /different email/);
    await asUser(student);
    await one('select * from redeem_student_invite($1)', [invite.invite_code]);
    await assert.rejects(db.query("select * from create_studio_with_owner('Forbidden')"), /Only teacher/);
    await asUser(teacher);
    const note = await one("select * from create_lesson_note($1, $2, '2026-09-02', 'Scales', 'Breathing', 'Practice slowly', '', 'Five minutes')", [studio.id, student]);
    await one("select * from upsert_studio_hub_page($1, 'Studio Hub', '[]', false)", [studio.id]);
    await asUser(student);
    assert.equal((await db.query('select * from lesson_notes')).rows.length, 1);
    assert.equal((await db.query('select * from studio_hub_pages')).rows.length, 0);
    await one("select * from update_lesson_note_student_notes($1, 'Practiced')", [note.id]);
    await assert.rejects(db.query('select delete_lesson_note($1)', [note.id]), /Only studio teachers/);
    await assert.rejects(db.query("select * from upsert_studio_hub_page($1, 'Forbidden', '[]', true)", [studio.id]), /Only studio teachers/);
    await asUser(teacher);
    assert.equal((await one('select * from lesson_notes')).student_notes, 'Practiced');
    await one("select * from upsert_studio_hub_page($1, 'Studio Hub', '[]', true)", [studio.id]);
    await asUser(student);
    assert.equal((await db.query('select * from studio_hub_pages')).rows.length, 1);
    for (const id of [outsider, otherTeacher]) {
      await asUser(id);
      assert.equal((await db.query('select * from lesson_notes')).rows.length, 0);
      assert.equal((await db.query('select * from studio_hub_pages')).rows.length, 0);
      assert.equal((await db.query('select * from studios')).rows.length, 0);
      await assert.rejects(db.query("select * from update_lesson_note_student_notes($1, 'Forbidden')", [note.id]), /own active studio/);
    }
    await asUser(teacher);
    await db.query('select remove_student_from_studio($1, $2)', [studio.id, student]);
    await asUser(student);
    assert.equal((await db.query('select * from lesson_notes')).rows.length, 0);
    assert.equal((await db.query('select * from studio_hub_pages')).rows.length, 0);
    await assert.rejects(db.query("select * from update_lesson_note_student_notes($1, 'Forbidden')", [note.id]), /own active studio/);
    await asUser(teacher);
    await db.query('select delete_lesson_note($1)', [note.id]);
    assert.equal((await db.query('select * from lesson_notes')).rows.length, 0);
  } finally { await db.close(); }
});
