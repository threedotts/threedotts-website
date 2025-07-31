import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConvertRequest {
  base64Data: string;
  audioID: string;
  mimeType?: string;
  fileName?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { base64Data, audioID, mimeType = 'audio/mpeg', fileName }: ConvertRequest = await req.json();

    if (!base64Data) {
      throw new Error('base64Data is required');
    }

    if (!audioID) {
      throw new Error('audioID is required');
    }

    // Remove data URL prefix if present (e.g., "data:audio/mpeg;base64,")
    const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');

    // Convert base64 to binary
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Determine file extension from mimeType if fileName not provided
    const getFileExtension = (mimeType: string): string => {
      const extensionMap: Record<string, string> = {
        'audio/mpeg': 'mp3',
        'audio/mp3': 'mp3',
        'audio/wav': 'wav',
        'audio/ogg': 'ogg',
        'audio/webm': 'webm',
        'audio/mp4': 'mp4',
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'application/pdf': 'pdf',
        'text/plain': 'txt',
      };
      return extensionMap[mimeType] || 'bin';
    };

    const finalFileName = fileName || `${audioID}.${getFileExtension(mimeType)}`;

    const response = {
      binary: {
        data: {
          data: Array.from(bytes), // Convert Uint8Array to regular array for JSON serialization
          mimeType,
          fileName: finalFileName,
        },
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in convert-base64 function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});