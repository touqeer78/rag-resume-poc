import "dotenv/config";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

async function main() {
  const loader = new PDFLoader("documents/resume.pdf");

  console.log("Loading PDF...");

  const docs = await loader.load();

  console.log("\n--- PAGE 1 TEXT ---\n");
  console.log(docs[0].pageContent.slice(0, 2000));

  console.log("\nTotal pages loaded:", docs.length);
}

main().catch(console.error);
