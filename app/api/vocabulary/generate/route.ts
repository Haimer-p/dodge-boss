import { NextRequest, NextResponse } from "next/server";
import { geminiGenerateJson } from "@/lib/gemini";
import { VocabLevel, VocabWord } from "@/lib/vocabulary";
import { generateId } from "@/lib/utils";

interface GenerateBody {
  level?: VocabLevel;
  count?: number;
  exclude?: string[];
}

interface GeminiVocabResponse {
  words: Array<{
    word: string;
    phonetic?: string;
    partOfSpeech: string;
    definition: string;
    definitionVi: string;
    example: string;
    exampleVi: string;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateBody;
    const level = body.level ?? "intermediate";
    const count = Math.min(Math.max(body.count ?? 6, 3), 10);
    const exclude = (body.exclude ?? []).slice(0, 200);

    const excludeNote =
      exclude.length > 0
        ? `Do NOT include these words (already learned): ${exclude.join(", ")}.`
        : "";

    const prompt = `Generate exactly ${count} English vocabulary words for a ${level} learner.
${excludeNote}
Return JSON with this exact shape:
{
  "words": [
    {
      "word": "string",
      "phonetic": "IPA string optional",
      "partOfSpeech": "noun|verb|adjective|etc",
      "definition": "clear English definition",
      "definitionVi": "Vietnamese translation of meaning",
      "example": "natural English example sentence",
      "exampleVi": "Vietnamese translation of example"
    }
  ]
}
Use varied, useful words for daily work and conversation. No duplicates.`;

    const result = await geminiGenerateJson<GeminiVocabResponse>(prompt);

    if (!result.words?.length) {
      return NextResponse.json(
        { error: "No words generated" },
        { status: 502 }
      );
    }

    const words: VocabWord[] = result.words
      .filter((w) => w.word?.trim())
      .slice(0, count)
      .map((w) => ({
        id: generateId(),
        word: w.word.trim(),
        phonetic: w.phonetic?.trim(),
        partOfSpeech: w.partOfSpeech?.trim() || "word",
        definition: w.definition?.trim() || "",
        definitionVi: w.definitionVi?.trim() || "",
        example: w.example?.trim() || "",
        exampleVi: w.exampleVi?.trim() || "",
      }));

    return NextResponse.json({
      words,
      level,
      generatedAt: Date.now(),
    });
  } catch (error) {
    console.error("Vocabulary generate error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate vocabulary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
