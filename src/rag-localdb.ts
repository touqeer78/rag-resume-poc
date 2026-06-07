import "dotenv/config";
import * as lancedb from "@lancedb/lancedb";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { LanceDB } from "@langchain/community/vectorstores/lancedb";
import {
  GoogleGenerativeAIEmbeddings,
  ChatGoogleGenerativeAI,
} from "@langchain/google-genai";

async function main() {
  // 1. Load PDF
  //const loader = new PDFLoader("documents/resume.pdf");
  //const docs = await loader.load();

  // 2. Chunk
  //const splitter = new RecursiveCharacterTextSplitter({
  //chunkSize: 500,
  //chunkOverlap: 100,
  //});
  //const chunks = await splitter.splitDocuments(docs);

  // 3. Setup Embeddings
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "models/gemini-embedding-001",
  });

  // 4. Initialize LanceDB
  const db = await lancedb.connect(".lancedb");

  //const initialVectors = await embeddings.embedDocuments(
  //chunks.map((c) => c.pageContent),
  //);

  // CLEAN THE DATA HERE
  // const data = chunks.map((chunk, i) => ({
  //   vector: initialVectors[i],
  //   text: chunk.pageContent,
  //   // We only keep simple metadata. This avoids the Arrow type error.
  //   metadata: {
  //     source: "resume.pdf",
  //     pageNumber: chunk.metadata.loc?.pageNumber || 1,
  //   },
  // }));
  // Create the table with the actual data
  //const table = await db.createTable("vectors", data, { overwrite: true });

  const table = await db.openTable("vectors");

  // Now wrap it in the LangChain VectorStore object
  const vectorStore = new LanceDB(embeddings, { table });

  // 5. Search the Database
  const query = "Did Touqeer worked in AWS when he was with Tennis Australia?";
  const searchResults = await vectorStore.similaritySearch(query, 3);

  const topChunks = searchResults.map((doc) => doc.pageContent).join("\n\n");

  // 6. Ask Gemini
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

main().catch(console.error);
