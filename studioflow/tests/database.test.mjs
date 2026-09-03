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
      create schema storage;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security;
      create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1,'/') $$;
      grant usage on schema storage to authenticated;
      grant select,insert,delete on storage.objects to authenticated;
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
    // Real RLS and column grants for communication, scheduling, files, and avatars.
    await asUser(teacher);
    await db.query('update profiles set avatar_path=$1 where id=$2', [teacher+'/photo.webp',teacher]);
    await assert.rejects(db.query("update profiles set role='teacher' where id=$1",[student]), /permission denied/);
    await db.query("insert into storage.objects(bucket_id,name) values ('avatars',$1)",[teacher+'/photo.webp']);
    await db.query('insert into messages(studio_id,sender_id,recipient_id,body) values ($1,$2,$3,$4)',[studio.id,teacher,student,'Practice question']);
    await assert.rejects(db.query('insert into messages(studio_id,sender_id,recipient_id,body) values ($1,$2,$3,$4)',[studio.id,student,teacher,'Spoofed']),/row-level security/);
    const event=await one("insert into calendar_events(studio_id,teacher_id,student_id,title,starts_at,ends_at) values ($1,$2,$3,'Lesson','2026-09-10T15:00Z','2026-09-10T16:00Z') returning *",[studio.id,teacher,student]);
    await assert.rejects(db.query("insert into calendar_events(studio_id,teacher_id,title,starts_at,ends_at) values ($1,$2,'Conflict','2026-09-10T15:30Z','2026-09-10T16:30Z')",[studio.id,teacher]),/overlaps/);
    await db.query("insert into materials(studio_id,owner_id,name,storage_path) values($1,$2,'Private score',$3)",[studio.id,teacher,teacher+'/score']);
    await db.query("insert into storage.objects(bucket_id,name) values ('materials',$1)",[teacher+'/score']);
    await db.query("insert into cloud_connections(profile_id,provider,encrypted_tokens) values($1,'google','encrypted-test')",[teacher]);
    await asUser(student);
    assert.equal((await db.query('select * from messages')).rows.length,1);
    await db.query("update messages set read_at=now()");
    await assert.rejects(db.query("update messages set body='tampered'"),/permission denied/);
    assert.equal((await db.query('select * from calendar_events')).rows.length,1);
    await assert.rejects(db.query("insert into calendar_events(studio_id,teacher_id,title,starts_at,ends_at) values ($1,$2,'Forbidden','2026-09-11T15:00Z','2026-09-11T16:00Z')",[studio.id,student]),/row-level security/);
    assert.equal((await db.query('select * from materials')).rows.length,0);
    assert.equal((await db.query("select * from storage.objects where bucket_id='materials'")).rows.length,0);
    assert.equal((await db.query("select * from storage.objects where bucket_id='avatars'")).rows.length,1);
    assert.equal((await db.query('select * from cloud_connections')).rows.length,0);
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values('avatars',$1)",[teacher+'/spoof.webp']),/row-level security/);
    await asUser(teacher);
    await db.query('update materials set shared=true');
    await asUser(student);
    assert.equal((await db.query('select * from materials')).rows.length,1);
    assert.equal((await db.query("select * from storage.objects where bucket_id='materials'")).rows.length,1);
    await asUser(outsider);
    assert.equal((await db.query('select * from messages')).rows.length,0);
    assert.equal((await db.query('select * from calendar_events')).rows.length,0);
    assert.equal((await db.query('select * from materials')).rows.length,0);
    assert.equal((await db.query('select * from storage.objects')).rows.length,0);
    await asUser(teacher);
    await db.query('delete from calendar_events where id=$1',[event.id]);
    await asUser(teacher);
    await db.query('select remove_student_from_studio($1, $2)', [studio.id, student]);
    await asUser(student);
    assert.equal((await db.query('select * from lesson_notes')).rows.length, 0);
    assert.equal((await db.query('select * from studio_hub_pages')).rows.length, 0);
    assert.equal((await db.query('select * from messages')).rows.length,0);
    assert.equal((await db.query('select * from materials')).rows.length,0);
    await assert.rejects(db.query("select * from update_lesson_note_student_notes($1, 'Forbidden')", [note.id]), /own active studio/);
    await asUser(teacher);
    await db.query('select delete_lesson_note($1)', [note.id]);
    assert.equal((await db.query('select * from lesson_notes')).rows.length, 0);
  } finally { await db.close(); }
});
