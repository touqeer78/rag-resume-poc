import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { loadResumeChunks } from "./resume-index.js";
import { runRag } from "./rag-localdb.js";

async function inspectResumeChunks(): Promise<void> {
  const { documents, chunks } = await loadResumeChunks();

  console.log(`Pages loaded: ${documents.length}`);
  console.log(`Chunks created: ${chunks.length}`);

  chunks.slice(0, 5).forEach((chunk, index) => {
    console.log("\n====================");
    console.log(`Chunk ${index + 1}`);
    console.log("====================");
    console.log(chunk.pageContent);
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let forceReindex = false;
  let inspectChunks = false;
  let question: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--reindex") {
      forceReindex = true;
    } else if (arg === "--inspect-chunks") {
      inspectChunks = true;
    } else if (arg === "--question" || arg === "-q") {
      const value = args[index + 1];
      if (!value || value.startsWith("-")) {
        throw new Error(`${arg} requires a question value`);
      }
      question = value;
      index += 1;
    } else {
      throw new Error(`Unsupported argument: ${arg}`);
    }
  }

  if (forceReindex && inspectChunks) {
    throw new Error("--reindex and --inspect-chunks cannot be used together");
  }

  if (inspectChunks && question) {
    throw new Error("--question cannot be used with --inspect-chunks");
  }

  if (inspectChunks) {
    await inspectResumeChunks();
    return;
  }

  if (!question) {
    const readline = createInterface({ input: stdin, output: stdout });
    try {
      question = (await readline.question("Ask a question about the resume: ")).trim();
    } finally {
      readline.close();
    }
  }

  if (!question) {
    throw new Error("Question cannot be empty");
  }

  await runRag(question, forceReindex);
}

main().catch((error: unknown) => {
  console.error("RAG run failed:", error);
  process.exitCode = 1;
});
