-- PALA v85
-- Manglende vagter fra bemandingsarket, 1.-11. september 2026.
-- Scriptet kan køres flere gange uden at oprette dubletter.

begin;

-- Den eksisterende Foodstudio-vagt den 2/9 genbruges og udvides med
-- Glostrup-opgaven og hele holdet fra arket.
update staffing_shifts
set booking_id = 98,
    workers_needed = 7,
    title = 'Hold 1 – Foodstudio / Glostrup',
    notes = 'Opsætning Foodstudio (Sirius) og opsætning Glostrup. Slut senest kl. 16.
Kilde: bemandingsark September 2026 [ARK-SEP2026-02-H1]'
where id = 46
  and shift_date = '2026-09-02'
  and not exists (
    select 1 from staffing_shifts
    where notes like '%[ARK-SEP2026-02-H1]%'
  );

-- Fallback, hvis den eksisterende vagt ikke findes i databasen.
insert into staffing_shifts
  (booking_id, shift_date, start_time, end_time, workers_needed, title, notes, daily_leader_employee_id)
select 98, '2026-09-02', null, null, 7,
       'Hold 1 – Foodstudio / Glostrup',
       'Opsætning Foodstudio (Sirius) og opsætning Glostrup. Slut senest kl. 16.
Kilde: bemandingsark September 2026 [ARK-SEP2026-02-H1]', null
where not exists (
  select 1 from staffing_shifts
  where notes like '%[ARK-SEP2026-02-H1]%'
);

insert into staffing_shifts
  (booking_id, shift_date, start_time, end_time, workers_needed, title, notes, daily_leader_employee_id)
select null, v.shift_date::date, v.start_time::time, v.end_time::time,
       v.workers_needed, v.title, v.notes, null
from (values
  ('2026-09-01', null, null, 5, 'Hold 1 – Kirkefestival / Steffan / Gadegrej / Roskilde',
   E'Kirkefestival op, nedtagning Steffan, klargøring af borde/bænke til Gadegrej og Roskilde ned. Slut ca. kl. 18.\nKilde: bemandingsark September 2026 [ARK-SEP2026-01-H1]'),
  ('2026-09-04', '09:00', '16:00', 3, 'Hold 2 – Lager / klargøring',
   E'Flytning af lager og klargøring af sal.\nKilde: bemandingsark September 2026 [ARK-SEP2026-04-H2]'),
  ('2026-09-06', '09:00', '16:00', 5, 'Hold 1 – Magnus / Kirkefestival',
   E'Nedtagning hos Magnus og nedtagning af Kirkefestival. Mødetid kl. 9, færdig ca. kl. 16.\nKilde: bemandingsark September 2026 [ARK-SEP2026-06-H1]'),
  ('2026-09-11', null, null, 1, 'Lager eller fri',
   E'Lager eller fri.\nKilde: bemandingsark September 2026 [ARK-SEP2026-11-H1]')
) as v(shift_date, start_time, end_time, workers_needed, title, notes)
where not exists (
  select 1 from staffing_shifts s
  where s.notes like '%[' || substring(v.notes from 'ARK-SEP2026-[^]]+') || ']%'
);

insert into staffing_shifts
  (booking_id, shift_date, start_time, end_time, workers_needed, title, notes, daily_leader_employee_id)
select v.booking_id, v.shift_date::date, v.start_time::time, v.end_time::time,
       v.workers_needed, v.title, v.notes, null
from (values
  (71,  '2026-09-01', null, null, 4, 'Hold 2 – Nedtagning Jens Steen',
   E'Nedtagning hos Jens Steen i Virum, Nordstjernen med trægulv.\nKilde: bemandingsark September 2026 [ARK-SEP2026-01-H2]'),
  (99,  '2026-09-03', null, null, 2, 'Hold 1 – Anders og Sara / Glostrup',
   E'Opsætning hos Anders og Sara samt nedtagning i Glostrup efter kl. 14. Samuel til kl. 16.\nKilde: bemandingsark September 2026 [ARK-SEP2026-03-H1]'),
  (93,  '2026-09-03', null, null, 1, 'Hold 2 – Magnus'' haveforening',
   E'Magnus sætter selv telt op i haveforeningen.\nKilde: bemandingsark September 2026 [ARK-SEP2026-03-H2]'),
  (100, '2026-09-04', null, null, 2, 'Hold 1 – Textilia',
   E'Opsætning Textilia. Magnus og Emil kl. 17.\nKilde: bemandingsark September 2026 [ARK-SEP2026-04-H1]'),
  (98,  '2026-09-07', null, null, 3, 'Hold 1 – Lille bogfestival / Foodstudio',
   E'Den Lille Bogdag op på Designmuseum og nedtagning Foodstudio.\nKilde: bemandingsark September 2026 [ARK-SEP2026-07-H1]'),
  (101, '2026-09-07', '09:00', '16:00', 3, 'Hold 2 – Anders og Sara / B Corp',
   E'Nedtagning hos Anders og videre til B Corp på Christianshavn. Ca. kl. 9-16.\nKilde: bemandingsark September 2026 [ARK-SEP2026-07-H2]'),
  (101, '2026-09-08', null, null, 6, 'Hold 1 – B Corp / Karen Blixen / Fyrkat',
   E'B Corp på Christianshavn op og klar kl. 11-12. Husk presenninger. Karen Blixen ned og pakning til Fyrkat.\nKilde: bemandingsark September 2026 [ARK-SEP2026-08-H1]'),
  (102, '2026-09-09', null, null, 3, 'Hold 1 – Fyrkat',
   E'Opsætning Fyrkat, Nordstjernen med tre master.\nKilde: bemandingsark September 2026 [ARK-SEP2026-09-H1]'),
  (101, '2026-09-09', null, null, 3, 'Hold 2 – Nedtagning Christianshavn',
   E'Nedtagning på Christianshavn.\nKilde: bemandingsark September 2026 [ARK-SEP2026-09-H2]'),
  (117, '2026-09-10', null, null, 2, 'Hold 1 – Samuel / Textilia',
   E'Opsætning hos Samuel og nedtagning Textilia.\nKilde: bemandingsark September 2026 [ARK-SEP2026-10-H1]')
) as v(booking_id, shift_date, start_time, end_time, workers_needed, title, notes)
where not exists (
  select 1 from staffing_shifts s
  where s.notes like '%[' || substring(v.notes from 'ARK-SEP2026-[^]]+') || ']%'
);

-- Medarbejderne kobles på de nye vagter efter navn. Eksisterende tilmeldinger bevares.
with wanted(source_tag, employee_name) as (values
  ('ARK-SEP2026-01-H1', 'Emil'),
  ('ARK-SEP2026-01-H1', 'Magnus'),
  ('ARK-SEP2026-01-H1', 'Lukas'),
  ('ARK-SEP2026-01-H1', 'Poul'),
  ('ARK-SEP2026-01-H1', 'Ole'),
  ('ARK-SEP2026-01-H2', 'Patrick'),
  ('ARK-SEP2026-01-H2', 'Thomas'),
  ('ARK-SEP2026-01-H2', 'Benjamin'),
  ('ARK-SEP2026-01-H2', 'Samuel'),
  ('ARK-SEP2026-02-H1', 'Patrick'),
  ('ARK-SEP2026-02-H1', 'Emil'),
  ('ARK-SEP2026-02-H1', 'Magnus'),
  ('ARK-SEP2026-02-H1', 'Lukas'),
  ('ARK-SEP2026-02-H1', 'Ole'),
  ('ARK-SEP2026-02-H1', 'Samuel'),
  ('ARK-SEP2026-02-H1', 'Villads'),
  ('ARK-SEP2026-03-H1', 'Patrick'),
  ('ARK-SEP2026-03-H1', 'Samuel'),
  ('ARK-SEP2026-03-H2', 'Magnus'),
  ('ARK-SEP2026-04-H1', 'Magnus'),
  ('ARK-SEP2026-04-H1', 'Emil'),
  ('ARK-SEP2026-04-H2', 'Patrick'),
  ('ARK-SEP2026-04-H2', 'Thomas'),
  ('ARK-SEP2026-04-H2', 'Samuel'),
  ('ARK-SEP2026-06-H1', 'Ole'),
  ('ARK-SEP2026-06-H1', 'Samuel'),
  ('ARK-SEP2026-06-H1', 'Lukas'),
  ('ARK-SEP2026-06-H1', 'Poul'),
  ('ARK-SEP2026-06-H1', 'Benjamin'),
  ('ARK-SEP2026-07-H1', 'Emil'),
  ('ARK-SEP2026-07-H1', 'Lukas'),
  ('ARK-SEP2026-07-H1', 'Magnus'),
  ('ARK-SEP2026-07-H2', 'Patrick'),
  ('ARK-SEP2026-07-H2', 'Thomas'),
  ('ARK-SEP2026-07-H2', 'Benjamin'),
  ('ARK-SEP2026-08-H1', 'Ole'),
  ('ARK-SEP2026-08-H1', 'Emil'),
  ('ARK-SEP2026-08-H1', 'Magnus'),
  ('ARK-SEP2026-08-H1', 'Thomas'),
  ('ARK-SEP2026-08-H1', 'Patrick'),
  ('ARK-SEP2026-08-H1', 'Samuel'),
  ('ARK-SEP2026-09-H1', 'Samuel'),
  ('ARK-SEP2026-09-H1', 'Emil'),
  ('ARK-SEP2026-09-H1', 'Magnus'),
  ('ARK-SEP2026-09-H2', 'Patrick'),
  ('ARK-SEP2026-09-H2', 'Benjamin'),
  ('ARK-SEP2026-09-H2', 'Thomas'),
  ('ARK-SEP2026-10-H1', 'Ole'),
  ('ARK-SEP2026-10-H1', 'Thomas')
)
insert into staffing_assignments (shift_id, employee_id)
select s.id, e.id
from wanted w
join staffing_shifts s on s.notes like '%[' || w.source_tag || ']%'
join employees e on lower(e.name) = lower(w.employee_name)
where not exists (
  select 1 from staffing_assignments a
  where a.shift_id = s.id and a.employee_id = e.id
);

commit;

-- Kontrol: skal vise 15 vagter og 49 medarbejdertilknytninger.
select s.shift_date, s.title, s.workers_needed, count(a.employee_id) as assigned
from staffing_shifts s
left join staffing_assignments a on a.shift_id = s.id
where s.notes like '%[ARK-SEP2026-%'
group by s.id, s.shift_date, s.title, s.workers_needed
order by s.shift_date, s.title;
