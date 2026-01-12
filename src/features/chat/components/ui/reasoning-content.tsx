"use client";

import { BrainIcon, Loader2 } from "lucide-react";
import { useMemo } from "react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { cn } from "~/lib/utils";

type ReasoningSection = {
  heading: string | null;
  content: string;
};

function parseReasoningContent(content: string): ReasoningSection[] {
  const sections: ReasoningSection[] = [];
  const lines = content.split("\n");

  let currentHeading: string | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^\*\*(.+?)\*\*\s*$/);

    if (headingMatch) {
      if (currentHeading !== null || currentContent.length > 0) {
        sections.push({
          heading: currentHeading,
          content: currentContent.join("\n").trim(),
        });
      }
      currentHeading = headingMatch[1];
      currentContent = [];
    }
    else {
      currentContent.push(line);
    }
  }

  if (currentHeading !== null || currentContent.length > 0) {
    sections.push({
      heading: currentHeading,
      content: currentContent.join("\n").trim(),
    });
  }

  return sections;
}

function ReasoningTimeline({ sections }: { sections: ReasoningSection[] }) {
  return (
    <div className="flex flex-col">
      {sections.map((section, index) => (
        <div key={index} className="flex flex-row">
          <div className={cn("flex flex-col items-center mr-3 -mb-3", index === sections.length - 1 && "mb-0")}>
            {section.heading && (
              <div className="bg-muted mt-2 h-2 w-2 shrink-0 rounded-full" />
            )}
            {(section.content || index < sections.length - 1) && (
              <div className={cn(
                "bg-border w-px flex-1",
                !section.heading && "mt-0",
              )}
              />
            )}
          </div>
          <div className={cn("flex-1 pb-3", index === sections.length - 1 && "pb-0")}>
            {section.heading && (
              <p className="text-foreground text-sm font-medium mb-1">
                {section.heading}
              </p>
            )}
            {section.content && (
              <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                {section.content}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReasoningContent({ content, isThinking }: { content: string; isThinking?: boolean }) {
  const sections = useMemo(() => parseReasoningContent(content || ""), [content]);

  if (!content && !isThinking)
    return null;

  const hasStructuredContent = sections.some(s => s.heading !== null);

  return (
    <div className="mt-2 flex w-full flex-1 text-xs">
      <Accordion type="single" collapsible className="w-full flex-1">
        <AccordionItem value="reasoning" className="border-b-0">
          <AccordionTrigger className={`
            flex flex-row items-center justify-start gap-2 pt-0 pb-1
          `}
          >
            {isThinking
              ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )
              : (
                  <BrainIcon className="h-4 w-4" />
                )}
            <span className="font-medium">
              {isThinking ? "Thinking..." : "Reasoning"}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className={cn(
              "bg-card border-muted rounded-md border p-3 text-sm",
              !hasStructuredContent && "whitespace-pre-wrap",
            )}
            >
              {!content
                ? "Processing..."
                : hasStructuredContent
                  ? <ReasoningTimeline sections={sections} />
                  : content}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
