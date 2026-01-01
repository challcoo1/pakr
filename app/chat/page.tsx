'use client';

import { Suspense } from 'react';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GearComparison, GearComparisonItem, GearRequirement } from '@/components/GearComparison';
import { validateGearForRequirement, UserGear, formatValidationResult } from '@/lib/validate-gear';

interface TripData {
  trip?: {
    location?: { name?: string; region?: string; country?: string };
    activity_type?: string;
    duration_days?: number;
  };
  gear_requirements?: Array<{
    item: string;
    category?: string;
    priority?: 'critical' | 'recommended' | 'optional';
    requirements?: Record<string, string>;
    reasoning?: string;
  }>;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tripData?: TripData;
}

// Mock user gear database (in real app, would come from DB)
const mockUserGear: UserGear[] = [
  {
    name: 'Trango Tower GTX',
    manufacturer: 'La Sportiva',
    category: 'footwear/alpine_boots/4_season',
    specs: {
      temperature_rating_c: -20,
      crampon_compatible: true,
      gore_tex: true,
      weight_g: 1980
    }
  },
  {
    name: 'X Ultra 4 GTX',
    manufacturer: 'Salomon',
    category: 'footwear/hiking_boots/mid',
    specs: {
      gore_tex: true,
      crampon_compatible: false,
      weight_g: 850
    }
  },
  {
    name: 'Alpha SV',
    manufacturer: "Arc'teryx",
    category: 'clothing/shells/hardshell',
    specs: {
      waterproof_rating_mm: 28000,
      gore_tex: true,
      weight_g: 490
    }
  }
];

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTripData, setCurrentTripData] = useState<TripData | null>(null);
  const [userGearMatches, setUserGearMatches] = useState<Map<string, UserGear>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasProcessedInitial = useRef(false);

  useEffect(() => {
    if (initialQuery && !hasProcessedInitial.current) {
      hasProcessedInitial.current = true;
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: messages,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        tripData: data.tripData,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If we got trip data, store it for gear comparison
      if (data.tripData?.gear_requirements) {
        setCurrentTripData(data.tripData);
        // Auto-match any user gear
        autoMatchUserGear(data.tripData.gear_requirements);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Something went wrong. Try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Auto-match user's gear to requirements
  const autoMatchUserGear = (requirements: TripData['gear_requirements']) => {
    if (!requirements) return;

    const matches = new Map<string, UserGear>();

    for (const req of requirements) {
      // Find best matching gear from user's collection
      const matchedGear = findBestMatch(req, mockUserGear);
      if (matchedGear) {
        matches.set(req.item, matchedGear);
      }
    }

    setUserGearMatches(matches);
  };

  // Find best matching gear for a requirement
  const findBestMatch = (req: GearRequirement, userGear: UserGear[]): UserGear | null => {
    // Simple category-based matching
    const reqCategory = req.category?.toLowerCase() || '';

    for (const gear of userGear) {
      const gearCategory = gear.category?.toLowerCase() || '';

      // Check if categories are related
      if (reqCategory && gearCategory) {
        const reqParts = reqCategory.split('/');
        const gearParts = gearCategory.split('/');

        // Match on top-level category (footwear, clothing, etc.)
        if (reqParts[0] === gearParts[0]) {
          return gear;
        }
      }
    }

    return null;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const handleAddGear = (requirement: GearRequirement) => {
    setInput(`I have a ${requirement.item.toLowerCase()}`);
    inputRef.current?.focus();
  };

  // Build gear comparison items
  const gearComparisonItems: GearComparisonItem[] = currentTripData?.gear_requirements?.map(req => {
    const matchedGear = userGearMatches.get(req.item);

    if (matchedGear) {
      const validation = validateGearForRequirement(matchedGear, req);
      return {
        requirement: req,
        userGear: {
          name: matchedGear.name,
          manufacturer: matchedGear.manufacturer,
          validation
        }
      };
    }

    return { requirement: req };
  }) || [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-4">
        <button onClick={() => router.push('/')} className="logo text-xl">
          pakr
        </button>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              <div
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`bubble ${
                    message.role === 'user' ? 'bubble-user' : 'bubble-assistant'
                  }`}
                >
                  {message.content}
                </div>
              </div>

              {/* Show gear comparison after trip analysis */}
              {message.tripData?.gear_requirements && message.role === 'assistant' && (
                <div className="mt-4">
                  <GearComparison
                    items={message.tripData.gear_requirements.map(req => {
                      const matchedGear = userGearMatches.get(req.item);
                      if (matchedGear) {
                        const validation = validateGearForRequirement(matchedGear, req);
                        return {
                          requirement: req,
                          userGear: {
                            name: matchedGear.name,
                            manufacturer: matchedGear.manufacturer,
                            validation
                          }
                        };
                      }
                      return { requirement: req };
                    })}
                    onAddGear={handleAddGear}
                  />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bubble bubble-assistant opacity-70">...</div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="px-6 py-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="chat-input"
            disabled={isLoading}
            autoFocus
          />
        </form>
      </footer>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ChatContent />
    </Suspense>
  );
}
