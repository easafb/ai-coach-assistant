"use server";

// Tip tanımlamaları (Hataları önlemek için)
interface Exercise {
  name: string;
}

interface AIRequestPayload {
  userLevel: string;
  currentWorkout: Exercise[];
  userFeedback: string;
}

interface AIResponse {
  aiAdjustmentNote: string;
}

export const generateAdjustedWorkout = async (payload: AIRequestPayload): Promise<AIResponse> => {
  // 1. Veri Parçalama
  const { userLevel, currentWorkout, userFeedback } = payload;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { aiAdjustmentNote: "Sistem hatası: API anahtarı eksik." };
  }

  // Modeli gemini-2.5-flash-lite olarak güncelliyoruz:
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
  const requestBody = {
    contents: [{
      parts: [{
        text: `You are Coach.ai, a professional fitness assistant. 
               User Experience Level: ${userLevel}
               Current Workout Session: ${JSON.stringify(currentWorkout)}
               User Feedback: "${userFeedback}"
               
               Task: Based on the feedback and workout, provide exactly one sentence of professional fitness advice in English.
               Constraint: Return the response ONLY as a valid JSON object in this format: {"aiAdjustmentNote": "your_advice_here"}`
      }]
    }]
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // 3. Cache Koruması: Next.js'in eski hatalı yanıtları hatırlamasını engeller
      cache: "no-store", 
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log("GOOGLE STATUS KODU:", response.status);
    console.log("GOOGLE DETAYI:", JSON.stringify(data, null, 2));

    // 4. Detaylı Hata Yönetimi
    if (!response.ok) {
      // Sunucu yoğunluğu (503) veya çok fazla istek (429) durumları
      if (response.status === 503 || response.status === 429) {
        return { 
          aiAdjustmentNote: "Coach.ai is thinking deeply right now. Please wait 5 seconds and try again." 
        };
      }
      console.error("Google API Error:", data);
      throw new Error(data.error?.message || "Bağlantı hatası");
    }

    // 5. Yanıtı Temizleme ve Çözümleme
    const aiResponseText = data.candidates[0].content.parts[0].text;
    
    // Markdown işaretlerini (```json ... ```) temizle
    const cleanedJson = aiResponseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(cleanedJson) as AIResponse;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
    console.error("AI Service Error:", errorMessage);
    
    return {
      aiAdjustmentNote: "Coach.ai is temporarily calibrating. Please focus on your form and stay safe!"
    };
  }
};