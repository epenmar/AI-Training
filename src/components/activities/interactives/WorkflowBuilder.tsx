"use client";

import { useEffect, useRef, useState } from "react";
import { AutoTextarea } from "./AutoTextarea";

// In-page agent / workflow design tool. Captures Goal + a vertical
// chain of Nodes (Trigger / Step / Decision / Human checkpoint / End)
// + Tools + Risks. Each node has an actor marker (Me / AI / Either)
// and a description; nodes can be reordered or deleted. Designed to
// pin to the right side of an activity page so the design persists
// while the learner reads through guidance steps.
export type WorkflowBuilderData = {
  storageKey: string;
  prompt?: string;
};

type NodeType =
  | "trigger"
  | "step"
  | "decision"
  | "checkpoint"
  | "end";
type Actor = "me" | "ai" | "either";

type Node = {
  id: string;
  type: NodeType;
  actor: Actor;
  text: string;
};

type Stored = {
  goal: string;
  nodes: Node[];
  tools: string;
  risks: string;
};

const NODE_TYPE_META: Record<
  NodeType,
  { label: string; bg: string; border: string; chip: string }
> = {
  trigger: {
    label: "Trigger",
    bg: "bg-asu-orange/10",
    border: "border-asu-orange/40",
    chip: "bg-asu-orange/20 text-orange-900",
  },
  step: {
    label: "Step",
    bg: "bg-asu-blue/5",
    border: "border-asu-blue/30",
    chip: "bg-asu-blue/15 text-asu-blue",
  },
  decision: {
    label: "Decision",
    bg: "bg-asu-gold/10",
    border: "border-asu-gold/50",
    chip: "bg-asu-gold/25 text-yellow-900",
  },
  checkpoint: {
    label: "Human checkpoint",
    bg: "bg-asu-maroon/5",
    border: "border-asu-maroon/40",
    chip: "bg-asu-maroon/15 text-asu-maroon",
  },
  end: {
    label: "End",
    bg: "bg-gray-100",
    border: "border-gray-300",
    chip: "bg-gray-200 text-gray-700",
  },
};

const ACTOR_META: Record<Actor, { label: string; chip: string }> = {
  me: { label: "Me", chip: "bg-asu-maroon text-white" },
  ai: { label: "AI", chip: "bg-asu-blue text-white" },
  either: { label: "Either", chip: "bg-gray-500 text-white" },
};

const SYNC_EVENT = "workflow-builder:storage-update";

function makeId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function defaultStored(): Stored {
  return { goal: "", nodes: [], tools: "", risks: "" };
}

function readStorage(key: string): Stored {
  if (typeof window === "undefined") return defaultStored();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultStored();
    const p = JSON.parse(raw) as Partial<Stored>;
    return {
      goal: typeof p.goal === "string" ? p.goal : "",
      nodes: Array.isArray(p.nodes)
        ? (p.nodes as Node[]).filter(
            (n) =>
              n &&
              typeof n.id === "string" &&
              typeof n.text === "string" &&
              n.type in NODE_TYPE_META &&
              n.actor in ACTOR_META
          )
        : [],
      tools: typeof p.tools === "string" ? p.tools : "",
      risks: typeof p.risks === "string" ? p.risks : "",
    };
  } catch {
    return defaultStored();
  }
}

function writeStorage(key: string, value: Stored) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key } }));
  } catch {
    // ignore
  }
}

export function WorkflowBuilder({ data }: { data: WorkflowBuilderData }) {
  const [state, setState] = useState<Stored>(defaultStored);
  const [hydrated, setHydrated] = useState(false);
  const lastWritten = useRef<string>("");

  useEffect(() => {
    setState(readStorage(data.storageKey));
    setHydrated(true);
  }, [data.storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    const ser = JSON.stringify(state);
    if (ser === lastWritten.current) return;
    lastWritten.current = ser;
    writeStorage(data.storageKey, state);
  }, [state, hydrated, data.storageKey]);

  // Cross-instance live sync (same pattern as the other persisted widgets).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onSync = (e: Event) => {
      const ce = e as CustomEvent<{ key: string }>;
      if (ce.detail?.key !== data.storageKey) return;
      const fresh = readStorage(data.storageKey);
      const ser = JSON.stringify(fresh);
      if (ser === lastWritten.current) return;
      lastWritten.current = ser;
      setState(fresh);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== data.storageKey) return;
      const fresh = readStorage(data.storageKey);
      const ser = JSON.stringify(fresh);
      if (ser === lastWritten.current) return;
      lastWritten.current = ser;
      setState(fresh);
    };
    window.addEventListener(SYNC_EVENT, onSync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SYNC_EVENT, onSync);
      window.removeEventListener("storage", onStorage);
    };
  }, [data.storageKey]);

  const setGoal = (val: string) =>
    setState((p) => ({ ...p, goal: val }));
  const setTools = (val: string) =>
    setState((p) => ({ ...p, tools: val }));
  const setRisks = (val: string) =>
    setState((p) => ({ ...p, risks: val }));

  const addNode = (type: NodeType) => {
    setState((p) => ({
      ...p,
      nodes: [...p.nodes, { id: makeId(), type, actor: "ai", text: "" }],
    }));
  };

  const updateNode = (id: string, patch: Partial<Node>) => {
    setState((p) => ({
      ...p,
      nodes: p.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }));
  };

  const deleteNode = (id: string) => {
    setState((p) => ({ ...p, nodes: p.nodes.filter((n) => n.id !== id) }));
  };

  const moveNode = (id: string, dir: -1 | 1) => {
    setState((p) => {
      const idx = p.nodes.findIndex((n) => n.id === id);
      if (idx < 0) return p;
      const target = idx + dir;
      if (target < 0 || target >= p.nodes.length) return p;
      const next = [...p.nodes];
      const [n] = next.splice(idx, 1);
      next.splice(target, 0, n);
      return { ...p, nodes: next };
    });
  };

  const addBtnClass =
    "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md border cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

  return (
    <div className="rounded-lg border border-asu-blue/25 bg-asu-blue/5 p-3 space-y-3">
      {data.prompt && (
        <p className="text-xs font-medium text-gray-700">{data.prompt}</p>
      )}

      {/* Goal */}
      <div>
        <label
          htmlFor={`${data.storageKey}-goal`}
          className="block text-[10px] font-bold uppercase tracking-wider text-asu-blue mb-1"
        >
          Goal
        </label>
        <input
          id={`${data.storageKey}-goal`}
          type="text"
          value={state.goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="One sentence: what does this agent achieve?"
          className="w-full text-sm bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:border-asu-blue focus:outline-none focus:ring-1 focus:ring-asu-blue"
        />
      </div>

      {/* Workflow chain */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-asu-blue mb-1">
          Workflow
        </p>
        {state.nodes.length === 0 ? (
          <p className="text-xs text-gray-500 italic px-2 py-2 border border-dashed border-gray-300 rounded-md">
            Empty. Add a Trigger to start.
          </p>
        ) : (
          <ol className="space-y-1.5" aria-label="Workflow nodes">
            {state.nodes.map((node, i) => {
              const meta = NODE_TYPE_META[node.type];
              return (
                <li key={node.id}>
                  <div
                    className={`rounded-md border ${meta.border} ${meta.bg} p-2 space-y-1.5`}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${meta.chip}`}
                      >
                        {meta.label}
                      </span>
                      <select
                        aria-label={`Actor for node ${i + 1}`}
                        value={node.actor}
                        onChange={(e) =>
                          updateNode(node.id, {
                            actor: e.target.value as Actor,
                          })
                        }
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border-0 ${ACTOR_META[node.actor].chip}`}
                      >
                        {(Object.keys(ACTOR_META) as Actor[]).map((a) => (
                          <option key={a} value={a}>
                            {ACTOR_META[a].label}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label={`Type for node ${i + 1}`}
                        value={node.type}
                        onChange={(e) =>
                          updateNode(node.id, {
                            type: e.target.value as NodeType,
                          })
                        }
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-gray-300 bg-white text-gray-700"
                      >
                        {(Object.keys(NODE_TYPE_META) as NodeType[]).map(
                          (t) => (
                            <option key={t} value={t}>
                              {NODE_TYPE_META[t].label}
                            </option>
                          )
                        )}
                      </select>
                      <div className="ml-auto flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveNode(node.id, -1)}
                          disabled={i === 0}
                          aria-label={`Move node ${i + 1} up`}
                          className="px-1.5 py-0.5 text-xs text-gray-600 hover:text-asu-blue disabled:opacity-30 cursor-pointer"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveNode(node.id, 1)}
                          disabled={i === state.nodes.length - 1}
                          aria-label={`Move node ${i + 1} down`}
                          className="px-1.5 py-0.5 text-xs text-gray-600 hover:text-asu-blue disabled:opacity-30 cursor-pointer"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteNode(node.id)}
                          aria-label={`Delete node ${i + 1}`}
                          className="px-1.5 py-0.5 text-xs text-gray-600 hover:text-red-600 cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <AutoTextarea
                      aria-label={`Description for ${meta.label} node ${i + 1}`}
                      value={node.text}
                      onChange={(e) =>
                        updateNode(node.id, { text: e.target.value })
                      }
                      placeholder="What happens here?"
                      className="text-sm bg-white border border-gray-200 rounded px-2 py-1 focus:border-asu-blue focus:outline-none focus:ring-1 focus:ring-asu-blue"
                    />
                  </div>
                  {i < state.nodes.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="text-center text-gray-400 leading-none py-0.5"
                    >
                      ↓
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => addNode("trigger")}
            className={`${addBtnClass} ${NODE_TYPE_META.trigger.chip} ${NODE_TYPE_META.trigger.border}`}
          >
            + Trigger
          </button>
          <button
            type="button"
            onClick={() => addNode("step")}
            className={`${addBtnClass} ${NODE_TYPE_META.step.chip} ${NODE_TYPE_META.step.border}`}
          >
            + Step
          </button>
          <button
            type="button"
            onClick={() => addNode("decision")}
            className={`${addBtnClass} ${NODE_TYPE_META.decision.chip} ${NODE_TYPE_META.decision.border}`}
          >
            + Decision
          </button>
          <button
            type="button"
            onClick={() => addNode("checkpoint")}
            className={`${addBtnClass} ${NODE_TYPE_META.checkpoint.chip} ${NODE_TYPE_META.checkpoint.border}`}
          >
            + Human checkpoint
          </button>
          <button
            type="button"
            onClick={() => addNode("end")}
            className={`${addBtnClass} ${NODE_TYPE_META.end.chip} ${NODE_TYPE_META.end.border}`}
          >
            + End
          </button>
        </div>
      </div>

      {/* Tools + Risks */}
      <div className="grid grid-cols-1 gap-2">
        <div>
          <label
            htmlFor={`${data.storageKey}-tools`}
            className="block text-[10px] font-bold uppercase tracking-wider text-asu-blue mb-1"
          >
            Tools / integrations
          </label>
          <AutoTextarea
            id={`${data.storageKey}-tools`}
            value={state.tools}
            onChange={(e) => setTools(e.target.value)}
            placeholder="What does the agent need access to? (Files, email, calendar, an API…)"
            className="text-sm bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:border-asu-blue focus:outline-none focus:ring-1 focus:ring-asu-blue"
          />
        </div>
        <div>
          <label
            htmlFor={`${data.storageKey}-risks`}
            className="block text-[10px] font-bold uppercase tracking-wider text-asu-blue mb-1"
          >
            Risks
          </label>
          <AutoTextarea
            id={`${data.storageKey}-risks`}
            value={state.risks}
            onChange={(e) => setRisks(e.target.value)}
            placeholder="What could go wrong? Where would a bad output cost you?"
            className="text-sm bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:border-asu-blue focus:outline-none focus:ring-1 focus:ring-asu-blue"
          />
        </div>
      </div>
      <p className="text-[10px] text-gray-500">Saved in your browser.</p>
    </div>
  );
}
