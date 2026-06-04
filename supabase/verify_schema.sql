select
  table_name,
  row_security
from information_schema.tables t
join pg_class c
  on c.relname = t.table_name
where table_schema = 'public'
  and table_name in ('chapters', 'questions', 'favorites', 'study_progress', 'public_questions')
order by table_name;

select
  schemaname,
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('chapters', 'questions', 'favorites', 'study_progress', 'public_questions')
order by tablename, policyname;
