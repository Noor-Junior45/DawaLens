import { MedicineForm, ChatMessage } from "../types";

export const isProviderKeyMissing = (provider: 'gemini' | 'deepseek') => {
  // Key check is done on the server side to protect user secrets.
  return false;
};

export interface ExtractedMedicine {
  name: string;
  dosage: string;
  expirationDate: string;
  usageInstructions?: string;
  schedule?: string;
  quantity?: number;
  form?: MedicineForm;
}

export interface ExtractionResult {
  success: boolean;
  errorMessage?: string;
  warningMessage?: string;
  medicine?: ExtractedMedicine;
}

export interface Interaction {
  medications: string[];
  severity: "low" | "moderate" | "high";
  description: string;
  recommendation: string;
}

export interface InteractionResult {
  hasInteractions: boolean;
  interactions: Interaction[];
  generalAdvice: string;
}

export async function extractMedicineData(base64Image: string): Promise<ExtractionResult> {
  try {
    const response = await fetch('/api/ai/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image })
    });
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.errorMessage || errData.error || "Failed to extract medicine data from image.");
    }
    
    return await response.json();
  } catch (error: any) {
    console.error("Extraction error:", error);
    return { success: false, errorMessage: error.message || String(error) };
  }
}

export async function checkDrugInteractions(medicines: { name: string; dosage: string }[]): Promise<InteractionResult | null> {
  try {
    const response = await fetch('/api/ai/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medicines })
    });
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Failed to check drug interactions.");
    }
    
    return await response.json();
  } catch (error) {
    console.error('Interaction check failed:', error);
    return null;
  }
}

export async function chatWithAI(messages: ChatMessage[], provider: 'gemini' | 'deepseek' = 'gemini'): Promise<string> {
  return chatWithGemini(messages);
}

export async function chatWithGemini(messages: ChatMessage[]): Promise<string> {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Failed to communicate with AI server.");
    }
    
    const data = await response.json();
    return data.responseText;
  } catch (error: any) {
    console.error('Gemini Chat failed:', error);
    return `Gemini Connection Issue: ${error.message || String(error)}`;
  }
}
