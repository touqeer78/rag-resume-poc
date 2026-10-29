import "dotenv/config";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

async function main() {
  // 1. Load PDF
  const loader = new PDFLoader("documents/resume.pdf");
  const docs = await loader.load();

  // 2. Chunk it
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });

  const chunks = await splitter.splitDocuments(docs);

  console.log("Chunks:", chunks.length);

  // 3. Embeddings
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "models/gemini-embedding-001",
  });

  // 4. Convert chunks → vectors
  const vectors = await embeddings.embedDocuments(
    chunks.map((c) => c.pageContent),
  );

  console.log("Vectors created:", vectors.length);
  const firstVector = vectors[0];
  if (!firstVector) {
    console.log("No embeddings were created.");
  } else {
    console.log("Each vector size:", firstVector.length);
  }
}

main().catch(console.error);
