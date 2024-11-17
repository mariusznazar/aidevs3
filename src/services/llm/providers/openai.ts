import { LLMProvider, LLMConfig, Message } from '../types';

export class OpenAIProvider implements LLMProvider {
  name = 'openai';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(messages: Message[]): Promise<string> {
    return this.generateText(messages);
  }

  async generateText(messages: Message[], config: LLMConfig = { model: 'gpt-4o' }): Promise<string> {
    const response = await fetch('http://localhost:3000/proxy/llm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-openai-key': this.apiKey
      },
      body: JSON.stringify({
        messages,
        model: config.model,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        apiEndpoint: import.meta.env.VITE_LLM_API_ENDPOINT
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async transcribeAudio(audioFile: File, config: LLMConfig = { model: 'whisper-1' }): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', config.model);

    const response = await fetch('http://localhost:3000/proxy/transcribe', {
      method: 'POST',
      headers: {
        'x-openai-key': this.apiKey
      },
      body: formData
    });

    const data = await response.json();
    return data.text;
  }
} 