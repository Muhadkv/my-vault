-- Run this in your Supabase SQL Editor. Adds an optional "date borrowed"
-- field to loans — safe to run on top of your existing loans table.

alter table loans add column borrowed_on date;
