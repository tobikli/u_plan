-- Run with `supabase db query --linked -f supabase/tests/semester_examinations.sql`.
-- All fixtures and changes are rolled back; this does not modify account data.
begin;
insert into auth.users(id, email) values
 ('a903bb41-ce57-4c78-8d51-cba9a9681001', 'uplan-exam-test-a@example.invalid'),
 ('a903bb41-ce57-4c78-8d51-cba9a9681002', 'uplan-exam-test-b@example.invalid');
insert into public.study_programs(id,user_id,name,degree,institution,semesters,current_semester,credits) values
 ('a903bb41-ce57-4c78-8d51-cba9a9682001','a903bb41-ce57-4c78-8d51-cba9a9681001','Examination test','Bachelor','Test',6,2,120),
 ('a903bb41-ce57-4c78-8d51-cba9a9682002','a903bb41-ce57-4c78-8d51-cba9a9681002','Other owner','Bachelor','Test',6,1,120);
insert into public.courses(id,user_id,program_id,course_code,name,credits,semesters,grade) values
 ('a903bb41-ce57-4c78-8d51-cba9a9683001','a903bb41-ce57-4c78-8d51-cba9a9681001','a903bb41-ce57-4c78-8d51-cba9a9682001','TEST','Grade calculation',6,2,1.7);

do $$ begin
  if exists(select 1 from public.courses where id='a903bb41-ce57-4c78-8d51-cba9a9683001' and grade is not null) then
    raise exception 'A new course must not accept a standalone grade';
  end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub','a903bb41-ce57-4c78-8d51-cba9a9681001',true);
do $$
declare result numeric;
begin
  update public.preferences set semester_program_id='a903bb41-ce57-4c78-8d51-cba9a9682001' where user_id=auth.uid();
  insert into public.examinations(id,user_id,course_id,name,grade,weight,exam_date) values
   ('a903bb41-ce57-4c78-8d51-cba9a9684001',auth.uid(),'a903bb41-ce57-4c78-8d51-cba9a9683001','Written exam',2,40,'2026-12-01'),
   ('a903bb41-ce57-4c78-8d51-cba9a9684002',auth.uid(),'a903bb41-ce57-4c78-8d51-cba9a9683001','Project',4,60,null);
  select grade into result from public.courses where id='a903bb41-ce57-4c78-8d51-cba9a9683001';
  if result is distinct from 3.2 then raise exception 'Weighted grade failed: %',result; end if;
  update public.examinations set grade=null where id='a903bb41-ce57-4c78-8d51-cba9a9684002';
  select grade into result from public.courses where id='a903bb41-ce57-4c78-8d51-cba9a9683001';
  if result is distinct from 2 then raise exception 'Provisional grade failed'; end if;
  update public.examinations set weight=20 where id='a903bb41-ce57-4c78-8d51-cba9a9684001';
  update public.examinations set grade=4, weight=80 where id='a903bb41-ce57-4c78-8d51-cba9a9684002';
  update public.courses set grade=1 where id='a903bb41-ce57-4c78-8d51-cba9a9683001';
  select grade into result from public.courses where id='a903bb41-ce57-4c78-8d51-cba9a9683001';
  if result is distinct from 3.6 then raise exception 'Grade override protection failed'; end if;
  begin
    update public.examinations set weight=0 where id='a903bb41-ce57-4c78-8d51-cba9a9684001';
    raise exception 'Zero weight accepted';
  exception when check_violation then null; end;
  begin
    update public.examinations set grade=6 where id='a903bb41-ce57-4c78-8d51-cba9a9684001';
    raise exception 'Out-of-scale grade accepted';
  exception when check_violation then null; end;
  begin
    update public.examinations set grade='NaN'::numeric where id='a903bb41-ce57-4c78-8d51-cba9a9684001';
    raise exception 'Non-finite grade accepted';
  exception when check_violation then null; end;
  delete from public.examinations where course_id='a903bb41-ce57-4c78-8d51-cba9a9683001';
  select grade into result from public.courses where id='a903bb41-ce57-4c78-8d51-cba9a9683001';
  if result is not null then raise exception 'Deleting all examinations must clear the grade: %',result; end if;
  update public.courses set grade=2 where id='a903bb41-ce57-4c78-8d51-cba9a9683001';
  if exists(select 1 from public.courses where id='a903bb41-ce57-4c78-8d51-cba9a9683001' and grade is not null) then raise exception 'Standalone grade accepted'; end if;
  insert into public.examinations(id,user_id,course_id,name,grade,weight) values
   ('a903bb41-ce57-4c78-8d51-cba9a9684001',auth.uid(),'a903bb41-ce57-4c78-8d51-cba9a9683001','Pending exam',null,1);
  select grade into result from public.courses where id='a903bb41-ce57-4c78-8d51-cba9a9683001';
  if result is not null then raise exception 'Pending results must not retain a manual grade'; end if;
  update public.preferences set grade_min=10, grade_max=0, grade_passed=5 where user_id=auth.uid();
  update public.examinations set grade=0 where id='a903bb41-ce57-4c78-8d51-cba9a9684001';
  select grade into result from public.courses where id='a903bb41-ce57-4c78-8d51-cba9a9683001';
  if result is distinct from 0 then raise exception 'Zero result / reversed grading failed'; end if;
end;
$$;

select set_config('request.jwt.claim.sub','a903bb41-ce57-4c78-8d51-cba9a9681002',true);
do $$
declare affected integer;
begin
  if exists(select 1 from public.examinations where course_id='a903bb41-ce57-4c78-8d51-cba9a9683001') then raise exception 'Other owner can read examinations'; end if;
  update public.examinations set name='Changed' where id='a903bb41-ce57-4c78-8d51-cba9a9684001';
  get diagnostics affected = row_count;
  if affected<>0 then raise exception 'Other owner can update examinations'; end if;
  begin
    insert into public.examinations(user_id,course_id,name,weight) values(auth.uid(),'a903bb41-ce57-4c78-8d51-cba9a9683001','Foreign course',1);
    raise exception 'Other owner can attach an examination';
  exception when foreign_key_violation or insufficient_privilege then null; end;
  begin
    update public.preferences set semester_program_id='a903bb41-ce57-4c78-8d51-cba9a9682001' where user_id=auth.uid();
    raise exception 'Other owner can select a foreign program';
  exception when check_violation then null; end;
end;
$$;
select set_config('request.jwt.claim.sub','a903bb41-ce57-4c78-8d51-cba9a9681001',true);
delete from public.study_programs where id='a903bb41-ce57-4c78-8d51-cba9a9682001';
do $$
begin
  if exists(select 1 from public.examinations where course_id='a903bb41-ce57-4c78-8d51-cba9a9683001') then raise exception 'Course deletion did not cascade examinations'; end if;
  if exists(select 1 from public.preferences where user_id=auth.uid() and semester_program_id is not null) then raise exception 'Program deletion did not clear saved selection'; end if;
end;
$$;
rollback;
select 'Passed: weighted/provisional grades, examination-only grading, invalid inputs, ownership isolation, and deletion cleanup. All test data rolled back.' as result;
