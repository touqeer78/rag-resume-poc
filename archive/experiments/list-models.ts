import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function listAvailableModels() {
  try {
    // ai.models.list() returns an async iterable pager
    const response = await ai.models.list();

    // Use 'for await...of' to loop over the models directly
    for await (const model of response) {
      console.log(`Model Name: ${model.name}`);
      // @ts-ignore: property exists at runtime
      console.log(`Supported Actions: ${model.supportedGenerationMethods}\n`);
    }
  } catch (error) {
    console.error("Error fetching models:", error);
  }
}

listAvailableModels();
