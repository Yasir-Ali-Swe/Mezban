/**
 * Formats AI responses for Telegram.
 *
 * The AI agents should preferably return Telegram HTML.
 * This formatter:
 *
 * 1. Removes unwanted AI introductions.
 * 2. Preserves valid Telegram HTML.
 * 3. Converts Markdown only when the AI accidentally returns Markdown.
 * 4. Removes unsupported HTML.
 * 5. Cleans whitespace.
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
    return "";
  }

  let cleaned = text.trim();

  // ============================================================
  // 1. REMOVE MARKDOWN CODE FENCES
  // ============================================================

  cleaned = cleaned.replace(/^```(?:html|markdown|text)?\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");

  // ============================================================
  // 2. REMOVE UNNECESSARY AI INTRODUCTIONS
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
  // 4. DETERMINE WHETHER RESPONSE ALREADY CONTAINS HTML
  // ============================================================

  const containsTelegramHtml =
    /<\/?(b|strong|i|em|u|s|strike|del|ins|code|pre|a|blockquote)(?:\s[^>]*)?>/i.test(
      cleaned
    );

  /*
   * IMPORTANT:
   *
   * If the AI already returned Telegram HTML,
   * DO NOT run Markdown conversion.
   *
   * This prevents:
   *
   * ___HTML_BLOCK_0___
   *
   * from being interpreted as Markdown.
   */

  if (!containsTelegramHtml) {
    cleaned = convertMarkdownToTelegramHtml(cleaned);
  }

  // ============================================================
  // 5. SANITIZE TELEGRAM HTML
  // ============================================================

  cleaned = sanitizeTelegramHtml(cleaned);

  // ============================================================
  // 6. CLEAN WHITESPACE
  // ============================================================

  cleaned = cleaned
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned;
}

// ============================================================
// MARKDOWN → TELEGRAM HTML
// ============================================================

function convertMarkdownToTelegramHtml(text) {
  let result = text;

  // ------------------------------------------------------------
  // Markdown headings
  // ------------------------------------------------------------

  result = result.replace(
    /^#{1,6}\s+(.+)$/gm,
    "<b>$1</b>"
  );

  // ------------------------------------------------------------
  // Bold
  // ------------------------------------------------------------

  result = result.replace(
    /\*\*(.+?)\*\*/gs,
    "<b>$1</b>"
  );

  result = result.replace(
    /__(.+?)__/gs,
    "<b>$1</b>"
  );

  // ------------------------------------------------------------
  // Italic
  // ------------------------------------------------------------

  result = result.replace(
    /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
    "<i>$1</i>"
  );

  result = result.replace(
    /(?<!\w)_([^_\n]+)_(?!\w)/g,
    "<i>$1</i>"
  );

  // ------------------------------------------------------------
  // Strikethrough
  // ------------------------------------------------------------

  result = result.replace(
    /~~(.+?)~~/gs,
    "<s>$1</s>"
  );

  // ------------------------------------------------------------
  // Markdown links
  // ------------------------------------------------------------

  result = result.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2">$1</a>'
  );

  // ------------------------------------------------------------
  // Bullet lists
  // ------------------------------------------------------------

  result = result.replace(
    /^\s*[-*+]\s+(.+)$/gm,
    "• $1"
  );

  // ------------------------------------------------------------
  // Numbered lists
  // ------------------------------------------------------------

  result = result.replace(
    /^\s*\d+\.\s+(.+)$/gm,
    "• $1"
  );

  return result;
}

// ============================================================
// TELEGRAM HTML SANITIZER
// ============================================================

function sanitizeTelegramHtml(text) {
  let result = text;

  // ------------------------------------------------------------
  // Convert unsupported block tags
  // ------------------------------------------------------------

  result = result.replace(
    /<\/(p|div)>/gi,
    "\n"
  );

  result = result.replace(
    /<(p|div)[^>]*>/gi,
    ""
  );

  // ------------------------------------------------------------
  // Line breaks
  // ------------------------------------------------------------

  result = result.replace(
    /<br\s*\/?>/gi,
    "\n"
  );

  // ------------------------------------------------------------
  // Lists
  // ------------------------------------------------------------

  result = result.replace(
    /<li[^>]*>/gi,
    "• "
  );

  result = result.replace(
    /<\/li>/gi,
    "\n"
  );

  result = result.replace(
    /<\/?(ul|ol)[^>]*>/gi,
    ""
  );

  // ------------------------------------------------------------
  // Remove unsupported headings
  // ------------------------------------------------------------

  result = result.replace(
    /<\/?h[1-6][^>]*>/gi,
    ""
  );

  // ------------------------------------------------------------
  // Protect valid Telegram HTML
  // ------------------------------------------------------------

  const protectedTags = [];

  const telegramTagRegex =
    /<\/?(b|strong|i|em|u|s|strike|del|ins|code|pre|blockquote)(?:\s[^>]*)?>/gi;

  result = result.replace(
    telegramTagRegex,
    (match) => {
      const token = `@@@TG_TAG_${protectedTags.length}@@@`;

      protectedTags.push(match);

      return token;
    }
  );

  // ------------------------------------------------------------
  // Protect Telegram links
  // ------------------------------------------------------------

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

  // ------------------------------------------------------------
  // Remove any remaining unsupported HTML
  // ------------------------------------------------------------

  result = result.replace(
    /<[^>]+>/g,
    ""
  );

  // ------------------------------------------------------------
  // Restore Telegram tags
  // ------------------------------------------------------------

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
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function escapeHtmlAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}