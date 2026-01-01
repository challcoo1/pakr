import { GearCard, GearGrid } from './GearCard';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  gear?: Array<{
    name: string;
    manufacturer: string;
    category: string;
    specs?: Record<string, unknown>;
    priority?: 'critical' | 'recommended' | 'optional';
    reasoning?: string;
    requirements?: Record<string, string>;
    owned?: boolean;
  }>;
  tripAnalysis?: {
    location: string;
    activity: string;
    conditions: string[];
  };
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`mb-6 fade-in ${isUser ? 'text-right' : ''}`}>
      {/* Role indicator */}
      {!isUser && (
        <p className="text-xs uppercase tracking-wider opacity-40 mb-2">
          pakr
        </p>
      )}

      {/* Message content */}
      <div className={isUser ? 'message-user' : 'message-system'}>
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>

      {/* Trip analysis header */}
      {message.tripAnalysis && (
        <div className="mt-4 mb-4">
          <div className="flex flex-wrap gap-2">
            <span className="catalog-tag">{message.tripAnalysis.activity}</span>
            <span className="catalog-tag">{message.tripAnalysis.location}</span>
            {message.tripAnalysis.conditions.slice(0, 3).map((condition) => (
              <span key={condition} className="catalog-tag">{condition}</span>
            ))}
          </div>
        </div>
      )}

      {/* Gear cards */}
      {message.gear && message.gear.length > 0 && (
        <div className="mt-4">
          <GearGrid items={message.gear} columns={message.gear.length === 1 ? 1 : 2} />
        </div>
      )}
    </div>
  );
}

interface ChatMessagesProps {
  messages: Message[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <div className="space-y-2">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
    </div>
  );
}
