"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const defaultComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => <h1 className="text-lg font-bold mt-3 mb-1 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-1 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1 first:mt-0">{children}</h3>,
  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="ml-2">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline hover:opacity-80"
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <pre className="my-2 p-3 rounded-lg bg-muted overflow-x-auto text-xs">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      );
    }
    return (
      <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-muted-foreground/30 pl-3 my-2 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="min-w-full border-collapse border border-border rounded-lg text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-border px-3 py-1.5 text-left font-medium">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-3 py-1.5">{children}</td>
  ),
  tr: ({ children }) => <tr>{children}</tr>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  hr: () => <hr className="my-2 border-border" />,
};

interface MarkdownContentProps {
  content: string;
  className?: string;
  components?: Components;
}

export function MarkdownContent({
  content,
  className = "",
  components,
}: MarkdownContentProps) {
  return (
    <div className={`markdown-content text-sm ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components ?? defaultComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
