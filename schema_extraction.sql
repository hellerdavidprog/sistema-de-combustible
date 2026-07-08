SELECT pg_get_ddl('t'::regclass, tablename::regclass) 
FROM pg_tables WHERE schemaname = 'public';
