"use client";

import { useMemo } from "react";

interface EmailBodyRendererProps {
  htmlBody?: string | null;
  plainBody: string;
}

function sanitizeMailHtmlContent(rawHtml: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, "text/html");

    doc.querySelectorAll("script, iframe, object, embed, form, meta, link").forEach((node) => {
      node.remove();
    });

    doc.querySelectorAll("*").forEach((node) => {
      for (const attr of Array.from(node.attributes)) {
        const attrName = attr.name.toLowerCase();
        const attrValue = attr.value.toLowerCase();

        if (attrName.startsWith("on")) {
          node.removeAttribute(attr.name);
          continue;
        }

        if (
          (attrName === "href" || attrName === "src") &&
          attrValue.startsWith("javascript:")
        ) {
          node.removeAttribute(attr.name);
        }
      }
    });

    doc.querySelectorAll("a").forEach((anchor) => {
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
    });

    return doc.body.innerHTML;
  } catch (error) {
    console.error("Error in sanitizeMailHtmlContent:", error);
    return "";
  }
}

export function EmailBodyRenderer({ htmlBody, plainBody }: EmailBodyRendererProps) {
  const sanitizedHtml = useMemo(() => {
    if (!htmlBody) {
      return "";
    }
    return sanitizeMailHtmlContent(htmlBody);
  }, [htmlBody]);

  if (sanitizedHtml) {
    return (
      <article
        className="mail-rendered-content"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }

  return <p className="whitespace-pre-line text-sm leading-7 text-zinc-700 dark:text-zinc-300">{plainBody}</p>;
}
