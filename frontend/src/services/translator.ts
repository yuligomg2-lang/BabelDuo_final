import { normalizeIdioms } from "../helpers/idiomDictionary";

interface TranslatorInstance {
  translate(text: string): Promise<string>;
}

interface TranslatorAPI {
  availability(options: {
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<string>;

  create(options: {
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<TranslatorInstance>;
}

declare global {
  interface Window {
    Translator?: TranslatorAPI;
  }
}

const translators = new Map<string, Promise<TranslatorInstance>>();

export async function translateMessage(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<string> {
  if (!text.trim()) return text;

  if (sourceLanguage === targetLanguage) return text;

  const Translator = window.Translator;

  if (!Translator) {
    throw new Error("Este navegador no admite la API Translator.");
  }

  const normalizedText = normalizeIdioms(text, sourceLanguage);
  const key = `${sourceLanguage}-${targetLanguage}`;

  try {
    let translatorPromise = translators.get(key);

    if (!translatorPromise) {
      translatorPromise = (async () => {
        // Comprobar disponibilidad del par de idiomas
        const availability = await Translator.availability({
          sourceLanguage,
          targetLanguage,
        });

        console.log(
          `Disponibilidad ${sourceLanguage} → ${targetLanguage}:`,
          availability,
        );

        if (availability === "unavailable") {
          throw new Error(
            `La traducción de ${sourceLanguage} a ${targetLanguage} no está disponible en este navegador.`,
          );
        }

        // Crear el traductor. Chrome gestionará la descarga
        // del modelo cuando sea necesario.
        return Translator.create({
          sourceLanguage,
          targetLanguage,
        });
      })();

      translators.set(key, translatorPromise);
    }

    const translator = await translatorPromise;

    return await translator.translate(normalizedText);
  } catch (error) {
    translators.delete(key);
    throw error;
  }
}
