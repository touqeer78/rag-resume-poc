import "dotenv/config";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import {
  GoogleGenerativeAIEmbeddings,
  ChatGoogleGenerativeAI,
} from "@langchain/google-genai";

async function main() {
  // 1. Load PDF
  const loader = new PDFLoader("documents/resume.pdf");
  const docs = await loader.load();

  // 2. Chunk
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });

  const chunks = await splitter.splitDocuments(docs);

  // 3. Embeddings
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "models/gemini-embedding-001",
  });

  const chunkVectors = await embeddings.embedDocuments(
    chunks.map((c) => c.pageContent),
  );

  const query = "Did Touqeer worked in AWS when he was with Tennis Australia?";
  const queryVector = await embeddings.embedQuery(query);

  // 4. Cosine similarity
  function cosine(a: number[], b: number[]) {
    let dot = 0,
      na = 0,
      nb = 0;
    const len = Math.min(a.length, b.length);

    for (let i = 0; i < len; i++) {
      const ai = a[i];
      const bi = b[i];
      if (ai === undefined || bi === undefined) {
        continue;
      }

      dot += ai * bi;
      na += ai * ai;
      nb += bi * bi;
    }

    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  const scored = chunkVectors
    .map((vec, i) => {
      const chunk = chunks[i];
      if (!chunk) {
        throw new Error(`Missing chunk for vector index ${i}`);
      }

      return {
        text: chunk.pageContent,
        score: cosine(queryVector, vec),
      };
    })
    .sort((a, b) => b.score - a.score);

  // 5. Take top 3 chunks
  const topChunks = scored
    .slice(0, 3)
    .map((c) => c.text)
    .join("\n\n");

  // 6. Ask Gemini
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
  });

  const prompt = `
You are a helpful assistant who is very expert in resume reading for australian job market and answering questions based ONLY on the context below.

CONTEXT:
${topChunks}

QUESTION:
${query}

Give a clear, structured answer.
`;

  const result = await llm.invoke(prompt);

  console.log("\n🧠 FINAL ANSWER:\n");
  console.log(result.content);
}

main().catch(console.error);
