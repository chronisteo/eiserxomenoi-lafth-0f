-- Αφαίρεση του UNIQUE constraint από το phone
-- Επιτρέπει στον ίδιο επισκέπτη να έρθει πολλές φορές

-- Βρίσκουμε και αφαιρούμε το constraint
ALTER TABLE visitors DROP CONSTRAINT IF EXISTS visitors_phone_key;

-- Το index παραμένει για γρήγορη αναζήτηση
-- CREATE INDEX IF NOT EXISTS idx_visitors_phone ON visitors(phone);
