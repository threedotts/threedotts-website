import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const ElevenLabsSDKTest: React.FC = () => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);

  const addMessage = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  const startConversation = useCallback(async () => {
    if (isConnected) return;

    try {
      setStatus('connecting');
      addMessage('🚀 Connecting via edge function proxy...');
      
      // Connect to our edge function proxy
      const wsUrl = `wss://dkqzzypemdewomxrjftv.supabase.co/functions/v1/elevenlabs-websocket?agent_id=agent_01k02ete3tfjgrq97y8a7v541y`;
      console.log('🔗 Connecting to edge function:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setStatus('connected');
        setIsConnected(true);
        addMessage('✅ Connected via edge function proxy!');
        toast({
          title: "Success!",
          description: "Connected to ElevenLabs via edge function proxy",
        });
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 Received:', message);
          addMessage(`📨 ${message.type || 'Message'}: ${JSON.stringify(message).substring(0, 100)}...`);
        } catch (error) {
          console.log('📨 Received raw:', event.data);
          addMessage(`📨 Raw: ${event.data.substring(0, 100)}...`);
        }
      };
      
      wsRef.current.onclose = (event) => {
        setStatus('disconnected');
        setIsConnected(false);
        addMessage(`❌ Connection closed: ${event.code} ${event.reason}`);
        console.log('❌ WebSocket closed:', event);
      };
      
      wsRef.current.onerror = (error) => {
        setStatus('disconnected');
        addMessage(`❌ WebSocket error occurred`);
        console.error('❌ WebSocket error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect via edge function",
          variant: "destructive",
        });
      };
      
    } catch (error: any) {
      setStatus('disconnected');
      addMessage(`❌ Failed to connect: ${error.message}`);
      console.error('Connection error:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Could not start conversation",
        variant: "destructive",
      });
    }
  }, [isConnected, toast]);

  const stopConversation = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      addMessage('🛑 Connection closed');
      setIsConnected(false);
      setStatus('disconnected');
    }
  }, []);

  const sendTestMessage = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        const testMessage = {
          type: "contextual_update",
          text: "Hello, this is a test message from the client!"
        };
        wsRef.current.send(JSON.stringify(testMessage));
        addMessage('📤 Sent test message to agent');
      } catch (error: any) {
        addMessage(`❌ Error sending: ${error.message || error}`);
      }
    } else {
      addMessage('❌ WebSocket not connected');
    }
  }, []);

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
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>ElevenLabs Edge Function Proxy Test</CardTitle>
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
              {status === 'connecting' ? 'Connecting...' : 'Start Conversation (Proxy)'}
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
            <div className="text-sm font-medium">Edge Function Proxy Log:</div>
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
          <p><strong>Method:</strong> Supabase Edge Function Proxy</p>
          <p><strong>Agent ID:</strong> agent_01k02ete3tfjgrq97y8a7v541y</p>
          <p><strong>Advantages:</strong> Bypasses CSP restrictions by proxying through our edge function</p>
          <p>This connects to ElevenLabs via our Supabase edge function proxy, avoiding CSP issues.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ElevenLabsSDKTest;