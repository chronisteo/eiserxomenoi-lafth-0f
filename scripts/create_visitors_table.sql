-- Create visitors table for ΛΑΦΘ visitor log
CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  entry_number INT NOT NULL,
  rank TEXT NOT NULL,
  surname TEXT NOT NULL,
  first_name TEXT,
  phone TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL, -- Μ (Μπαρ), Ε (Εστιατόριο), Β (Βεράντα), Π (Πακέτο)
  table_number INT, -- null για Π (Πακέτο)
  person_count INT NOT NULL DEFAULT 1,
  arrival_time TIME NOT NULL,
  departure_time TIME,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, entry_number) -- Ένα A/A ανά ημέρα
);

-- Index για γρήγορη αναζήτηση ανά ημερομηνία
CREATE INDEX IF NOT EXISTS idx_visitors_date ON visitors(date);

-- Index για γρήγορη αναζήτηση ανά τηλέφωνο
CREATE INDEX IF NOT EXISTS idx_visitors_phone ON visitors(phone);

-- Enable RLS (Row Level Security)
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- Policy: Όλοι μπορούν να διαβάσουν τις εγγραφές
CREATE POLICY "allow_read_visitors" ON visitors
  FOR SELECT USING (true);

-- Policy: Όλοι μπορούν να εισάγουν νέες εγγραφές
CREATE POLICY "allow_insert_visitors" ON visitors
  FOR INSERT WITH CHECK (true);

-- Policy: Όλοι μπορούν να ενημερώσουν τις εγγραφές
CREATE POLICY "allow_update_visitors" ON visitors
  FOR UPDATE USING (true);

-- Policy: Όλοι μπορούν να διαγράψουν τις εγγραφές
CREATE POLICY "allow_delete_visitors" ON visitors
  FOR DELETE USING (true);
