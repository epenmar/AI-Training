"use client";

import { VocabFlipCards, type VocabFlipCardsData } from "./VocabFlipCards";
import { SortBuckets, type SortBucketsData } from "./SortBuckets";
import { PromptSandbox, type PromptSandboxData } from "./PromptSandbox";
import { SequenceOrder, type SequenceOrderData } from "./SequenceOrder";
import { ClaimQuiz, type ClaimQuizData } from "./ClaimQuiz";

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
    default:
      return null;
  }
}
