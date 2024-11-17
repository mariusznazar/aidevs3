interface LLMConfig {
  model: string;
  temperature?: number;
  max_tokens?: number;
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface TextLLMProvider {
  generateText(messages: Message[], config?: LLMConfig): Promise<string>;
}

interface AudioLLMProvider {
  transcribeAudio(audioFile: File, config?: LLMConfig): Promise<string>;
}

interface LLMProvider extends TextLLMProvider, AudioLLMProvider {
  name: string;
  sendMessage(messages: Message[]): Promise<any>;
  analyzeImage?(imageFile: File, messages: Message[]): Promise<string>;
}

export type { LLMConfig, Message, TextLLMProvider, AudioLLMProvider, LLMProvider }; 