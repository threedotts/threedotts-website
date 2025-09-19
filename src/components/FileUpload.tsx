import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, FileIcon, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileUpload: (urls: string[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: string;
  label?: string;
  description?: string;
}

export default function FileUpload({
  onFileUpload,
  maxFiles = 5,
  acceptedFileTypes = "image/*,.pdf,.doc,.docx,.zip,.rar",
  label = "Ficheiros de design",
  description = "Formatos aceites: imagens, PDF, DOC, ZIP (máx. 10MB por ficheiro)"
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (files: FileList) => {
    if (!files?.length) return;

    if (uploadedFiles.length + files.length > maxFiles) {
      toast({
        title: "Demasiados ficheiros",
        description: `Pode fazer upload de no máximo ${maxFiles} ficheiros.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];
    const newFiles: { name: string; url: string }[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Verificar tamanho do ficheiro (10MB máx)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Ficheiro demasiado grande",
            description: `${file.name} excede o limite de 10MB.`,
            variant: "destructive",
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `design-files/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(filePath, file);

        if (uploadError) {
          toast({
            title: "Erro no upload",
            description: `Falha ao fazer upload de ${file.name}`,
            variant: "destructive",
          });
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('project-files')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
        newFiles.push({ name: file.name, url: publicUrl });
      }

      const allFiles = [...uploadedFiles, ...newFiles];
      setUploadedFiles(allFiles);
      onFileUpload(allFiles.map(f => f.url));

      toast({
        title: "Upload concluído",
        description: `${newFiles.length} ficheiro(s) carregado(s) com sucesso.`,
      });

    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Ocorreu um erro ao fazer upload dos ficheiros.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = async (index: number) => {
    const fileToRemove = uploadedFiles[index];
    
    // Extrair o caminho do ficheiro da URL
    const path = fileToRemove.url.split('/').slice(-2).join('/');
    
    // Apagar do storage
    await supabase.storage
      .from('project-files')
      .remove([path]);

    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onFileUpload(newFiles.map(f => f.url));

    toast({
      title: "Ficheiro removido",
      description: "Ficheiro removido com sucesso.",
    });
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || '')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileIcon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>{label}</Label>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      {/* Zona de upload */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          uploading 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <Input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes}
          onChange={(e) => handleFileUpload(e.target.files!)}
          className="hidden"
        />
        
        {uploading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-sm">A carregar ficheiros...</span>
          </div>
        ) : (
          <div className="cursor-pointer">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">Clique para seleccionar ficheiros</p>
            <p className="text-xs text-muted-foreground mt-1">
              ou arraste e largue aqui
            </p>
          </div>
        )}
      </div>

      {/* Lista de ficheiros carregados */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Ficheiros carregados:</Label>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
            >
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                {getFileIcon(file.name)}
                <span className="text-sm truncate max-w-[200px] md:max-w-[300px]" title={file.name}>
                  {file.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="text-destructive hover:text-red-400 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}