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
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Wifi, 
  WifiOff,
  Zap,
  PlayCircle,
  StopCircle,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Activity
} from "lucide-react";

interface DemoProps {
  selectedOrganization?: any;
}

const Demo = ({ selectedOrganization }: DemoProps) => {
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
  
  const { toast } = useToast();
  const { checkCreditBalance, loading: creditsLoading } = useCreditConsumption();
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
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
      streamRef.current = stream;
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      toast({
        title: "Permissão Negada",
        description: "É necessário permitir o acesso ao microfone para testar o agente",
        variant: "destructive",
      });
      return false;
    }
  };

  const startDemoCall = async () => {
    if (!selectedOrganization?.id) {
      toast({
        title: "Organização Necessária",
        description: "Selecione uma organização para iniciar o teste",
        variant: "destructive",
      });
      return;
    }

    // Check credits before starting
    const balance = await checkCreditBalance(selectedOrganization.id);
    if (balance === null || balance <= 0) {
      toast({
        title: "Créditos Insuficientes",
        description: "Adicione créditos à sua conta para testar o agente",
        variant: "destructive",
      });
      return;
    }

    // Request microphone permission
    const micGranted = await requestMicrophonePermission();
    if (!micGranted) return;

    setIsConnecting(true);
    setCreditsConsumed(0);

    try {
      // Initialize audio context
      audioContextRef.current = new AudioContext();
      
      // Connect to WebSocket proxy
      const wsUrl = `wss://dkqzzypemdewomxrjftv.supabase.co/functions/v1/elevenlabs-websocket-proxy?organization_id=${selectedOrganization.id}&agent_id=demo`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Demo WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionQuality('good');
        
        toast({
          title: "Conectado",
          description: "Agente IA pronto para conversar",
        });

        addTranscriptMessage("system", "Conectado ao agente. Comece a falar!");
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('Demo WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionQuality('disconnected');
        setIsAgentSpeaking(false);
        
        if (event.code !== 1000) { // Not normal closure
          toast({
            title: "Conexão Perdida",
            description: "A conexão com o agente foi interrompida",
            variant: "destructive",
          });
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Demo WebSocket error:', error);
        setIsConnecting(false);
        toast({
          title: "Erro de Conexão",
          description: "Falha ao conectar com o agente",
          variant: "destructive",
        });
      };

    } catch (error) {
      console.error('Error starting demo call:', error);
      setIsConnecting(false);
      toast({
        title: "Erro",
        description: "Falha ao iniciar o teste",
        variant: "destructive",
      });
    }
  };

  const endDemoCall = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User ended call');
      wsRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setConnectionQuality('disconnected');
    setIsSpeaking(false);
    setIsAgentSpeaking(false);
    
    addTranscriptMessage("system", "Chamada encerrada");
    
    toast({
      title: "Chamada Encerrada",
      description: `Teste concluído. Créditos utilizados: ${creditsConsumed}`,
    });
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'audio.delta':
        setIsAgentSpeaking(true);
        // Handle incoming audio
        break;
      case 'audio.done':
        setIsAgentSpeaking(false);
        break;
      case 'transcript':
        addTranscriptMessage("agent", data.text);
        break;
      case 'user_speech':
        addTranscriptMessage("user", data.text);
        break;
      case 'credit_consumed':
        setCreditsConsumed(prev => prev + (data.amount || 1));
        fetchCurrentCredits(); // Refresh current credits
        break;
      case 'error':
        toast({
          title: "Erro do Agente",
          description: data.message || "Ocorreu um erro durante a conversa",
          variant: "destructive",
        });
        break;
      default:
        console.log('Unknown message type:', data.type, data);
    }
  };

  const addTranscriptMessage = (sender: 'user' | 'agent' | 'system', text: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const message = `[${timestamp}] ${sender === 'user' ? 'Você' : sender === 'agent' ? 'Agente' : 'Sistema'}: ${text}`;
    setTranscript(prev => [...prev.slice(-9), message]); // Keep last 10 messages
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // In a real implementation, you would mute/unmute the microphone stream
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teste do Agente IA</h1>
          <p className="text-muted-foreground mt-1">
            Teste e valide o seu agente conversacional antes da implementação
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Controls */}
        <Card>
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

            {!isConnected ? (
              <Button 
                onClick={startDemoCall} 
                disabled={isConnecting || !selectedOrganization || creditsLoading}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Iniciar Teste
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={endDemoCall}
                variant="destructive" 
                className="w-full"
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Encerrar Teste
              </Button>
            )}

            {/* Audio Controls */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Microfone:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleMute}
                  disabled={!isConnected}
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Volume:</span>
                  <span className="text-sm text-muted-foreground">{volume[0]}%</span>
                </div>
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={100}
                  step={10}
                  disabled={!isConnected}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Status em Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Você está falando:</span>
                <Badge variant={isSpeaking ? "default" : "secondary"}>
                  {isSpeaking ? "Sim" : "Não"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Agente falando:</span>
                <Badge variant={isAgentSpeaking ? "default" : "secondary"}>
                  {isAgentSpeaking ? "Sim" : "Não"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Qualidade:</span>
                <Badge 
                  variant={connectionQuality === 'good' ? "default" : 
                          connectionQuality === 'poor' ? "outline" : "destructive"}
                >
                  {connectionQuality === 'good' ? "Boa" : 
                   connectionQuality === 'poor' ? "Instável" : "Sem conexão"}
                </Badge>
              </div>
            </div>

            {isConnected && (isAgentSpeaking || isSpeaking) && (
              <div className="flex justify-center pt-2">
                <div className="animate-pulse flex space-x-1">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <div className="h-2 w-2 bg-primary rounded-full animation-delay-200"></div>
                  <div className="h-2 w-2 bg-primary rounded-full animation-delay-400"></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credits Monitor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Monitor de Créditos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Créditos atuais:</span>
                <Badge variant={currentCredits && currentCredits > 100 ? "default" : "destructive"}>
                  {creditsLoading ? "..." : currentCredits || 0}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Consumidos no teste:</span>
                <Badge variant="outline">
                  {creditsConsumed}
                </Badge>
              </div>

              {currentCredits && currentCredits <= 100 && (
                <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                  <div className="text-sm text-orange-700 dark:text-orange-300">
                    <p className="font-medium">Créditos baixos</p>
                    <p>Considere fazer uma recarga</p>
                  </div>
                </div>
              )}
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
            {transcript.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                A transcrição aparecerá aqui quando a conversa iniciar
              </p>
            ) : (
              <div className="space-y-2">
                {transcript.map((message, index) => (
                  <p key={index} className="text-sm font-mono">
                    {message}
                  </p>
                ))}
              </div>
            )}
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
                <li>• Aguarde o agente terminar de falar</li>
                <li>• Monitore o consumo de créditos</li>
                <li>• Observe a qualidade da conexão</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Demo;