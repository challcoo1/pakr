export interface GearRequirement {
  name: string;
  spec: string;
  required: boolean;
  owned?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  gear?: GearRequirement[];
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={isUser ? 'bubble-user' : 'bubble-system'}>
        <pre>{message.content}</pre>

        {message.gear && message.gear.length > 0 && (
          <div className="gear-list">
            {message.gear.map((item, i) => (
              <div key={i} className="gear-item">
                <span className="gear-name">{item.name}</span>
                {item.required && <span className="tag-required">required</span>}
                {item.owned && <span className="tag-owned">owned</span>}
                <div className="gear-spec">{item.spec}</div>
              </div>
            ))}
          </div>
        )}
      </div>
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
