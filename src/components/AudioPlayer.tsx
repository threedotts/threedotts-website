import { useState, useEffect, useRef } from "react";

interface AudioPlayerProps {
  audioUrl: string;
}

export function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let mounted = true;
    let objectUrl: string | null = null;

    const fetchAudioBlob = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching audio blob from:', audioUrl);

        const response = await fetch(audioUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        console.log('Audio blob fetched successfully, size:', blob.size, 'type:', blob.type);
        
        if (mounted) {
          objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);
          console.log('Object URL created:', objectUrl);
        }
      } catch (err) {
        console.error('Error fetching audio blob:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load audio');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAudioBlob();

    return () => {
      mounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [audioUrl]);

  if (loading) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Gravação da chamada:</p>
        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">Carregando áudio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Gravação da chamada:</p>
        <div className="bg-destructive/10 p-4 rounded-lg">
          <p className="text-sm text-destructive">Erro ao carregar áudio: {error}</p>
          <button 
            onClick={() => window.open(audioUrl, '_blank')}
            className="text-xs text-blue-500 hover:underline mt-2 block"
          >
            Abrir em nova aba
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Gravação da chamada:</p>
      <audio
        ref={audioRef}
        controls
        className="w-full"
        preload="auto"
        src={blobUrl || undefined}
        onLoadedMetadata={() => {
          console.log('Audio metadata loaded successfully');
          if (audioRef.current) {
            console.log('Audio duration:', audioRef.current.duration);
          }
        }}
        onError={(e) => {
          console.error('Audio playback error:', e);
          const target = e.target as HTMLAudioElement;
          console.log('Audio error code:', target.error?.code);
          console.log('Audio error message:', target.error?.message);
        }}
      >
        Your browser does not support the audio element.
      </audio>
      <button 
        onClick={() => window.open(audioUrl, '_blank')}
        className="text-xs text-blue-500 hover:underline"
      >
        Abrir em nova aba
      </button>
    </div>
  );
}