import { fileURLToPath } from "node:url";
import * as lancedb from "@lancedb/lancedb";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import type { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const tableName = "vectors";
const resumePath = fileURLToPath(
  new URL("../../documents/resume.pdf", import.meta.url),
);
const databasePath = fileURLToPath(new URL("../../.lancedb", import.meta.url));

export async function loadResumeChunks() {
  const loader = new PDFLoader(resumePath);
  const documents = await loader.load();
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });
  const chunks = await splitter.splitDocuments(documents);

  if (chunks.length === 0) {
    throw new Error(`No text chunks were extracted from ${resumePath}`);
  }

  return { documents, chunks };
}

export async function ensureResumeIndexed(
  db: lancedb.Connection,
  embeddings: GoogleGenerativeAIEmbeddings,
  forceReindex: boolean,
): Promise<void> {
  const tableExists = (await db.tableNames()).includes(tableName);

  if (tableExists) {
    const table = await db.openTable(tableName);
    const rowCount = await table.countRows();

    if (rowCount > 0 && !forceReindex) {
      console.log(
        `Using existing LanceDB index (${rowCount} chunks). Pass --reindex to rebuild it.`,
      );
      return;
    }

    if (rowCount === 0) {
      console.log("The LanceDB index is empty; creating it from the resume.");
    } else {
      console.log("Rebuilding the LanceDB index from the resume.");
    }
  } else {
    console.log("No LanceDB index found; creating it from the resume.");
  }

  const { documents, chunks } = await loadResumeChunks();
  console.log(`Loaded ${documents.length} pages; created ${chunks.length} chunks.`);

  const vectors = await embeddings.embedDocuments(
    chunks.map((chunk) => chunk.pageContent),
  );

  if (vectors.length !== chunks.length) {
    throw new Error(
      `Embedding count mismatch: expected ${chunks.length}, received ${vectors.length}`,
    );
  }

  const rows = chunks.map((chunk, index) => {
    const vector = vectors[index];
    if (!vector) {
      throw new Error(`Missing embedding for chunk ${index + 1}`);
    }

    return {
      vector,
      text: chunk.pageContent,
      metadata: {
        source: "resume.pdf",
        pageNumber: chunk.metadata.loc?.pageNumber ?? 1,
      },
    };
  });

  await db.createTable(tableName, rows, { mode: "overwrite" });
  console.log(`Indexed ${rows.length} chunks in LanceDB.`);
}

export async function connectToResumeDatabase(): Promise<lancedb.Connection> {
  return lancedb.connect(databasePath);
}
