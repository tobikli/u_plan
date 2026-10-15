-- Remember the program used by the semester overview for each account.
alter table public.preferences
  add column semester_program_id uuid
  references public.study_programs(id) on delete set null;

create function public.validate_semester_program()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.semester_program_id is not null and not exists (
    select 1 from public.study_programs
    where id = new.semester_program_id and user_id = new.user_id
  ) then
    raise exception 'The semester program must belong to this account.' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger validate_semester_program
  before insert or update of semester_program_id, user_id on public.preferences
  for each row execute function public.validate_semester_program();

-- Retain the previous manual result when a course switches to examination grading.
alter table public.courses add column manual_grade numeric;
update public.courses set manual_grade = grade;
alter table public.courses add constraint courses_id_user_id_unique unique (id, user_id);

create table public.examinations (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 200),
  exam_date date,
  grade numeric check (grade is null or (grade > '-Infinity'::numeric and grade < 'Infinity'::numeric)),
  weight numeric not null default 1 check (weight > 0 and weight < 'Infinity'::numeric),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint examinations_course_owner_fkey foreign key (course_id, user_id)
    references public.courses(id, user_id) on delete cascade
);
create index examinations_user_course_idx on public.examinations(user_id, course_id);
create index examinations_user_date_idx on public.examinations(user_id, exam_date);
alter table public.examinations enable row level security;
revoke all on public.examinations from anon;
grant select, insert, update, delete on public.examinations to authenticated;
grant all on public.examinations to service_role;
create policy examinations_select_own on public.examinations for select to authenticated
  using (user_id = (select auth.uid()));
create policy examinations_insert_own on public.examinations for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy examinations_update_own on public.examinations for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy examinations_delete_own on public.examinations for delete to authenticated
  using (user_id = (select auth.uid()));

create function public.prepare_examination()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  grade_low numeric;
  grade_high numeric;
begin
  if tg_op = 'UPDATE' and (new.course_id <> old.course_id or new.user_id <> old.user_id) then
    raise exception 'An examination cannot be moved to another course or account.' using errcode = '23514';
  end if;
  -- Serialize examination changes for a course before calculating its new grade.
  if tg_op = 'DELETE' then
    perform 1 from public.courses where id = old.course_id and user_id = old.user_id for update;
    return old;
  end if;
  perform 1 from public.courses where id = new.course_id and user_id = new.user_id for update;
  if not found then
    raise exception 'The course must belong to this account.' using errcode = '23503';
  end if;
  select least(grade_min, grade_max), greatest(grade_min, grade_max)
    into grade_low, grade_high from public.preferences where user_id = new.user_id;
  if new.grade is not null and (new.grade < coalesce(grade_low, 1) or new.grade > coalesce(grade_high, 5)) then
    raise exception 'The examination grade is outside your grading scale.' using errcode = '23514';
  end if;
  new.name := btrim(new.name);
  new.updated_at := now();
  return new;
end;
$$;
create trigger prepare_examination before insert or update or delete on public.examinations
  for each row execute function public.prepare_examination();

-- Enforce calculated grades even when another client tries to edit courses.grade.
create function public.enforce_course_grade()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  examination_count integer;
  calculated_grade numeric;
begin
  if tg_op = 'INSERT' then
    new.manual_grade := new.grade;
    return new;
  end if;
  select count(*), round(sum(grade * weight) filter (where grade is not null)
      / nullif(sum(weight) filter (where grade is not null), 0), 4)
    into examination_count, calculated_grade
    from public.examinations where course_id = new.id and user_id = new.user_id;
  if examination_count > 0 then
    new.grade := calculated_grade;
    new.manual_grade := old.manual_grade;
  else
    new.manual_grade := new.grade;
  end if;
  return new;
end;
$$;
create trigger enforce_course_grade before insert or update on public.courses
  for each row execute function public.enforce_course_grade();

create function public.refresh_examination_course_grade()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  target_course uuid;
  target_user uuid;
  examination_count integer;
  calculated_grade numeric;
begin
  if tg_op = 'DELETE' then target_course := old.course_id; target_user := old.user_id;
  else target_course := new.course_id; target_user := new.user_id; end if;
  select count(*), round(sum(grade * weight) filter (where grade is not null)
      / nullif(sum(weight) filter (where grade is not null), 0), 4)
    into examination_count, calculated_grade
    from public.examinations where course_id = target_course and user_id = target_user;
  update public.courses
    set grade = case when examination_count > 0 then calculated_grade else manual_grade end,
        updated_at = now()
    where id = target_course and user_id = target_user;
  return null;
end;
$$;
create trigger refresh_examination_course_grade after insert or update or delete on public.examinations
  for each row execute function public.refresh_examination_course_grade();

-- These functions are trigger-only, not callable client RPCs.
revoke all on function public.validate_semester_program() from public, anon, authenticated;
revoke all on function public.prepare_examination() from public, anon, authenticated;
revoke all on function public.enforce_course_grade() from public, anon, authenticated;
revoke all on function public.refresh_examination_course_grade() from public, anon, authenticated;

-- Refresh both examination lists and the saved semester selection across devices.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'examinations') then
    alter publication supabase_realtime add table public.examinations;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'preferences') then
    alter publication supabase_realtime add table public.preferences;
  end if;
end;
$$;
