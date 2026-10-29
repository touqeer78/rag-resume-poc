import "dotenv/config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

async function main() {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
  });

  const response = await model.invoke("Say hello");

  console.log(response.content);
}

main().catch(console.error);
