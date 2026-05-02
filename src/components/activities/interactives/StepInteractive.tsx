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
import {
  VitraInfographic,
  type VitraInfographicData,
} from "./VitraInfographic";
import {
  PrincipledInnovationInfographic,
  type PrincipledInnovationInfographicData,
} from "./PrincipledInnovationInfographic";
import {
  ShortlistTable,
  type ShortlistTableData,
} from "./ShortlistTable";
import {
  HighlighterWorkspace,
  type HighlighterWorkspaceData,
} from "./HighlighterWorkspace";
import {
  StageFlowchart,
  type StageFlowchartData,
} from "./StageFlowchart";
import {
  DownloadableAsset,
  type DownloadableAssetData,
} from "./DownloadableAsset";
import { Scorecard, type ScorecardData } from "./Scorecard";

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
    case "vitra_infographic":
      return <VitraInfographic data={data as VitraInfographicData} />;
    case "principled_innovation_infographic":
      return (
        <PrincipledInnovationInfographic
          data={data as PrincipledInnovationInfographicData}
        />
      );
    case "shortlist_table":
      return <ShortlistTable data={data as ShortlistTableData} />;
    case "highlighter_workspace":
      return (
        <HighlighterWorkspace data={data as HighlighterWorkspaceData} />
      );
    case "stage_flowchart":
      return <StageFlowchart data={data as StageFlowchartData} />;
    case "downloadable_asset":
      return <DownloadableAsset data={data as DownloadableAssetData} />;
    case "scorecard":
      return <Scorecard data={data as ScorecardData} />;
    default:
      return null;
  }
}
