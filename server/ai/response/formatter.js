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
  // 2. REMOVE MARKDOWN FORMATTING
  // ============================================================

  cleaned = removeMarkdown(cleaned);

  // ============================================================
  // 3. REMOVE UNNECESSARY AI INTRODUCTIONS
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
  // 4. REMOVE "AT RESTAURANT" INTRODUCTIONS
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
  // 5. SANITIZE TELEGRAM HTML
  // ============================================================

  cleaned = sanitizeTelegramHtml(cleaned);

  // ============================================================
  // 6. BALANCE HTML TAGS
  // ============================================================

  cleaned = balanceTelegramHtml(cleaned);

  // ============================================================
  // 7. CLEAN WHITESPACE
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

// ============================================================
// FALLBACK
// ============================================================

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
// REMOVE MARKDOWN
// ============================================================

function removeMarkdown(text) {
  let result = text;

  // Code fences
  result = result.replace(/```[\s\S]*?```/g, "");

  // Markdown headings
  result = result.replace(/^#{1,6}\s+/gm, "");

  // Markdown bold
  result = result.replace(/\*\*(.*?)\*\*/gs, "$1");

  // Markdown italic
  result = result.replace(/(?<!\*)\*(?!\s)(.*?)(?<!\s)\*(?!\*)/gs, "$1");

  // Markdown underline-like formatting
  result = result.replace(/__(.*?)__/gs, "$1");

  // Markdown strikethrough
  result = result.replace(/~~(.*?)~~/gs, "$1");

  // Markdown links
  result = result.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2">$1</a>'
  );

  return result;
}

// ============================================================
// TELEGRAM HTML SANITIZER
// ============================================================

function sanitizeTelegramHtml(text) {
  let result = text;

  // ----------------------------------------------------------
  // Convert unsupported block tags to line breaks
  // ----------------------------------------------------------

  result = result.replace(/<\/(p|div)>/gi, "\n");
  result = result.replace(/<(p|div)[^>]*>/gi, "");

  // ----------------------------------------------------------
  // Convert line breaks
  // ----------------------------------------------------------

  result = result.replace(/<br\s*\/?>/gi, "\n");

  // ----------------------------------------------------------
  // Convert list items
  // ----------------------------------------------------------

  result = result.replace(/<li[^>]*>/gi, "• ");
  result = result.replace(/<\/li>/gi, "\n");

  result = result.replace(/<\/?(ul|ol)[^>]*>/gi, "");

  // ----------------------------------------------------------
  // Remove headings
  // ----------------------------------------------------------

  result = result.replace(/<\/?h[1-6][^>]*>/gi, "");

  // ----------------------------------------------------------
  // Allowed Telegram tags
  // ----------------------------------------------------------

  const protectedTags = [];

  const telegramTagRegex =
    /<\/?(b|strong|i|em|u|s|strike|del|ins|code|pre|blockquote)(?:\s[^>]*)?>/gi;

  result = result.replace(telegramTagRegex, (match) => {
    const token = `@@@TG_TAG_${protectedTags.length}@@@`;

    protectedTags.push(match);

    return token;
  });

  // ----------------------------------------------------------
  // Protect Telegram links
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // Remove every remaining unsupported HTML tag
  // ----------------------------------------------------------

  result = result.replace(/<[^>]+>/g, "");

  // ----------------------------------------------------------
  // Restore Telegram tags
  // ----------------------------------------------------------

  result = result.replace(
    /@@@TG_TAG_(\d+)@@@/g,
    (_, index) => protectedTags[Number(index)] || ""
  );

  return result;
}

// ============================================================
// BALANCE TELEGRAM HTML
// ============================================================

function balanceTelegramHtml(text) {
  const allowedTags = [
    "b",
    "strong",
    "i",
    "em",
    "u",
    "s",
    "strike",
    "del",
    "ins",
    "code",
    "pre",
    "blockquote",
  ];

  const tagRegex = /<\/?(b|strong|i|em|u|s|strike|del|ins|code|pre|blockquote)(?:\s[^>]*)?>/gi;

  const stack = [];

  let result = "";
  let lastIndex = 0;

  for (const match of text.matchAll(tagRegex)) {
    const tag = match[0];
    const tagName = match[1].toLowerCase();

    result += text.slice(lastIndex, match.index);

    const isClosingTag = tag.startsWith("</");

    if (!allowedTags.includes(tagName)) {
      lastIndex = match.index + tag.length;
      continue;
    }

    if (isClosingTag) {
      const position = findLastTag(stack, tagName);

      if (position !== -1) {
        // Close nested tags first if necessary.
        for (let i = stack.length - 1; i >= position; i--) {
          const openTag = stack.pop();

          if (openTag !== tagName) {
            result += `</${openTag}>`;
          }
        }
      }

      // The requested closing tag.
      result += `</${tagName}>`;
    } else {
      result += tag;
      stack.push(tagName);
    }

    lastIndex = match.index + tag.length;
  }

  result += text.slice(lastIndex);

  // Close any remaining open tags.
  while (stack.length > 0) {
    const tagName = stack.pop();
    result += `</${tagName}>`;
  }

  return result;
}

function findLastTag(stack, tagName) {
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i] === tagName) {
      return i;
    }
  }

  return -1;
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
