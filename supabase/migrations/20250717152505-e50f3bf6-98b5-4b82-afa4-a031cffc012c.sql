-- Criar bucket para ficheiros de projecto
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', true);

-- Criar políticas para o bucket de ficheiros de projecto
CREATE POLICY "Ficheiros de projecto são públicos para visualização" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'project-files');

CREATE POLICY "Utilizadores podem fazer upload de ficheiros de projecto" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'project-files');

CREATE POLICY "Utilizadores podem actualizar os seus ficheiros de projecto" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'project-files');

CREATE POLICY "Utilizadores podem apagar os seus ficheiros de projecto" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'project-files');