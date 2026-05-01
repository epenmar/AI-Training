"use client";

import { VocabFlipCards, type VocabFlipCardsData } from "./VocabFlipCards";
import { SortBuckets, type SortBucketsData } from "./SortBuckets";
import { PromptSandbox, type PromptSandboxData } from "./PromptSandbox";
import { SequenceOrder, type SequenceOrderData } from "./SequenceOrder";
import { ClaimQuiz, type ClaimQuizData } from "./ClaimQuiz";
import { TextListEntry, type TextListEntryData } from "./TextListEntry";
import {
  CitationTracker,
  type CitationTrackerData,
} from "./CitationTracker";
import {
  ComparisonTable,
  type ComparisonTableData,
} from "./ComparisonTable";

export function StepInteractive({
  type,
  data,
}: {
  type: string;
  data: unknown;
}) {
  switch (type) {
    case "vocab_flip_cards":
      return <VocabFlipCards data={data as VocabFlipCardsData} />;
    case "sort_buckets":
      return <SortBuckets data={data as SortBucketsData} />;
    case "prompt_sandbox":
      return <PromptSandbox data={data as PromptSandboxData} />;
    case "sequence_order":
      return <SequenceOrder data={data as SequenceOrderData} />;
    case "claim_quiz":
      return <ClaimQuiz data={data as ClaimQuizData} />;
    case "text_list_entry":
      return <TextListEntry data={data as TextListEntryData} />;
    case "citation_tracker":
      return <CitationTracker data={data as CitationTrackerData} />;
    case "comparison_table":
      return <ComparisonTable data={data as ComparisonTableData} />;
    default:
      return null;
  }
}
