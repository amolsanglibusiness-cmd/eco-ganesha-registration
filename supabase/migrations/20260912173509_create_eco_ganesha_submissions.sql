/*
# Create eco_ganesha_submissions table (single-tenant, no auth)

1. New Tables
- `eco_ganesha_submissions`
  - `id` (uuid, primary key)
  - `full_name` (text, not null) — participant's full name
  - `date_of_birth` (date, not null) — participant's date of birth
  - `address` (text, not null) — participant's full address
  - `mobile_number` (text, not null) — 10-digit mobile number
  - `email` (text, nullable) — optional email address
  - `selfie_data_url` (text, not null) — base64 data URL of captured selfie
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `eco_ganesha_submissions`.
- Allow anon + authenticated CRUD because this is a public contest submission form (no sign-in required).
*/

CREATE TABLE IF NOT EXISTS eco_ganesha_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  date_of_birth date NOT NULL,
  address text NOT NULL,
  mobile_number text NOT NULL,
  email text,
  selfie_data_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE eco_ganesha_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_submissions" ON eco_ganesha_submissions;
CREATE POLICY "anon_select_submissions" ON eco_ganesha_submissions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_submissions" ON eco_ganesha_submissions;
CREATE POLICY "anon_insert_submissions" ON eco_ganesha_submissions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_submissions" ON eco_ganesha_submissions;
CREATE POLICY "anon_update_submissions" ON eco_ganesha_submissions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_submissions" ON eco_ganesha_submissions;
CREATE POLICY "anon_delete_submissions" ON eco_ganesha_submissions FOR DELETE
  TO anon, authenticated USING (true);
