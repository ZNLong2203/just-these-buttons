// Server-side only: reads GEMINI_API_KEY. Imported by the API route and the
// probe scripts, never by a client component.
import { GoogleGenAI, PartMediaResolutionLevel, ThinkingLevel, createPartFromBase64 } from "@google/genai";
import { languageName, type CardLanguage } from "./languages";
import { buildPrompt } from "./prompt";
import { ModelOutputSchema, jsonSchemaFor, normalise, type ModelOutput } from "./schema";
import type { FindButtonsResult } from "./types";

export const DEFAULT_MODEL = "gemini-3.8-flash";
const TIMEOUT_MS = 25_000;

function thinkingLevel(): ThinkingLevel {
  const wanted = process.env.GEMINI_THINKING?.toUpperCase();
  return wanted && wanted in ThinkingLevel ? ThinkingLevel[wanted as keyof typeof ThinkingLevel] : ThinkingLevel.LOW;
}

let client: GoogleGenAI | undefined;
function ai(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

export type FindButtonsInput = {
  imageBase64: string;
  mimeType: string;
  task: string;
  language?: CardLanguage;
  model?: string;
};

export type FindButtonsOutput = {
  result: FindButtonsResult;
  /** The model's reply before normalising; the probe reports it. */
  raw: ModelOutput;
  model: string;
  ms: number;
};

export async function findButtons(input: FindButtonsInput): Promise<FindButtonsOutput> {
  const model = input.model || process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const started = Date.now();

  const response = await ai().models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          // Small buttons need detail; high resolution costs more tokens but
          // stays well under a cent per photo.
          createPartFromBase64(
            input.imageBase64,
            input.mimeType,
            PartMediaResolutionLevel.MEDIA_RESOLUTION_HIGH,
          ),
          { text: buildPrompt(input.task, languageName(input.language ?? "en")) },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: jsonSchemaFor(ModelOutputSchema),
      // Google's detection guidance: spatial answers are better with thinking
      // turned down, and it is faster. 3.8 Flash rejects MINIMAL; LOW is its floor.
      thinkingConfig: { thinkingLevel: thinkingLevel() },
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini returned an empty response");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Gemini returned non-JSON output: ${text.slice(0, 200)}`);
  }
  const raw = ModelOutputSchema.parse(parsed);
  return { result: normalise(raw), raw, model, ms: Date.now() - started };
}
