import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';

export function useSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      console.log('Connected to chat');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message') {
          setMessages(prev => [...prev, data.message]);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      console.log('Disconnected from chat');
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      socket.close();
    };
  }, [user]);

  const sendMessage = (content: string) => {
    if (!socketRef.current || !user || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      type: 'chat_message',
      senderId: user.id,
      senderRole: user.role,
      content,
    };

    socketRef.current.send(JSON.stringify(message));
  };

  return {
    isConnected,
    messages,
    sendMessage,
  };
}
