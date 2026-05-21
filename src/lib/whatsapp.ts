export async function sendWhatsAppMessage(phoneNumber: string, messageText: string) {
  const serviceUrl = process.env.WHATSAPP_SERVICE_URL || "http://localhost:8081";
  const apiKey = process.env.WHATSAPP_API_KEY || "development-key";

  try {
    const response = await fetch(`${serviceUrl}/api/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
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
