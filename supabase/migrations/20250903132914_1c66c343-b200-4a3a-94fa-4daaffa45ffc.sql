-- Consumir todos os créditos da organização Alpha Inc. (5732 créditos)
SELECT public.consume_credits(
  '1e926240-b303-444b-9f8c-57abd9fa657b'::uuid,  -- Alpha Inc.
  5732,  -- Todos os créditos
  NULL,  -- Sem call_id específico
  NULL   -- Sem duração específica
);

-- Consumir todos os créditos da organização Omega (2500 créditos)
SELECT public.consume_credits(
  '882d1149-5554-4c6a-a47a-bb3891cd263e'::uuid,  -- Omega
  2500,  -- Todos os créditos
  NULL,  -- Sem call_id específico
  NULL   -- Sem duração específica
);