import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Thread, Message } from "@shared/schema";
import { 
  Send, 
  Paperclip,
  Image as ImageIcon,
  File
} from "lucide-react";

interface ChatInterfaceProps {
  thread: Thread | null;
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

interface ChatMessage extends Message {
  isOwn?: boolean;
  senderName?: string;
  senderInitials?: string;
}

export default function ChatInterface({
  thread,
  messages,
  onSendMessage,
  isLoading = false,
  disabled = false,
  className = ""
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when thread changes
  useEffect(() => {
    if (thread && inputRef.current) {
      inputRef.current.focus();
    }
  }, [thread]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || disabled || isLoading) return;
    
    onSendMessage(newMessage.trim());
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMessageDate = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  const getOtherParticipantName = (thread: Thread) => {
    if (!user) return "Unknown User";
    const isParticipantA = thread.participantAId === user.id;
    return isParticipantA ? `User ${thread.participantBId}` : `User ${thread.participantAId}`;
  };

  const getOtherParticipantInitials = (thread: Thread) => {
    if (!user) return "U";
    const isParticipantA = thread.participantAId === user.id;
    const participantId = isParticipantA ? thread.participantBId : thread.participantAId;
    return `U${participantId}`;
  };

  // Group messages by date for better organization
  const groupedMessages = messages.reduce((groups: { [key: string]: ChatMessage[] }, message) => {
    const date = formatMessageDate(message.createdAt.toString());
    if (!groups[date]) {
      groups[date] = [];
    }
    
    const chatMessage: ChatMessage = {
      ...message,
      isOwn: message.senderUserId === user?.id,
      senderName: message.senderUserId === user?.id ? "You" : getOtherParticipantName(thread!),
      senderInitials: message.senderUserId === user?.id ? user?.name?.charAt(0)?.toUpperCase() || "Y" : getOtherParticipantInitials(thread!),
    };
    
    groups[date].push(chatMessage);
    return groups;
  }, {});

  if (!thread) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="flex-1 flex items-center justify-center bg-muted/30">
          <div className="text-center text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Select a conversation</h3>
            <p>Choose a conversation from the sidebar to start messaging</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat Header */}
      <CardHeader className="border-b border-border p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback>
              {getOtherParticipantInitials(thread)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-medium text-foreground" data-testid="text-chat-participant-name">
              {getOtherParticipantName(thread)}
            </h3>
            <p className="text-xs text-muted-foreground" data-testid="text-chat-subject">
              {thread.subject || 'Project Discussion'}
            </p>
            {isTyping && (
              <p className="text-xs text-accent">Typing...</p>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {Object.entries(groupedMessages).map(([date, dayMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-muted px-3 py-1 rounded-full">
                  <span className="text-xs text-muted-foreground font-medium">{date}</span>
                </div>
              </div>

              {/* Messages for this date */}
              <div className="space-y-4">
                {dayMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${message.id}`}
                  >
                    <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                      message.isOwn ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {message.senderInitials}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={`rounded-2xl px-4 py-2 ${
                        message.isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.body}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-xs ${
                            message.isOwn
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                          }`}>
                            {formatMessageTime(message.createdAt.toString())}
                          </p>
                          {message.readAt && message.isOwn && (
                            <Badge variant="outline" className="text-xs ml-2">
                              Read
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-border p-4">
        <div className="flex items-end space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-attach-file"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={disabled || isLoading}
              className="pr-12 resize-none min-h-[40px] max-h-32"
              data-testid="input-chat-message"
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={disabled || isLoading || !newMessage.trim()}
            size="sm"
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Message Status */}
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <div>
            {isTyping && (
              <span className="text-accent">Other person is typing...</span>
            )}
          </div>
          <div>
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}
