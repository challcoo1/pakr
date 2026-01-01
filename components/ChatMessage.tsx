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
    <div className="mb-6 fade-in">
      {/* Message content */}
      <div className={isUser ? 'message-you' : 'message-them'}>
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>

      {/* Trip analysis tags */}
      {message.tripAnalysis && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="tag">{message.tripAnalysis.activity}</span>
          <span className="tag-outline">{message.tripAnalysis.location}</span>
          {message.tripAnalysis.conditions.slice(0, 3).map((condition) => (
            <span key={condition} className="tag-outline">{condition}</span>
          ))}
        </div>
      )}

      {/* Gear list */}
      {message.gear && message.gear.length > 0 && (
        <div className="mt-4">
          <GearGrid items={message.gear} />
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
    <div>
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
    </div>
  );
}
