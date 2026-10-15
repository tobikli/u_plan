-- Transactional fixtures only; no account data is retained.
begin;
insert into auth.users(id,email) values ('c813b329-fcd1-4f18-8c8b-b6f629ea1001','uplan-catalog-test@example.invalid');
set local role authenticated;
select set_config('request.jwt.claim.sub','c813b329-fcd1-4f18-8c8b-b6f629ea1001',true);
do $$
begin
  if not exists (select 1 from public.universities where id='tum') then raise exception 'TUM not readable'; end if;
  begin
    insert into public.universities(id,name,website) values('fake','Fake','https://example.invalid');
    raise exception 'Catalogue editable by a user';
  exception when insufficient_privilege then null; end;
  insert into public.study_programs(id,user_id,name,degree,institution,semesters,current_semester,credits)
  values('c813b329-fcd1-4f18-8c8b-b6f629ea2001',auth.uid(),'Manual program','Bachelor','Test',6,1,180);
  update public.study_programs set university_id='tum',university_program_id='5217' where id='c813b329-fcd1-4f18-8c8b-b6f629ea2001';
  begin
    update public.study_programs set university_program_id=null where id='c813b329-fcd1-4f18-8c8b-b6f629ea2001';
    raise exception 'Partial link accepted';
  exception when check_violation then null; end;
  begin
    update public.study_programs set university_program_id='https://example.invalid' where id='c813b329-fcd1-4f18-8c8b-b6f629ea2001';
    raise exception 'Invalid external ID accepted';
  exception when check_violation then null; end;
  insert into public.courses(id,user_id,program_id,course_code,name,credits,semesters)
  values('c813b329-fcd1-4f18-8c8b-b6f629ea3001',auth.uid(),'c813b329-fcd1-4f18-8c8b-b6f629ea2001','TUMTEST','Fractional ECTS',2.5,1);
  if not exists(select 1 from public.courses where id='c813b329-fcd1-4f18-8c8b-b6f629ea3001' and credits=2.5) then raise exception 'Fractional credits not retained'; end if;
  update public.study_programs set university_id=null,university_program_id=null where id='c813b329-fcd1-4f18-8c8b-b6f629ea2001';
  if not exists(select 1 from public.courses where id='c813b329-fcd1-4f18-8c8b-b6f629ea3001') then raise exception 'Unlinking removed courses'; end if;
end $$;
rollback;
select 'Passed: optional links, TUM read access, write protection, valid identifiers, fractional credits, and unlinking preserves courses. All fixtures rolled back.' as result;
