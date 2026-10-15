begin;
create table public.universities (
  id text primary key check (id ~ '^[a-z][a-z0-9_-]{1,40}$'),
  name text not null,
  website text not null
);
alter table public.universities enable row level security;
revoke all on public.universities from anon, authenticated;
grant select on public.universities to authenticated;
grant all on public.universities to service_role;
create policy universities_read on public.universities for select to authenticated using (true);
insert into public.universities (id, name, website)
values ('tum', 'Technical University of Munich (TUM)', 'https://www.tum.de');

alter table public.study_programs
  add column university_id text references public.universities(id),
  add column university_program_id text,
  add constraint study_program_university_pair check ((university_id is null) = (university_program_id is null)),
  add constraint study_program_university_program_id check (university_program_id is null or university_program_id ~ '^[0-9]{1,10}$');
-- TUM modules can award fractional ECTS. Keep existing values unchanged.
alter table public.courses alter column credits type numeric using credits::numeric;
commit;
