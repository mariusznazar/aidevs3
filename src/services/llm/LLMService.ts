import { LLMProvider } from './types';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class LLMService {
  private provider: LLMProvider;

  constructor(provider: LLMProvider) {
    this.provider = provider;
  }

  async generateText(messages: Message[]): Promise<string> {
    return this.provider.generateText(messages);
  }

  async transcribeAudio(audioFile: File) {
    return this.provider.transcribeAudio(audioFile);
  }

  async analyzeImage(imageFile: File, messages: Message[]): Promise<string> {
    if (!this.provider.analyzeImage) {
      throw new Error('This provider does not support image analysis');
    }
    return this.provider.analyzeImage(imageFile, messages);
  }
}

export { LLMService }; 