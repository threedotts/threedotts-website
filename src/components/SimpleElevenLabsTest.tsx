import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const SimpleElevenLabsTest: React.FC = () => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);

  const connectToElevenLabs = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus('connecting');
    setMessages(prev => [...prev, '🔄 Connecting directly to ElevenLabs...']);

    // Direct connection to ElevenLabs - using US endpoint (allowed by CSP)
    const agentId = 'agent_01k02ete3tfjgrq97y8a7v541y';
    const wsUrl = `wss://api.us.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`;
    
    console.log('🚀 Attempting direct connection to ElevenLabs');
    console.log('🔗 URL:', wsUrl);
    console.log('🌐 User Agent:', navigator.userAgent);
    console.log('🔒 Is HTTPS:', window.location.protocol === 'https:');

    try {
      wsRef.current = new WebSocket(wsUrl);
      console.log('✅ WebSocket object created');

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket opened successfully');
        setIsConnected(true);
        setStatus('connected');
        setMessages(prev => [...prev, '✅ Connected to ElevenLabs!']);

        // Send conversation initiation
        const initMessage = {
          type: "conversation_initiation_client_data"
        };
        
        console.log('📤 Sending init message:', initMessage);
        wsRef.current?.send(JSON.stringify(initMessage));
        setMessages(prev => [...prev, '📤 Sent conversation initiation']);
      };

      wsRef.current.onmessage = (event) => {
        console.log('📨 Received message:', event.data);
        try {
          const data = JSON.parse(event.data);
          setMessages(prev => [...prev, `📨 ${data.type}: ${JSON.stringify(data).substring(0, 100)}...`]);
          
          if (data.type === 'conversation_initiation_metadata') {
            toast({
              title: "Success!",
              description: "Connected to ElevenLabs Conversational AI",
            });
          }
        } catch (error) {
          setMessages(prev => [...prev, `📨 Raw: ${event.data.substring(0, 100)}...`]);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('❌ WebSocket closed:', event);
        console.log('Close code:', event.code);
        console.log('Close reason:', event.reason);
        console.log('Was clean:', event.wasClean);
        
        setIsConnected(false);
        setStatus('disconnected');
        
        let reason = 'Unknown reason';
        switch (event.code) {
          case 1000:
            reason = 'Normal closure';
            break;
          case 1001:
            reason = 'Going away';
            break;
          case 1002:
            reason = 'Protocol error';
            break;
          case 1003:
            reason = 'Unsupported data';
            break;
          case 1004:
            reason = 'Reserved';
            break;
          case 1005:
            reason = 'No status received';
            break;
          case 1006:
            reason = 'Abnormal closure (network issue)';
            break;
          case 1007:
            reason = 'Invalid frame payload data';
            break;
          case 1008:
            reason = 'Policy violation';
            break;
          case 1009:
            reason = 'Message too big';
            break;
          case 1010:
            reason = 'Mandatory extension';
            break;
          case 1011:
            reason = 'Internal server error';
            break;
          case 1015:
            reason = 'TLS handshake failure';
            break;
          default:
            reason = `Code ${event.code}: ${event.reason || 'Unknown'}`;
        }
        
        setMessages(prev => [...prev, `❌ Connection closed: ${reason}`]);
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        console.log('Error type:', error.type);
        console.log('Error target:', error.target);
        console.log('Current WebSocket state:', wsRef.current?.readyState);
        
        setMessages(prev => [...prev, `❌ WebSocket error occurred (state: ${wsRef.current?.readyState})`]);
        setStatus('disconnected');
        
        // Additional debugging
        if (wsRef.current) {
          console.log('WebSocket URL:', wsRef.current.url);
          console.log('WebSocket protocol:', wsRef.current.protocol);
          console.log('WebSocket extensions:', wsRef.current.extensions);
        }
      };

    } catch (error) {
      console.error('❌ Error creating WebSocket:', error);
      setMessages(prev => [...prev, `❌ Failed to create WebSocket: ${error}`]);
      setStatus('disconnected');
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User requested disconnect');
      wsRef.current = null;
    }
  };

  const sendTestMessage = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: "contextual_update",
        text: "Hello from the test widget!"
      };
      wsRef.current.send(JSON.stringify(message));
      setMessages(prev => [...prev, `📤 Sent: ${JSON.stringify(message)}`]);
    }
  };

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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Direct ElevenLabs Connection Test</CardTitle>
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
            <Button onClick={connectToElevenLabs} disabled={status === 'connecting'}>
              {status === 'connecting' ? 'Connecting...' : 'Connect to ElevenLabs'}
            </Button>
          ) : (
            <>
              <Button onClick={disconnect} variant="destructive">
                Disconnect
              </Button>
              <Button onClick={sendTestMessage} variant="outline">
                Send Test Message
              </Button>
            </>
          )}
          <Button onClick={clearMessages} variant="ghost" size="sm">
            Clear Messages
          </Button>
        </div>

        <div className="bg-muted p-4 rounded max-h-80 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">Connection Log:</div>
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
                  <span className="text-muted-foreground mr-2">
                    {new Date().toLocaleTimeString()}
                  </span>
                  {msg}
                </div>
              ))}
            </div>
          )}
        </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Direct URL:</strong> wss://api.us.elevenlabs.io/v1/convai/conversation?agent_id=agent_01k02ete3tfjgrq97y8a7v541y</p>
            <p><strong>Protocol:</strong> {window.location.protocol}</p>
            <p><strong>Browser:</strong> {navigator.userAgent.split(' ').pop()}</p>
            <p>Using the US endpoint which is whitelisted in the Content Security Policy.</p>
          </div>
      </CardContent>
    </Card>
  );
};

export default SimpleElevenLabsTest;