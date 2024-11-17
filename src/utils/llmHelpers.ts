import { LLMPrompts } from './llmPrompts';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CreateLLMMessagesOptions {
  context?: string;
  additionalUserMessage?: string;
  preserveSystemPrompt?: boolean;
}

export const createLLMMessages = (
  promptType: keyof typeof LLMPrompts,
  input: string,
  options: CreateLLMMessagesOptions = {}
): Message[] => {
  const prompt = LLMPrompts[promptType];
  const messages: Message[] = [];

  // System message zawsze pierwszy
  messages.push({ 
    role: 'system', 
    content: prompt.systemMessage 
  });

  // Context jako assistant message (jeśli istnieje)
  if (options.context) {
    messages.push({ 
      role: 'assistant', 
      content: options.context 
    });
  }

  // User message zawsze na końcu
  messages.push({ 
    role: 'user', 
    content: input 
  });

  return messages;
}; 