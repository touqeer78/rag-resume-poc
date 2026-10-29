# Resume RAG POC

Local resume question answering with Gemini embeddings, LanceDB, and Gemini generation.

## Setup

From this directory, install dependencies:

```bash
yarn install
```

Create `.env` with your Gemini API key:

```env
GOOGLE_API_KEY=your_api_key
```

Keep the key private. The `.env` file and local `.lancedb/` index are ignored by Git.

## Run the RAG app

```bash
yarn start
```

Enter your question when prompted. For a non-interactive run, pass it with `--question` (or `-q`):

```bash
yarn start --question "What experience does the resume show with AWS?"
```

With reindexing:

```bash
yarn start --reindex --question "Where has the candidate worked?"
```

The app uses a non-empty existing LanceDB index. If the `vectors` table is missing or empty, it loads `documents/resume.pdf`, splits it into chunks, creates embeddings, and stores them locally. To rebuild the index explicitly:

```bash
yarn rag-reindex
```

Reindexing replaces the `vectors` table and creates new embeddings. Both operations require Gemini access.

The app logs the retrieved chunks, including their text, source, page, rank, and LanceDB distance. Resume content is therefore visible in the terminal. Gemini receives the question and retrieved resume content for answer generation; indexing also sends resume chunks to Gemini for embeddings.

To inspect PDF extraction and the first five chunks without querying Gemini or changing LanceDB:

```bash
yarn inspect-chunks
```

`yarn dev` and `yarn rag-localdb` also run the RAG app and accept the same arguments. `yarn build` compiles the TypeScript project.
