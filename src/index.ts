import "dotenv/config";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

async function main() {
  const loader = new PDFLoader("documents/resume.pdf");

  const docs = await loader.load();

  console.log(`Pages loaded: ${docs.length}`);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });

  const chunks = await splitter.splitDocuments(docs);

  console.log(`Chunks created: ${chunks.length}`);

  chunks.slice(0, 5).forEach((chunk, index) => {
    console.log("\n====================");
    console.log(`Chunk ${index + 1}`);
    console.log("====================");
    console.log(chunk.pageContent);
  });
}

main().catch(console.error);
