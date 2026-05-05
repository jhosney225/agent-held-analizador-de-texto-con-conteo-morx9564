
```javascript
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";

const client = new Anthropic();

interface TextStatistics {
  totalCharacters: number;
  totalWords: number;
  totalSentences: number;
  averageWordLength: number;
  uniqueWords: number;
  wordFrequency: Record<string, number>;
  longestWord: string;
  shortestWord: string;
}

function analyzeText(text: string): TextStatistics {
  // Contar caracteres
  const totalCharacters = text.length;

  // Contar palabras
  const words = text
    .toLowerCase()
    .match(/\b[\w'-]+\b/g) || [];
  const totalWords = words.length;

  // Contar oraciones
  const sentences = text.match(/[.!?]+/g) || [];
  const totalSentences = sentences.length || 1;

  // Calcular longitud promedio de palabras
  const averageWordLength =
    totalWords > 0 ? (totalCharacters / totalWords).toFixed(2) : "0";

  // Contar palabras únicas
  const uniqueWordsSet = new Set(words);
  const uniqueWords = uniqueWordsSet.size;

  // Calcular frecuencia de palabras
  const wordFrequency: Record<string, number> = {};
  words.forEach((word) => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });

  // Encontrar palabra más larga y más corta
  let longestWord = "";
  let shortestWord = words[0] || "";

  words.forEach((word) => {
    if (word.length > longestWord.length) {
      longestWord = word;
    }
    if (word.length < shortestWord.length) {
      shortestWord = word;
    }
  });

  return {
    totalCharacters,
    totalWords,
    totalSentences,
    averageWordLength: parseFloat(averageWordLength as string),
    uniqueWords,
    wordFrequency,
    longestWord,
    shortestWord,
  };
}

async function getAIAnalysis(text: string, stats: TextStatistics): Promise<string> {
  const topWords = Object.entries(stats.wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => `${word} (${count} veces)`)
    .join(", ");

  const prompt = `Analiza el siguiente texto y proporciona insights interesantes sobre él.

Texto: "${text}"

Estadísticas disponibles:
- Total de palabras: ${stats.totalWords}
- Palabras únicas: ${stats.uniqueWords}
- Total de caracteres: ${stats.totalCharacters}
- Longitud promedio de palabra: ${stats.averageWordLength}
- Oración(es): ${stats.totalSentences}
- Palabra más larga: ${stats.longestWord}
- Palabra más corta: ${stats.shortestWord}
- Palabras más frecuentes: ${topWords}

Por favor, proporciona un análisis breve (2-3 párrafos) sobre el contenido, tono y características principales del texto.`;

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const textContent = message.content.find((block) => block.type === "text");
  return textContent && "text" in textContent ? textContent.text : "";
}

function displayStatistics(stats: TextStatistics): void {
  console.log("\n" + "=".repeat(50));
  console.log("ESTADÍSTICAS DEL TEXTO");
  console.log("=".repeat(50));
  console.log(`Total de caracteres: ${stats.totalCharacters}`);
  console.log(`Total de palabras: ${stats.totalWords}`);
  console.log(`Total de oraciones: ${stats.totalSentences}`);
  console.log(`Longitud promedio de palabra: ${stats.averageWordLength}`);
  console.log(`Palabras únicas: ${stats.uniqueWords}`);
  console.log(`Palabra más larga: "${stats.longestWord}"`);
  console.log(`Palabra más corta: "${stats.shortestWord}"`);

  // Mostrar las 10 palabras más frecuentes
  console.log("\n" + "-".repeat(50));
  console.log("PALABRAS MÁS FRECUENTES:");
  console.log("-".repeat(50));
  const topWords = Object.entries(stats.wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  topWords.forEach(([word, count], index) => {
    console.log(`${index + 1}. "${word}": ${count} veces`);
  });
}

async function main(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  };

  console.log("\n" + "=".repeat(50));
  console.log("ANALIZADOR DE TEXTO CON IA");
  console.log("=".repeat(50));
  console.log("\nEste programa analiza un texto proporcionado y:");
  console.log("1. Calcula estadísticas: palabras, caracteres, oraciones");
  