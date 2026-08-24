/**
 * Formats AI responses for Telegram.
 *
 * The AI agents output Telegram HTML directly.
 * This formatter:
 * 1. Removes unwanted AI prefix introductions.
 * 2. Removes Markdown code fences.
 * 3. Sanitizes unsupported HTML tags to protect Telegram parsing.
 * 4. Normalizes whitespace.
 * 5. Returns a safe fallback if response is empty.
 */

export function formatAiResponse(
  text,
  {
    customerName,
    restaurantName,
    isGreeting = false,
  } = {}
) {
  if (!text || typeof text !== "string") {
    return getFallbackResponse();
  }

  let cleaned = text.trim();

  if (!cleaned) {
    return getFallbackResponse();
  }

  // ============================================================
  // 1. REMOVE MARKDOWN CODE FENCES
  // ============================================================

  cleaned = cleaned.replace(/^```(?:html|text)?\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");

  // ============================================================
  // 2. REMOVE UNNECESSARY AI INTRODUCTIONS (Non-greetings only)
  // ============================================================

  if (!isGreeting) {
    if (customerName) {
      const escapedName = escapeRegex(customerName);

      cleaned = cleaned.replace(
        new RegExp(
          `^(hello|hi|hey|greetings|certainly|sure|of course|absolutely|no problem)[,!\\s]+${escapedName}[!.,\\s:;-]*`,
          "i"
        ),
        ""
      );
    }

    cleaned = cleaned.replace(
      /^(certainly|sure|of course|absolutely|no problem)[!.,\s:;-]+/i,
      ""
    );

    cleaned = cleaned.replace(
      /^(hello|hi|hey)[!.,\s:;-]+/i,
      ""
    );
  }

  // ============================================================
  // 3. REMOVE "AT RESTAURANT" INTRODUCTIONS
  // ============================================================

  if (restaurantName) {
    const escapedRestaurantName = escapeRegex(restaurantName);

    cleaned = cleaned.replace(
      new RegExp(
        `^at\\s+${escapedRestaurantName}[,\\s!:\\-]+`,
        "i"
      ),
      ""
    );

    cleaned = cleaned.replace(
      /^at\s+our\s+restaurant[,\\s!:\\-]+/i,
      ""
    );
  }

  // ============================================================
  // 4. SANITIZE TELEGRAM HTML
  // ============================================================

  cleaned = sanitizeTelegramHtml(cleaned);

  // ============================================================
  // 5. CLEAN WHITESPACE
  // ============================================================

  cleaned = cleaned
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleaned) {
    return getFallbackResponse();
  }

  return cleaned;
}

function getFallbackResponse() {
  return `<b>How can I help?</b>

I can help you with:

• 🍽️ Menu
• 🚚 Delivery
• 🕐 Opening hours
• 🪑 Reservations
• 🛒 Orders`;
}

// ============================================================
// TELEGRAM HTML SANITIZER
// ============================================================

function sanitizeTelegramHtml(text) {
  let result = text;

  // Convert unsupported block tags to line breaks
  result = result.replace(/<\/(p|div)>/gi, "\n");
  result = result.replace(/<(p|div)[^>]*>/gi, "");

  // Convert line breaks
  result = result.replace(/<br\s*\/?>/gi, "\n");

  // Format list items
  result = result.replace(/<li[^>]*>/gi, "• ");
  result = result.replace(/<\/li>/gi, "\n");
  result = result.replace(/<\/?(ul|ol)[^>]*>/gi, "");

  // Remove unsupported headings
  result = result.replace(/<\/?h[1-6][^>]*>/gi, "");

  // Protect valid Telegram HTML tags
  const protectedTags = [];
  const telegramTagRegex =
    /<\/?(b|strong|i|em|u|s|strike|del|ins|code|pre|blockquote)(?:\s[^>]*)?>/gi;

  result = result.replace(telegramTagRegex, (match) => {
    const token = `@@@TG_TAG_${protectedTags.length}@@@`;
    protectedTags.push(match);
    return token;
  });

  // Protect Telegram links
  result = result.replace(
    /<a\s+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis,
    (_, url, label) => {
      const token = `@@@TG_TAG_${protectedTags.length}@@@`;
      protectedTags.push(
        `<a href="${escapeHtmlAttribute(url)}">${label}</a>`
      );
      return token;
    }
  );

  // Remove any remaining unsupported HTML
  result = result.replace(/<[^>]+>/g, "");

  // Restore Telegram tags
  result = result.replace(
    /@@@TG_TAG_(\d+)@@@/g,
    (_, index) => protectedTags[Number(index)] || ""
  );

  return result;
}

// ============================================================
// HELPERS
// ============================================================

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtmlAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}