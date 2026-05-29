export function normalizePhoneNumber(phone: string): string {
  // Remove (0), spaces, dashes, parentheses
  const clean = phone.replace(/\(0\)/g, "").replace(/[\s\-().]/g, "");
  
  // Extract last part after '+' to resolve double-prefixing (e.g., +233+233509627738 -> 233509627738)
  let last = clean.split('+').pop() || '';
  
  // Convert local format (e.g., 0509627738) to international
  if (last.startsWith('0')) {
    last = '233' + last.slice(1);
  }
  
  return '+' + last;
}

export async function sendWhatsAppMessage(phoneNumber: string, messageText: string) {
  const normalized = normalizePhoneNumber(phoneNumber);
  const serviceUrl = process.env.WHATSAPP_SERVICE_URL || "http://localhost:8081";
  const apiKey = process.env.WHATSAPP_API_KEY || "development-key";

  try {
    const response = await fetch(`${serviceUrl}/api/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone_number: normalized,
        message_text: messageText,
        api_key: apiKey,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to send WhatsApp message: ${errorData.error}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("WhatsApp Service Error:", error);
    throw error;
  }
}
