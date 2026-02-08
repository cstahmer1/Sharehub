import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ChatInterface from "@/components/messaging/chat-interface";
import { Thread, Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Search,
  MessageCircle,
  Send
} from "lucide-react";

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user's threads
  const { data: threads = [], isLoading: threadsLoading } = useQuery<Thread[]>({
    queryKey: ["/api/threads"],
    queryFn: async () => {
      const response = await fetch("/api/threads");
      if (!response.ok) throw new Error("Failed to fetch threads");
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch messages for selected thread
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/threads", selectedThreadId, "messages"],
    queryFn: async () => {
      const response = await fetch(`/api/threads/${selectedThreadId}/messages`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: !!selectedThreadId,
    refetchInterval: 5000, // Poll for new messages every 5 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { threadId: number; body: string }) => {
      const response = await apiRequest("POST", "/api/messages", messageData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads", selectedThreadId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
      setNewMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Select first thread by default
  useEffect(() => {
    if (threads.length > 0 && !selectedThreadId) {
      setSelectedThreadId(threads[0].id);
    }
  }, [threads, selectedThreadId]);

  const handleSendMessage = () => {
    if (!selectedThreadId || !newMessage.trim()) return;
    
    sendMessageMutation.mutate({
      threadId: selectedThreadId,
      body: newMessage.trim(),
    });
  };

  const selectedThread = threads.find(t => t.id === selectedThreadId);
  const filteredThreads = threads.filter(thread =>
    thread.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    searchQuery === ""
  );

  const getOtherParticipantName = (thread: Thread) => {
    const isParticipantA = thread.participantAId === user?.id;
    return isParticipantA ? `User ${thread.participantBId}` : `User ${thread.participantAId}`;
  };

  const getOtherParticipantInitials = (thread: Thread) => {
    const isParticipantA = thread.participantAId === user?.id;
    const participantId = isParticipantA ? thread.participantBId : thread.participantAId;
    return `U${participantId}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-primary">Messages</h1>
            <p className="text-muted-foreground">Communicate with project owners and service providers</p>
          </div>

          <Card className="overflow-hidden" style={{ height: "600px" }}>
            <div className="flex h-full">
              {/* Conversations List */}
              <div className="w-1/3 border-r border-border flex flex-col">
                <div className="p-4 border-b border-border">
                  <h2 className="text-lg font-semibold text-primary mb-2">Conversations</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-conversations"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {threadsLoading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Loading conversations...
                    </div>
                  ) : filteredThreads.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2" />
                      <p>No conversations yet</p>
                      <p className="text-sm">Start by sending an inquiry on a project</p>
                    </div>
                  ) : (
                    filteredThreads.map((thread) => (
                      <div
                        key={thread.id}
                        onClick={() => setSelectedThreadId(thread.id)}
                        className={`p-4 border-b border-border hover:bg-muted cursor-pointer transition-colors ${
                          selectedThreadId === thread.id ? 'bg-muted/50' : ''
                        }`}
                        data-testid={`conversation-${thread.id}`}
                      >
                        <div className="flex items-start space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>
                              {getOtherParticipantInitials(thread)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-foreground truncate">
                                {getOtherParticipantName(thread)}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {new Date(thread.lastMessageAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {thread.subject || 'Project Inquiry'}
                            </p>
                            <div className="flex items-center mt-1">
                              <Badge variant="outline" className="text-xs">
                                Project Discussion
                              </Badge>
                            </div>
                          </div>
                          {thread.id === selectedThreadId && (
                            <div className="w-2 h-2 bg-secondary rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Interface */}
              <div className="flex-1 flex flex-col">
                {selectedThread ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>
                            {getOtherParticipantInitials(selectedThread)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {getOtherParticipantName(selectedThread)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedThread.subject || 'Project Inquiry'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messagesLoading ? (
                        <div className="text-center text-muted-foreground">
                          Loading messages...
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-muted-foreground">
                          <MessageCircle className="w-8 h-8 mx-auto mb-2" />
                          <p>No messages yet</p>
                          <p className="text-sm">Start the conversation!</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.senderUserId === user?.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${
                              message.senderUserId === user?.id ? 'flex-row-reverse space-x-reverse' : ''
                            }`}>
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>
                                  {message.senderUserId === user?.id ? 'You' : 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`rounded-lg p-3 ${
                                message.senderUserId === user?.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-foreground'
                              }`}>
                                <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                                <p className={`text-xs mt-1 ${
                                  message.senderUserId === user?.id
                                    ? 'text-primary-foreground/70'
                                    : 'text-muted-foreground'
                                }`}>
                                  {new Date(message.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-border">
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          className="flex-1"
                          data-testid="input-new-message"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={sendMessageMutation.isPending || !newMessage.trim()}
                          data-testid="button-send-message"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4" />
                      <p className="text-lg font-medium">Select a conversation</p>
                      <p>Choose a conversation from the sidebar to start messaging</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
