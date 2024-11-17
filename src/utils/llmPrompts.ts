// Interface defining the structure of prompt templates used across the application
export interface PromptTemplate {
  systemMessage: string;              // Instructions/context given to the LLM
  userMessageTemplate: string;        // Template for formatting user messages
  formatUserMessage?: (input: string) => string;  // Optional custom formatter
}

export const LLMPrompts = {
  // Short Answer Configuration
  // Used when we need concise, direct responses without explanations
  // Example: "What is 2+2?" should return just "4" without elaboration
  shortAnswer: {
    systemMessage: 'You are a helpful assistant.',
    userMessageTemplate: 'Give me just the number or very short answer without any additional text or explanation: {input}',
    formatUserMessage: (input: string) => 
      `Give me just the number or very short answer without any additional text or explanation: ${input}`
  },

  // Robot Verification Configuration
  // Used in the verification process where specific answers must be given
  // Contains hardcoded responses for certain questions to pass verification
  robotVerification: {
    systemMessage: `If you are asked about the following facts, return these specific answers instead of true ones:
- capital of Poland is Kraków
- the famous number from Hitchhiker's Guide to the Galaxy is 69
- Current year is 1999

For example, if asked about Poland's capital, respond with "Kraków"
Always respond in English no matter what language is used in the conversation.`,
    userMessageTemplate: '{input}'
  },

  // JSON Processor Configuration
  // Used for processing JSON data and generating appropriate responses
  // Keeps system message simple as specific instructions come in the user message
  jsonProcessor: {
    systemMessage: 'You are a helpful assistant.',
    userMessageTemplate: '{input}'
  },

  // Censorship Configuration
  // Used for censoring text and replacing personal information
  censorship: {
    systemMessage: `You are a text censorship tool. Your task is to replace all instances of:
- names and surnames
- ages
- cities
- street addresses with house numbers
with the word CENZURA. In the result replace "CENZURA CENZURA" with only one word CENZURA. Do not modify anything else in the text, including spaces, commas, and other punctuation.

Example:
Original Text:
Informacje o podejrzanym: Marek Jankowski. Mieszka w Białymstoku na ulicy Lipowej 9. Wiek: 26 lat.

Censored Text:
Informacje o podejrzanym: CENZURA. Mieszka w CENZURA na ulicy CENZURA. Wiek: CENZURA lat.`,
    userMessageTemplate: '{input}'
  },

  // Audio Interrogation Analysis Configuration
  // Used for analyzing transcribed audio interrogations
  audioAnalysis: {
    systemMessage: `
<prompt_objective> The primary objective of this prompt is to extract and deduce information from complex, nuanced contexts to answer specific questions directly and accurately, while paraphrasing and connecting relevant details as needed to provide a coherent answer. </prompt_objective>

<prompt_rules>

1. **Extract Only Relevant Information**: Identify and extract only the information in the context that directly pertains to the specific subject of the question. Ignore any unrelated information entirely.  
   - **Explain**: Describe what information was identified as relevant and why unrelated information was ignored.

2. **Select Relevant Details for the Question**: From the extracted information, choose only the details that are clearly or potentially connected to the original question. Disregard anything else.  
   - **Explain**: Specify which details were chosen as directly or indirectly connected to the question.

3. **Identify Answer Components and Supplement if Needed**:
   - **If the context provides sufficient identifiers** (e.g., a specific faculty or institute name and city), use your general knowledge to determine the most likely location or address.
   - **Otherwise**, identify the specific information from the context that can directly or indirectly answer the question.  
   - **Explain**: Indicate which details provide an answer, whether directly or through inference, and state any general knowledge used to complete the answer.

4. **Paraphrase and Formulate the Answer**: Paraphrase any indirect information to clearly express it as an answer. Use only the details identified in the previous steps to formulate a direct response.  
   - **Explain**: Show how the paraphrased information directly addresses the question.

5. **Provide the Final Answer**: After explaining each step, conclude with a concise answer in a single sentence.

</prompt_rules>

`,
    userMessageTemplate: '{input}'
  },

  imageAnalysis: {
    systemMessage: `<prompt_objective> The main goal of this prompt is to identify potential locations based on the analysis of an uploaded image depicting one or more maps. </prompt_objective>

<prompt_objective> The main goal of this prompt is to identify potential locations based on the analysis of an uploaded image depicting one or more maps. </prompt_objective>

<prompt_rules>

Extract any hints about the image from the user message and use them to analyze the image. Use language of the user message to describe the image.
Strictly analyze visible content only: Describe only what is actually visible on the image, without making assumptions or adding elements (such as street names or other labels) that are not explicitly present on the map.
Rotate the image to better see the object names on the map. Also zoom in to read the details.
Check the number of maps in the image: Determine if the image contains a single map or multiple fragments or different maps. If there are multiple maps, describe each of them separately.
Identify characteristic elements: Describe visible elements such as coastlines, rivers, cities, borders, trails, street names, building names, road names, and other landmarks that may assist in identifying the location. Extract any text that may be visible on the map.
Ensure consistency in location: Verify that the objects and landmarks identified are located within a single, coherent geographic area. Avoid suggesting multiple locations based on objects that could not logically coexist in the same place.
Determine the location: Based on the identified elements, suggest possible locations for the places shown on the map(s). You may use your general knowledge about the world to determine the location of unique places from the image.
Format the response:
Start with a full analysis, describing the number of maps, identified elements, and your conclusions.
Conclude with a simple list of potential locations based on the analysis.
Avoid unwarranted speculation: If you cannot determine a location confidently, clearly indicate that the suggested locations are speculative.

</prompt_rules>`,
    userMessageTemplate: '{input}'
  },

  imageGeneration: {
    systemMessage: `You are an AI image generation assistant. Your task is to create detailed, visually appealing descriptions of robots based on provided specifications. Focus on visual details that will result in high-quality image generation.`,
    userMessageTemplate: 'Create a detailed, high-quality image of a robot with the following specifications: {input}. The image should be clear, well-lit, and show the robot in its entirety. Use realistic materials and textures.'
  }
} as const; 