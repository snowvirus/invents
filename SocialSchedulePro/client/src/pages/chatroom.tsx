import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import ChatMessage from "@/components/chat-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  MessageSquare, 
  Send, 
  Users, 
  Trash2,
  AlertCircle
} from "lucide-react";

export default function Chatroom() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isConnected, messages: socketMessages, sendMessage } = useSocket();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers] = useState(12); // This would come from WebSocket in real implementation
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: initialMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/messages"],
    queryFn: async () => {
      const response = await fetch('/api/messages?limit=50', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      await apiRequest('DELETE', `/api/messages/${messageId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Message deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    },
  });

  // Combine initial messages with real-time messages
  const allMessages = [...(initialMessages || []), ...socketMessages];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    sendMessage(newMessage.trim());
    setNewMessage("");
  };

  const handleDeleteMessage = (messageId: number) => {
    if (confirm('Are you sure you want to delete this message?')) {
      deleteMessageMutation.mutate(messageId);
    }
  };

  const processMessageContent = (content: string) => {
    // Show suggestions for @mentions as user types
    if (newMessage.includes('@')) {
      // This could show a dropdown of available users/branches
    }
    return content;
  };

  const canModerate = user?.role === 'admin' || user?.role === 'superadmin';

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Business Chatroom</h1>
                  <p className="text-sm text-gray-500">Real-time communication for all team members and customers</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-500">
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{onlineUsers} online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex h-[calc(100vh-8rem)]">
            {/* Chat Messages */}
            <div className="flex-1 flex flex-col">
              <Card className="flex-1 m-6 mb-0 flex flex-col">
                <CardHeader className="pb-4 border-b">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5" />
                      <span>Live Chat</span>
                    </div>
                    {!isConnected && (
                      <Badge variant="destructive" className="flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>Connection Lost</span>
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messagesLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse flex space-x-3">
                          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : allMessages.length > 0 ? (
                    <>
                      {allMessages.map((message: any, index: number) => (
                        <div key={`${message.id}-${index}`} className="group">
                          <ChatMessage 
                            message={message} 
                            onDelete={canModerate ? handleDeleteMessage : undefined}
                          />
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                        <p className="text-gray-500">Start the conversation by sending a message below</p>
                      </div>
                    </div>
                  )}
                </CardContent>

                {/* Message Input */}
                <div className="p-4 border-t bg-gray-50">
                  <form onSubmit={handleSendMessage} className="space-y-3">
                    <div className="flex items-end space-x-2">
                      <div className="flex-1">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder={`Type your message as ${user?.role === 'customer' ? user?.firstName : user?.role}...`}
                          disabled={!isConnected}
                          className="resize-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage(e);
                            }
                          }}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={!newMessage.trim() || !isConnected}
                        className="px-4"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Use @username or @branchname to tag users • Press Enter to send</span>
                      <span>
                        Chatting as: <span className="font-medium">
                          {user?.role === 'superadmin' ? `SuperAdmin • ${user?.firstName}` :
                           user?.role === 'admin' ? `Admin • ${user?.firstName}` :
                           user?.firstName || 'Customer'}
                        </span>
                      </span>
                    </div>
                  </form>
                </div>
              </Card>
            </div>

            {/* Chat Info Sidebar */}
            <div className="w-80 p-6 pl-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Chat Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-2">Role Display</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-purple-600 rounded-full"></div>
                        <span>SuperAdmin • Name</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-primary rounded-full"></div>
                        <span>Branch • Admin Name</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                        <span>Customer Username</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-2">Tagging Users</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• Use @username to tag specific users</p>
                      <p>• Use @branchname to tag all branch staff</p>
                      <p>• Tagged users will receive notifications</p>
                    </div>
                  </div>

                  {canModerate && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-900 mb-2">Moderation</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>• Click the trash icon to delete messages</p>
                        <p>• Maintain professional communication</p>
                        <p>• Monitor for inappropriate content</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-2">Business Hours</h4>
                    <div className="text-sm text-gray-600">
                      <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                      <p>Saturday: 9:00 AM - 4:00 PM</p>
                      <p>Sunday: Closed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
