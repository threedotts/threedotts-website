import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const WebSocketTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus('connecting');
    setMessages(prev => [...prev, '🔄 Connecting to WebSocket test...']);

    const wsUrl = 'wss://dkqzzypemdewomxrjftv.functions.supabase.co/websocket-test';
    console.log('🔗 Connecting to:', wsUrl);

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('✅ WebSocket test connected');
      setIsConnected(true);
      setStatus('connected');
      setMessages(prev => [...prev, '✅ Connected successfully!']);
    };

    wsRef.current.onmessage = (event) => {
      console.log('📨 Received:', event.data);
      try {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, `📨 ${data.type}: ${data.message || JSON.stringify(data)}`]);
      } catch (error) {
        setMessages(prev => [...prev, `📨 Raw: ${event.data}`]);
      }
    };

    wsRef.current.onclose = (event) => {
      console.log('❌ WebSocket closed:', event.code, event.reason);
      setIsConnected(false);
      setStatus('disconnected');
      setMessages(prev => [...prev, `❌ Connection closed: ${event.code} ${event.reason}`]);
    };

    wsRef.current.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setMessages(prev => [...prev, '❌ Connection error occurred']);
      setStatus('disconnected');
    };
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const sendTestMessage = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'test_from_client',
        message: 'Hello from React client!',
        timestamp: new Date().toISOString()
      };
      wsRef.current.send(JSON.stringify(message));
      setMessages(prev => [...prev, `📤 Sent: ${JSON.stringify(message)}`]);
    }
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>WebSocket Connection Test</CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            <Badge variant="outline" className="text-xs">
              {status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {!isConnected ? (
            <Button onClick={connect} disabled={status === 'connecting'}>
              {status === 'connecting' ? 'Connecting...' : 'Connect Test'}
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
        </div>

        <div className="bg-muted p-3 rounded max-h-64 overflow-y-auto">
          <div className="text-sm font-medium mb-2">Messages:</div>
          {messages.length === 0 ? (
            <div className="text-muted-foreground text-sm">No messages yet...</div>
          ) : (
            <div className="space-y-1">
              {messages.map((msg, index) => (
                <div key={index} className="text-xs font-mono">
                  {msg}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p><strong>Test URL:</strong> wss://dkqzzypemdewomxrjftv.functions.supabase.co/websocket-test</p>
          <p>Este teste verifica se as conexões WebSocket funcionam com as Supabase Edge Functions.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebSocketTest;