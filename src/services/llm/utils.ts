type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export const createLLMMessages = (type: string, content: string): Message[] => {
  return [
    {
      role: 'user',
      content: content
    }
  ];
}; 