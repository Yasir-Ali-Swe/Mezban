/**
 * Send Telegram message using Telegram HTML formatting.
 */
export async function sendTelegramMessage(
  botToken,
  chatId,
  text,
  options = {}
) {
  if (!botToken || !chatId || !text) {
    throw new Error(
      "botToken, chatId, and text are required for sending Telegram messages"
    );
  }

  const parseMode =
    options.parseMode !== undefined
      ? options.parseMode
      : "HTML";

  try {
    const payload = {
      chat_id: chatId,
      text,
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

    console.error(
      "[Telegram Sender Error]",
      {
        description: data.description,
        errorCode: data.error_code,
        chatId,
      }
    );
    // Retry without formatting if Telegram rejects HTML.
    const formattingError =
      data.description?.includes("can't parse entities") ||
      data.description?.includes("can't find end of the entity") ||
      data.description?.includes("Unsupported start tag");

    if (formattingError) {
      console.warn(
        "[Telegram Sender] HTML formatting failed. Retrying as plain text."
      );

      const fallbackResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: stripTelegramHtml(text),
            disable_web_page_preview: true,
          }),
        }
      );

      return await fallbackResponse.json();
    }

    return data;

  } catch (error) {
    console.error(
      "[Telegram Sender Exception]",
      error.message
    );

    return null;
  }
}

function stripTelegramHtml(text) {
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