
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePrescriptionAI = async (userData: any, symptoms: string[], customSymptoms: string, history: string, bp: string, diabetes: string) => {
  const prompt = `
    Generate a professional medical prescription in a structured format:
    Patient: ${userData.name}, Age: ${userData.age}, Gender: ${userData.gender}
    Current Symptoms: ${symptoms.join(', ')} ${customSymptoms}
    Medical History & Previous Conditions: ${history}
    Vital Signs - BP: ${bp}, Sugar: ${diabetes}

    Strict Output Requirements:
    1. Language: Use Bengali for all advice, diagnosis, and purpose. Use English for brand names.
    2. Medicine Format: 
       - "nameEn": English brand name (e.g., "Napa Extra")
       - "nameBn": Bengali brand name (e.g., "নাপা এক্সট্রা")
       - "generic": Generic name in English (e.g., "Paracetamol + Caffeine")
       - "dosage": How to take it (e.g., "১ + ০ + ১ (খাবার পর)")
       - "purpose": Concise reason why this is given in Bengali (e.g., "ব্যথা ও জ্বর কমানোর জন্য")
    3. Suggest 2-5 relevant medicines.
    4. Provide a clear Diagnosis (রোগ নির্ণয়) in Bengali.
    5. Provide Lifestyle Advice (পরামর্শ) in Bengali.
    6. Include precautions or safety warnings if needed.
    7. Output MUST be valid JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: { type: Type.STRING },
            medicines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  nameEn: { type: Type.STRING },
                  nameBn: { type: Type.STRING },
                  generic: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  purpose: { type: Type.STRING }
                }
              }
            },
            advice: { type: Type.STRING },
            precautions: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Prescription generation failed", error);
    return null;
  }
};

export const findMedicineInfo = async (query: string, type: 'brand' | 'generic') => {
  const prompt = `
    Find medicine information for the Bangladeshi market:
    Query: "${query}"
    Type: ${type === 'brand' ? 'Brand Name (find alternatives)' : 'Generic Name (find brands)'}
    
    Provide: Brand Name, Generic Name, Company Name, and Approximate Price in BDT.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              brandName: { type: Type.STRING },
              genericName: { type: Type.STRING },
              company: { type: Type.STRING },
              price: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    return [];
  }
};

export const getMedicineDetails = async (medicineName: string) => {
  const prompt = `
    Provide a detailed guide for "${medicineName}" in Bengali.
    Include uses, dosage overview, side effects, and warnings.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "তথ্য পাওয়া যায়নি।";
  }
};
