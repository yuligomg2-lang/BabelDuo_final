interface IdiomEntry {
  phrase: string;
  replacement: string;
}

const idiomDictionary: Record<string, IdiomEntry[]> = {
  es: [
    { phrase: "qué nota", replacement: "qué genial" },
    { phrase: "estoy mamado", replacement: "estoy muy cansado" },
    { phrase: "no manches", replacement: "no puede ser" },
    { phrase: "me cayó el veinte", replacement: "por fin lo entendí" },
    { phrase: "no te hagas bolas", replacement: "no te confundas" },
    { phrase: "eres un sol", replacement: "eres muy amable" },
    { phrase: "qué pasada", replacement: "qué increíble" },
    { phrase: "estoy hecho polvo", replacement: "estoy muy cansado" },
    { phrase: "qué pena contigo", replacement: "lo siento mucho" },
    { phrase: "estoy hasta las manos", replacement: "estoy muy ocupado" },
  ],
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeIdioms(text: string, sourceLanguage: string): string {
  const entries = idiomDictionary[sourceLanguage];

  if (!entries) return text;

  let normalizedText = text;

  for (const entry of entries) {
    const pattern = new RegExp(
      `(^|[^\\p{L}\\p{N}_])${escapeRegExp(entry.phrase)}(?=$|[^\\p{L}\\p{N}_])`,
      "giu",
    );

    normalizedText = normalizedText.replace(
      pattern,
      (_match, prefix: string) => `${prefix}${entry.replacement}`,
    );
  }

  return normalizedText;
}
