# Supabase Migrations

Alle `.sql`-Dateien in diesem Ordner werden beim Merge auf `main` automatisch via CI/CD auf die Supabase-Datenbank angewendet.

---

## SQL-Schreibregeln (Idempotenz)

Jede Migration muss mehrfach ausführbar sein, ohne Fehler zu werfen. Die DB existiert bereits — alle Statements müssen das berücksichtigen.

### Tabellen & Spalten

```sql
-- Tabelle
create table if not exists public.my_table ( ... );

-- Spalte hinzufügen
alter table public.my_table
add column if not exists my_column text;

-- Index
create index if not exists my_index_idx on public.my_table (my_column);
```

### Policies (RLS)

`CREATE POLICY` schlägt fehl wenn die Policy schon existiert. Immer mit `DROP IF EXISTS` davor:

```sql
drop policy if exists "Policy Name" on public.my_table;
create policy "Policy Name"
on public.my_table
for select
to authenticated
using (auth.uid() = user_id);
```

> Kein `CREATE OR REPLACE POLICY` — das Pattern mit DROP + CREATE ist expliziter und funktioniert in allen Postgres-Versionen zuverlässig.

### Seed-Daten (INSERT)

```sql
insert into public.my_table (col1, col2)
values ('a', 'b')
on conflict do nothing;
```

### Publication (Realtime)

```sql
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'my_table'
  ) then
    alter publication supabase_realtime add table public.my_table;
  end if;
end $$;
```

### RLS aktivieren

`ALTER TABLE ... ENABLE ROW LEVEL SECURITY` ist idempotent — kein Guard nötig.

---

## Deployment

Einfach auf `main` oder `develop` pushen/mergen:

```
feature-branch → PR → merge → CI läuft → Migration wird automatisch angewendet
```

Die Pipeline macht folgendes (`.github/workflows/ci.yml`):
1. `supabase link` — verbindet mit dem Supabase-Projekt
2. `supabase db push` — schreibt alle neuen Migrations-Dateien in die DB

**Benötigte GitHub Secrets:**

| Secret | Wo finden |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | supabase.com → Account → Access Tokens |
| `SUPABASE_PROJECT_ID` | Supabase Dashboard → Project Settings → General → Reference ID |
| `SUPABASE_DB_PASSWORD` | Supabase Dashboard → Project Settings → Database → Password |

---

## Neue Migration hinzufügen

1. Neue `.sql`-Datei anlegen mit der nächsten Nummer: `08_mein_feature.sql`
2. SQL idempotent schreiben (siehe Regeln oben)
3. Committen und pushen — CI übernimmt den Rest

---

## Rollback

Supabase hat **kein automatisches Rollback**. Bei einem Fehler manuell vorgehen:

### Tabelle / Spalte rückgängig machen

```sql
-- Spalte entfernen
alter table public.my_table drop column if exists my_column;

-- Tabelle entfernen (Vorsicht: löscht alle Daten)
drop table if exists public.my_table;
```

### Policy rückgängig machen

```sql
drop policy if exists "Policy Name" on public.my_table;
```

### Vorgehen bei Produktionsfehler

1. Fix-Migration schreiben (`09_fix_something.sql`) — nie alte Dateien rückwirkend ändern
2. Committen → CI deployed den Fix automatisch
3. Alternativ: SQL direkt im Supabase SQL Editor ausführen für Notfälle
