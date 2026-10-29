import "dotenv/config";
import { LanceDB } from "@langchain/community/vectorstores/lancedb";
import {
  GoogleGenerativeAIEmbeddings,
  ChatGoogleGenerativeAI,
} from "@langchain/google-genai";
import {
  connectToResumeDatabase,
  ensureResumeIndexed,
} from "./resume-index.js";

export async function runRag(
  query: string,
  forceReindex: boolean,
): Promise<void> {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "models/gemini-embedding-001",
  });

  const db = await connectToResumeDatabase();
  await ensureResumeIndexed(db, embeddings, forceReindex);
  const table = await db.openTable("vectors");
  const vectorStore = new LanceDB(embeddings, { table });

  const searchResults = await vectorStore.similaritySearchWithScore(query, 3);
  logRetrievedChunks(searchResults);
  const topChunks = searchResults
    .map(([document]) => document.pageContent)
    .join("\n\n");

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
  });

  const prompt = `
    You are a helpful assistant who is an expert in resume reading.
    Answer questions based ONLY on the context below.

    CONTEXT:
    ${topChunks}

    QUESTION:
    ${query}
  `;

  const result = await llm.invoke(prompt);
  console.log("\n🧠 FINAL ANSWER:\n");
  console.log(result.content);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function logRetrievedChunks(
  results: Awaited<ReturnType<LanceDB["similaritySearchWithScore"]>>,
): void {
  console.log(`\nRetrieved ${results.length} chunks:\n`);

  results.forEach(([document, distance], index) => {
    const nestedMetadata = document.metadata["metadata"];
    const metadata = isRecord(nestedMetadata)
      ? nestedMetadata
      : document.metadata;
    const source =
      typeof metadata["source"] === "string" ? metadata["source"] : "unknown";
    const pageNumber = metadata["pageNumber"];
    const page =
      typeof pageNumber === "number" ? ` | Page: ${pageNumber}` : "";

    console.log(`--- Rank ${index + 1} | Distance: ${distance}${page} ---`);
    console.log(`Source: ${source}`);
    console.log(document.pageContent);
    console.log();
  });
}
