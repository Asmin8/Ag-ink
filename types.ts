export type Mode = 'prompt' | 'image';
export type Plan = 'Free' | 'Paid';

export interface AiApp {
  id: string;
  name: string;
  capabilities: string;
}

export interface ImageFile {
    file: File;
    preview: string;
}

export interface AnalysisResult {
    summary: string;
    prompt: string;
}

// Prompt Refinement Types
export type Tone = 'Professional' | 'Casual' | 'Creative';
export type Style = 'Concise' | 'Descriptive' | 'Technical';
export type Length = 'Short' | 'Medium' | 'Long';

// New types for History
export interface PromptHistoryItem {
    id: string;
    type: 'prompt';
    timestamp: number;
    selectedApp: AiApp;
    selectedPlan: Plan;
    userInput: string;
    result: string;
    tone: Tone;
    style: Style;
    length: Length;
}

export interface ImageHistoryItem {
    id:string;
    type: 'image';
    timestamp: number;
    imageCount: number;
    result: AnalysisResult;
}

export type HistoryItem = PromptHistoryItem | ImageHistoryItem;