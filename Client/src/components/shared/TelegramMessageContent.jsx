'use client';

import React from 'react';

/**
 * Safe Telegram HTML Parser & Renderer
 * Converts Telegram HTML tags (<b>, <i>, <u>, <s>, <code>, <pre>, <blockquote>, <a>)
 * into safe React elements without using dangerous raw innerHTML.
 */
export function renderTelegramHtml(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  // Tokenize string by matching supported Telegram HTML tags
  const tagRegex = /<\/?(b|strong|i|em|u|s|strike|del|ins|code|pre|blockquote|a)(?:\s+href=["']([^"']*)["'])?[^>]*>/gi;

  const elements = [];
  let lastIndex = 0;
  let keyIndex = 0;

  // Active formatting stack
  const activeTags = [];

  let match;
  while ((match = tagRegex.exec(rawText)) !== null) {
    const textChunk = rawText.slice(lastIndex, match.index);
    if (textChunk) {
      elements.push(applyActiveFormatting(textChunk, activeTags, keyIndex++));
    }

    const fullTag = match[0];
    const tagName = match[1].toLowerCase();
    const href = match[2];
    const isClosing = fullTag.startsWith('</');

    if (!isClosing) {
      activeTags.push({ tag: tagName, href });
    } else {
      // Pop matching tag from stack
      const idx = activeTags.map((t) => t.tag).lastIndexOf(tagName);
      if (idx !== -1) {
        activeTags.splice(idx, 1);
      }
    }

    lastIndex = tagRegex.lastIndex;
  }

  const remainingText = rawText.slice(lastIndex);
  if (remainingText) {
    elements.push(applyActiveFormatting(remainingText, activeTags, keyIndex++));
  }

  return elements;
}

function applyActiveFormatting(text, activeTags, baseKey) {
  // Decode HTML entities
  const decoded = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  let wrapped = <React.Fragment key={`text-${baseKey}`}>{decoded}</React.Fragment>;

  for (let i = activeTags.length - 1; i >= 0; i--) {
    const { tag, href } = activeTags[i];
    const wrapKey = `wrap-${baseKey}-${i}`;

    switch (tag) {
      case 'b':
      case 'strong':
        wrapped = <strong key={wrapKey} className="font-semibold">{wrapped}</strong>;
        break;
      case 'i':
      case 'em':
        wrapped = <em key={wrapKey} className="italic">{wrapped}</em>;
        break;
      case 'u':
      case 'ins':
        wrapped = <u key={wrapKey}>{wrapped}</u>;
        break;
      case 's':
      case 'strike':
      case 'del':
        wrapped = <s key={wrapKey} className="line-through">{wrapped}</s>;
        break;
      case 'code':
        wrapped = (
          <code key={wrapKey} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground font-semibold">
            {wrapped}
          </code>
        );
        break;
      case 'pre':
        wrapped = (
          <pre key={wrapKey} className="bg-muted p-2 rounded text-xs font-mono my-1 overflow-x-auto whitespace-pre-wrap">
            {wrapped}
          </pre>
        );
        break;
      case 'blockquote':
        wrapped = (
          <blockquote key={wrapKey} className="border-l-2 border-primary/50 pl-2 my-1 italic text-muted-foreground">
            {wrapped}
          </blockquote>
        );
        break;
      case 'a':
        const isSafeHref = href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('tg://'));
        wrapped = (
          <a
            key={wrapKey}
            href={isSafeHref ? href : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:opacity-80"
          >
            {wrapped}
          </a>
        );
        break;
      default:
        break;
    }
  }

  return wrapped;
}

export const TelegramMessageContent = ({ content, className = '' }) => {
  if (!content) return null;
  return (
    <div className={`leading-relaxed whitespace-pre-wrap break-words ${className}`}>
      {renderTelegramHtml(content)}
    </div>
  );
};

export default TelegramMessageContent;
