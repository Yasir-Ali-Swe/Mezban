/**
 * Send Telegram message using Telegram HTML formatting.
 */
export async function sendTelegramMessage(
  botToken,
  chatId,
  text,
  options = {}
) {
  if (!botToken || !chatId) {
    throw new Error(
      "botToken and chatId are required for sending Telegram messages"
    );
  }

  // Fallback text if empty/null text is passed
  let messageText = typeof text === "string" ? text.trim() : "";
  if (!messageText) {
    messageText = `<b>How can I help?</b>\n\nI can help you with:\n\n• 🍽️ Menu\n• 🚚 Delivery\n• 🕐 Opening hours\n• 🪑 Reservations\n• 🛒 Orders`;
  }

  const parseMode =
    options.parseMode !== undefined ? options.parseMode : "HTML";

  try {
    const payload = {
      chat_id: chatId,
      text: messageText,
      disable_web_page_preview: true,
    };

    if (parseMode) {
      payload.parse_mode = parseMode;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (data.ok) {
      return data;
    }

    console.error("[Telegram Sender Error]", {
      errorCode: data.error_code,
      description: data.description,
      chatId,
      textLength: messageText.length,
    });

    // Check if error is related to HTML formatting/entity parsing
    const descriptionLower = (data.description || "").toLowerCase();
    const isFormattingError =
      descriptionLower.includes("can't parse entities") ||
      descriptionLower.includes("can't find end of the entity") ||
      descriptionLower.includes("unsupported start tag") ||
      (data.error_code === 400 && descriptionLower.includes("entity"));

    if (isFormattingError) {
      console.warn(
        "[Telegram Sender] HTML formatting failed. Retrying as plain text."
      );

      const plainText = stripTelegramHtml(messageText);

      const fallbackResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: plainText,
            disable_web_page_preview: true,
          }),
        }
      );

      return await fallbackResponse.json();
    }

    return data;
  } catch (error) {
    console.error("[Telegram Sender Exception]", error.message);
    return null;
  }
}

export function stripTelegramHtml(text) {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    // Convert line breaks
    .replace(/<br\s*\/?>/gi, "\n")

    // Preserve list structure
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/?(ul|ol)[^>]*>/gi, "")

    // Preserve blockquotes
    .replace(/<blockquote[^>]*>/gi, "> ")
    .replace(/<\/blockquote>/gi, "\n")

    // Preserve paragraph/heading spacing
    .replace(/<\/(p|div|h[1-6])>/gi, "\n")
    .replace(/<(p|div|h[1-6])[^>]*>/gi, "")

    // Preserve visible link text
    .replace(/<a[^>]*>(.*?)<\/a>/gi, "$1")

    // Remove Telegram formatting tags
    .replace(
      /<\/?(b|strong|i|em|u|s|strike|del|ins|code|pre|tg-spoiler)>/gi,
      ""
    )

    // Remove media tags
    .replace(/<img[^>]*>/gi, "")
    .replace(/<video[^>]*>.*?<\/video>/gis, "")
    .replace(/<audio[^>]*>.*?<\/audio>/gis, "")

    // Remove any remaining HTML
    .replace(/<[^>]+>/g, "")

    // Decode common entities
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")

    // Clean whitespace
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}