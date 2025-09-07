import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useCreditConsumption } from "@/hooks/useCreditConsumption";
import { VoiceWebSocket, getAgentConfig } from "@/utils/ElevenLabsDemo";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Wifi, WifiOff, Zap, PlayCircle, StopCircle, Loader2, AlertTriangle, CheckCircle, Activity } from "lucide-react";
interface DemoProps {
  selectedOrganization?: any;
}
const Demo = ({
  selectedOrganization
}: DemoProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState([80]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'disconnected'>('disconnected');
  const [creditsConsumed, setCreditsConsumed] = useState(0);
  const [currentCredits, setCurrentCredits] = useState<number | null>(null);
  const {
    toast
  } = useToast();
  const {
    checkCreditBalance,
    loading: creditsLoading
  } = useCreditConsumption();
  const voiceWebSocketRef = useRef<VoiceWebSocket | null>(null);
  usePageTitle("Demo - Teste do Agente");
  useEffect(() => {
    // Fetch current credit balance when component loads
    if (selectedOrganization?.id) {
      fetchCurrentCredits();
    }
  }, [selectedOrganization?.id]);
  const fetchCurrentCredits = async () => {
    if (!selectedOrganization?.id) return;
    const balance = await checkCreditBalance(selectedOrganization.id);
    if (balance !== null) {
      setCurrentCredits(balance);
    }
  };
  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      // Test and release the stream
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      toast({
        title: "Permissão Negada",
        description: "É necessário permitir o acesso ao microfone para testar o agente",
        variant: "destructive"
      });
      return false;
    }
  };
  const startDemoCall = async () => {
    if (!selectedOrganization?.id) {
      toast({
        title: "Organização Necessária",
        description: "Selecione uma organização para iniciar o teste",
        variant: "destructive"
      });
      return;
    }

    // Check credits before starting
    const balance = await checkCreditBalance(selectedOrganization.id);
    if (balance === null || balance <= 0) {
      toast({
        title: "Créditos Insuficientes",
        description: "Adicione créditos à sua conta para testar o agente",
        variant: "destructive"
      });
      return;
    }

    // Request microphone permission
    const micGranted = await requestMicrophonePermission();
    if (!micGranted) return;
    setIsConnecting(true);
    setCreditsConsumed(0);
    try {
      // Get agent config from server (same as widget)
      const {
        agentId,
        apiKey
      } = await getAgentConfig(selectedOrganization.id);
      console.log('🔧 Got agent config:', {
        agentId
      });

      // Create VoiceWebSocket connection (same as widget)
      voiceWebSocketRef.current = new VoiceWebSocket(agentId, apiKey, handleWebSocketMessage, connected => {
        setIsConnected(connected);
        setIsConnecting(false);
        setConnectionQuality(connected ? 'good' : 'disconnected');
        if (connected) {
          toast({
            title: "Conectado",
            description: "Agente IA pronto para conversar"
          });
          addTranscriptMessage("system", "Conectado ao agente. Comece a falar!");
        }
      }, error => {
        console.error('VoiceWebSocket error:', error);
        setIsConnecting(false);
        toast({
          title: "Erro de Conexão",
          description: error,
          variant: "destructive"
        });
      });

      // Connect to ElevenLabs directly (same as widget)
      await voiceWebSocketRef.current.connect();
    } catch (error) {
      console.error('Error starting demo call:', error);
      setIsConnecting(false);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao iniciar o teste",
        variant: "destructive"
      });
    }
  };
  const endDemoCall = () => {
    if (voiceWebSocketRef.current) {
      voiceWebSocketRef.current.disconnect();
      voiceWebSocketRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionQuality('disconnected');
    setIsSpeaking(false);
    setIsAgentSpeaking(false);
    addTranscriptMessage("system", "Chamada encerrada");
    toast({
      title: "Chamada Encerrada",
      description: `Teste concluído. Créditos utilizados: ${creditsConsumed}`
    });
  };
  const handleWebSocketMessage = (data: any) => {
    console.log('📨 Received message:', data.type, data);
    switch (data.type) {
      case 'conversation_initiation_metadata':
        addTranscriptMessage("system", "Conversa iniciada - pode começar a falar!");
        break;
      case 'user_transcript':
        if (data.user_transcription_event?.user_transcript) {
          addTranscriptMessage("user", data.user_transcription_event.user_transcript);
          setIsSpeaking(false); // User stopped speaking
        }
        break;
      case 'agent_response':
        if (data.agent_response_event?.agent_response) {
          addTranscriptMessage("agent", data.agent_response_event.agent_response);
        }
        break;
      case 'audio':
        setIsAgentSpeaking(true);
        break;
      case 'interruption':
        setIsAgentSpeaking(false);
        break;
      default:
        console.log('📨 Unknown message type:', data.type);
    }
  };
  const addTranscriptMessage = (sender: 'user' | 'agent' | 'system', text: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const message = `[${timestamp}] ${sender === 'user' ? 'Você' : sender === 'agent' ? 'Agente' : 'Sistema'}: ${text}`;
    setTranscript(prev => [...prev.slice(-9), message]); // Keep last 10 messages
  };
  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (voiceWebSocketRef.current) {
      voiceWebSocketRef.current.setMuted(newMutedState);
    }
  };
  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'good':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'poor':
        return <Wifi className="h-4 w-4 text-yellow-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };
  const getConnectionStatus = () => {
    if (isConnecting) return "Conectando...";
    if (isConnected) return "Conectado";
    return "Desconectado";
  };
  return <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teste do Agente IA</h1>
          <p className="text-muted-foreground mt-1">
            Teste e valide o seu agente conversacional antes da implementação
          </p>
        </div>
      </div>

      <div className="flex justify-start">
        {/* Connection Controls */}
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Controles de Conexão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <div className="flex items-center gap-2">
                {getConnectionIcon()}
                <span className="text-sm">{getConnectionStatus()}</span>
              </div>
            </div>

            <Separator />

            {!isConnected ? <Button onClick={startDemoCall} disabled={isConnecting || !selectedOrganization || creditsLoading} className="w-full">
                {isConnecting ? <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Conectando...
                  </> : <>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Iniciar Teste
                  </>}
              </Button> : <Button onClick={endDemoCall} variant="destructive" className="w-full">
                <StopCircle className="h-4 w-4 mr-2" />
                Encerrar Teste
              </Button>}

            {/* Audio Controls */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Microfone:</span>
                <Button variant="outline" size="sm" onClick={toggleMute} disabled={!isConnected}>
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Transcript */}
      <Card>
        <CardHeader>
          <CardTitle>Transcrição ao Vivo</CardTitle>
          <CardDescription>
            Acompanhe a conversa em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-4 h-48 overflow-y-auto">
            {transcript.length === 0 ? <p className="text-muted-foreground text-sm text-center py-8">
                A transcrição aparecerá aqui quando a conversa iniciar
              </p> : <div className="space-y-2">
                {transcript.map((message, index) => <p key={index} className="text-sm font-mono">
                    {message}
                  </p>)}
              </div>}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Como usar o teste
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Antes de começar:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Certifique-se de ter créditos suficientes</li>
                <li>• Permita o acesso ao microfone</li>
                <li>• Use fones de ouvido para melhor qualidade</li>
                <li>• Teste em ambiente silencioso</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Durante o teste:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Fale claramente e com pausas</li>
                <li>• Fale para interromper o agente</li>
                <li>• Conversa de forma natural</li>
                <li>• Observe a qualidade da conexão</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default Demo;