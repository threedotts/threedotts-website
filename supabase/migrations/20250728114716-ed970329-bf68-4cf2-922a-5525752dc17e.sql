-- Add conversation_id as primary key to call_staging table
-- First, drop the existing primary key constraint
ALTER TABLE public.call_staging DROP CONSTRAINT call_staging_pkey;

-- Add conversation_id column as the new primary key
ALTER TABLE public.call_staging ADD COLUMN conversation_id TEXT NOT NULL PRIMARY KEY;

-- The id column can remain but is no longer the primary key
-- We could optionally make it unique if needed: ALTER TABLE public.call_staging ADD CONSTRAINT call_staging_id_unique UNIQUE (id);