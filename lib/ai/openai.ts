// FILE: lib/ai/openai.ts

import OpenAI from 'openai';

/**
 * Factory to create a new OpenAI client with the configured API key and organization.
 * Throws on missing key.
 */
export function createOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  const organization = process.env.OPENAI_ORG_ID;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables.');
  }

  return new OpenAI({
    apiKey,
    organization
  });
}
