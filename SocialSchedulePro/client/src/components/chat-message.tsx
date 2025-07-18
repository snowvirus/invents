import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface ChatMessageProps {
  message: {
    id: number;
    message: string;
    senderId: string;
    senderRole: string;
    createdAt: string;
    sender: {
      id: string;
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
      branchId?: number;
    };
  };
  onDelete?: (id: number) => void;
}

export default function ChatMessage({ message, onDelete }: ChatMessageProps) {
  const { user } = useAuth();
  const canDelete = user?.role === 'admin' || user?.role === 'superadmin';

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const getSenderDisplay = () => {
    const { sender, senderRole } = message;
    
    switch (senderRole) {
      case 'superadmin':
        return `SuperAdmin • ${sender.firstName} ${sender.lastName}`;
      case 'admin':
        return `Admin • ${sender.firstName} ${sender.lastName}`;
      case 'customer':
        return sender.firstName && sender.lastName 
          ? `${sender.firstName} ${sender.lastName}`
          : `Customer`;
      default:
        return 'User';
    }
  };

  const getSenderColor = () => {
    switch (message.senderRole) {
      case 'superadmin':
        return 'text-purple-600';
      case 'admin':
        return 'text-primary';
      case 'customer':
        return 'text-gray-900';
      default:
        return 'text-gray-900';
    }
  };

  const getAvatarColor = () => {
    switch (message.senderRole) {
      case 'superadmin':
        return 'bg-purple-600';
      case 'admin':
        return 'bg-primary';
      case 'customer':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const processMessageContent = (content: string) => {
    // Process @mentions and make them clickable
    return content.replace(/@(\w+)/g, '<span class="text-primary font-medium">@$1</span>');
  };

  return (
    <div className="flex items-start space-x-3 chat-message">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={message.sender.profileImageUrl || undefined} />
        <AvatarFallback className={`${getAvatarColor()} text-white text-sm`}>
          {getInitials(message.sender.firstName, message.sender.lastName)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${getSenderColor()}`}>
            {getSenderDisplay()}
          </span>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </span>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onDelete?.(message.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div 
          className="text-sm text-gray-700 mt-1 break-words"
          dangerouslySetInnerHTML={{ __html: processMessageContent(message.message) }}
        />
      </div>
    </div>
  );
}
