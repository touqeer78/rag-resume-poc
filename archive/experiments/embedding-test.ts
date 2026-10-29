import "dotenv/config";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

async function main() {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "models/gemini-embedding-001",
  });

  const vector = await embeddings.embedQuery(
    "What AWS experience does Touqeer have?",
  );

  console.log("Vector length:", vector.length);
  console.log(vector.slice(0, 10));
}

main().catch(console.error);
