interface LanguageDetection {
  detectedLanguage: string;
  confidence: number;
}

interface LanguageDetectorInstance {
  detect(text: string): Promise<LanguageDetection[]>;
  destroy(): void;
}

interface LanguageDetectorAPI {
  availability(): Promise<string>;
  create(): Promise<LanguageDetectorInstance>;
}

declare global {
  interface Window {
    LanguageDetector?: LanguageDetectorAPI;
  }
}

export async function detectMessageLanguage(
  text: string,
): Promise<string | null> {
  if (!text.trim()) return null;

  const detectorAPI = window.LanguageDetector;

  if (!detectorAPI) {
    throw new Error("Este navegador no admite la API LanguageDetector.");
  }

  let detector: LanguageDetectorInstance | null = null;

  try {
    const availability = await detectorAPI.availability();

    console.log("Disponibilidad LanguageDetector:", availability);

    if (availability === "unavailable") {
      throw new Error("La detección de idiomas no está disponible.");
    }

    detector = await detectorAPI.create();

    const results = await detector.detect(text);

    console.log("Resultados de detección:", results);

    const bestResult = results[0];

    // Evitar aceptar resultados ambiguos
    if (
      !bestResult ||
      bestResult.detectedLanguage === "und" ||
      bestResult.confidence < 0.5
    ) {
      return null;
    }

    return bestResult.detectedLanguage;
  } finally {
    detector?.destroy();
  }
}
