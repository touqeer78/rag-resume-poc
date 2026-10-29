import "dotenv/config";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

async function main() {
  // 1. Load + chunk
  const loader = new PDFLoader("documents/resume.pdf");
  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });

  const chunks = await splitter.splitDocuments(docs);

  // 2. Embeddings model
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "models/gemini-embedding-001",
  });

  // 3. Embed all chunks
  const chunkVectors = await embeddings.embedDocuments(
    chunks.map((c) => c.pageContent),
  );

  // 4. Query
  const query = "What AWS experience does Touqeer have?";
  const queryVector = await embeddings.embedQuery(query);

  // 5. Simple cosine similarity
  function cosineSimilarity(a: number[], b: number[]) {
    let dot = 0,
      normA = 0,
      normB = 0;
    const len = Math.min(a.length, b.length);

    for (let i = 0; i < len; i++) {
      const ai = a[i];
      const bi = b[i];
      if (ai === undefined || bi === undefined) {
        continue;
      }

      dot += ai * bi;
      normA += ai * ai;
      normB += bi * bi;
    }

    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // 6. Rank chunks
  const scored = chunkVectors.map((vec, i) => {
    const chunk = chunks[i];
    if (!chunk) {
      throw new Error(`Missing chunk for vector index ${i}`);
    }

    return {
      index: i,
      score: cosineSimilarity(queryVector, vec),
      text: chunk.pageContent,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  // 7. Show top 3
  console.log("\n🔎 Top 3 relevant chunks:\n");

  scored.slice(0, 3).forEach((c, i) => {
    console.log(`\n--- Rank ${i + 1} | Score: ${c.score.toFixed(4)} ---\n`);
    console.log(c.text);
  });
}

main().catch(console.error);
