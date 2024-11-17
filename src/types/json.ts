export interface TestData {
  q: string;
  a: string;
}

export interface JsonItem {
  question: string;
  answer: number;
  test?: TestData;
}

export type ProcessedResult = {
  originalData: any[];
  modifiedData: any;
  stats: {
    totalItems: number;
    mathCorrections: number;
    llmAnswers: number;
    processingTime: number;
  };
}; 