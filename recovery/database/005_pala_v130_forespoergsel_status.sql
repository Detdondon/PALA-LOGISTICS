-- PALA v130 · Forespørgsel som status for systuejobs
-- Køres på PALA Supabase efter 003_pala_v100_lager_systue.sql.

alter table public.workshop_jobs
  drop constraint if exists workshop_jobs_status_check;

alter table public.workshop_jobs
  add constraint workshop_jobs_status_check
  check (status in ('Forespørgsel','Planlagt','I gang','Afsluttet','Annulleret'));
