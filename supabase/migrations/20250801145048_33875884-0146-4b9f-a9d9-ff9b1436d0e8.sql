-- Change agent_id column to support multiple agent IDs
ALTER TABLE public.organizations 
ALTER COLUMN agent_id TYPE text[] USING 
  CASE 
    WHEN agent_id IS NULL THEN NULL
    ELSE ARRAY[agent_id]
  END;