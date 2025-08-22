import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const ElevenLabsSDKTest: React.FC = () => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [conversation, setConversation] = useState<any>(null);

  const addMessage = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  const startConversation = useCallback(async () => {
    if (isConnected) return;

    try {
      setStatus('connecting');
      addMessage('🚀 Starting conversation with ElevenLabs SDK...');

      // Request microphone permission first
      addMessage('🎤 Requesting microphone permission...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      addMessage('✅ Microphone permission granted');

      // Dynamically import the ElevenLabs client
      addMessage('📦 Loading ElevenLabs SDK...');
      const { Conversation } = await import('@elevenlabs/client');
      addMessage('✅ ElevenLabs SDK loaded');

      // Start the conversation using the official SDK
      addMessage('🔗 Connecting to ElevenLabs agent...');
      const conv = await Conversation.startSession({
        agentId: 'agent_01k02ete3tfjgrq97y8a7v541y', // Your agent ID
        onConnect: () => {
          addMessage('✅ Connected to ElevenLabs!');
          setIsConnected(true);
          setStatus('connected');
          toast({
            title: "Success!",
            description: "Connected to ElevenLabs Conversational AI using official SDK",
          });
        },
        onDisconnect: () => {
          addMessage('❌ Disconnected from ElevenLabs');
          setIsConnected(false);
          setStatus('disconnected');
        },
        onError: (error: any) => {
          addMessage(`❌ Error: ${error.message || error}`);
          console.error('ElevenLabs SDK Error:', error);
          setStatus('disconnected');
          toast({
            title: "Connection Error",
            description: error.message || "Failed to connect using SDK",
            variant: "destructive",
          });
        },
        onModeChange: (mode: any) => {
          addMessage(`🔄 Mode changed to: ${mode.mode}`);
          console.log('Mode change:', mode);
        },
        onMessage: (message: any) => {
          addMessage(`📨 Message: ${JSON.stringify(message).substring(0, 100)}...`);
          console.log('SDK Message:', message);
        }
      });

      setConversation(conv);
      addMessage('🎯 Conversation session created');

    } catch (error: any) {
      console.error('Failed to start conversation:', error);
      addMessage(`❌ Failed to start: ${error.message || error}`);
      setStatus('disconnected');
      toast({
        title: "Connection Failed",
        description: error.message || "Could not start conversation",
        variant: "destructive",
      });
    }
  }, [isConnected, toast]);

  const stopConversation = useCallback(async () => {
    if (conversation) {
      try {
        addMessage('🛑 Stopping conversation...');
        await conversation.endSession();
        setConversation(null);
        addMessage('✅ Conversation ended');
      } catch (error: any) {
        addMessage(`❌ Error stopping: ${error.message || error}`);
        console.error('Error stopping conversation:', error);
      }
    }
  }, [conversation]);

  const sendTestMessage = useCallback(() => {
    if (conversation) {
      try {
        // Send a contextual message or trigger speaking
        addMessage('📤 Sending test interaction...');
        // The SDK handles audio automatically, so we just log this action
        console.log('Test interaction triggered');
      } catch (error: any) {
        addMessage(`❌ Error sending: ${error.message || error}`);
      }
    }
  }, [conversation]);

  const clearMessages = () => {
    setMessages([]);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      default:
        return 'bg-red-500';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversation) {
        conversation.endSession().catch(console.error);
      }
    };
  }, [conversation]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>ElevenLabs Official SDK Test</CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            <Badge variant="outline" className="text-xs">
              {status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {!isConnected ? (
            <Button 
              onClick={startConversation} 
              disabled={status === 'connecting'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {status === 'connecting' ? 'Connecting...' : 'Start Conversation (SDK)'}
            </Button>
          ) : (
            <>
              <Button onClick={stopConversation} variant="destructive">
                Stop Conversation
              </Button>
              <Button onClick={sendTestMessage} variant="outline">
                Test Interaction
              </Button>
            </>
          )}
          <Button onClick={clearMessages} variant="ghost" size="sm">
            Clear Log
          </Button>
        </div>

        <div className="bg-muted p-4 rounded max-h-80 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">SDK Connection Log:</div>
            <div className="text-xs text-muted-foreground">
              {messages.length} messages
            </div>
          </div>
          {messages.length === 0 ? (
            <div className="text-muted-foreground text-sm">No messages yet...</div>
          ) : (
            <div className="space-y-1">
              {messages.map((msg, index) => (
                <div key={index} className="text-xs font-mono break-all">
                  {msg}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Method:</strong> Official @elevenlabs/client SDK</p>
          <p><strong>Agent ID:</strong> agent_01k02ete3tfjgrq97y8a7v541y</p>
          <p><strong>Advantages:</strong> Handles WebSocket connection, authentication, and audio automatically</p>
          <p>This uses the official ElevenLabs SDK which should handle all connection complexities.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ElevenLabsSDKTest;