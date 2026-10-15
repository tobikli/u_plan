-- Preserve standalone grades as ordinary examinations before removing manual grading.
-- Existing examinations (including pending ones) are never duplicated.
begin;
lock table public.courses, public.examinations in share row exclusive mode;
insert into public.examinations (course_id, user_id, name, exam_date, grade, weight)
select c.id, c.user_id, c.name || ' Exam', null, c.grade, 100
from public.courses c
where c.grade is not null
  and not exists (select 1 from public.examinations e where e.course_id = c.id);

-- courses.grade is a cached calculated result for existing summaries and charts.
-- Every write recalculates it, so clients cannot supply a standalone result.
create or replace function public.enforce_course_grade()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  select round(sum(grade * weight) / nullif(sum(weight), 0), 4)
    into new.grade
    from public.examinations
    where course_id = new.id and user_id = new.user_id and grade is not null;
  return new;
end;
$$;

create or replace function public.refresh_examination_course_grade()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  target_course uuid;
  target_user uuid;
begin
  if tg_op = 'DELETE' then target_course := old.course_id; target_user := old.user_id;
  else target_course := new.course_id; target_user := new.user_id; end if;
  -- The course trigger calculates the result, including NULL after the last exam.
  update public.courses set updated_at = now()
    where id = target_course and user_id = target_user;
  return null;
end;
$$;

alter table public.courses drop column manual_grade;
-- Synchronize every cached result with its examinations.
update public.courses set grade = null;
commit;
