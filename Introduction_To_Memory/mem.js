import "dotenv/config";
import { OpenAI } from "openai";
import { Memory } from "mem0ai/oss";

// Gemini Config
// const client = new OpenAI({
//   apiKey: process.env.GEMINI_API_KEY,
//   baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
// });

const client = new OpenAI();

const mem = new Memory({
  version: "v1.1",

  vectorStore: {
    provider: "qdrant",
    config: {
      collectionName: "memories",
      embeddingModelDims: 1536,
      host: "localhost",
      port: 6333,
    },
  },
});

async function chat(query = "") {
  const fetchMemories = await mem.search(query, { userId: "saurav" });
  console.log({ fetchMemories });
  const memoryStr = fetchMemories.results.map((e) => e.memory).join("\n");
  console.log({ memoryStr });

  const SYSTEM_PROMPT = `
  You are a memory aware assitant we have got some memory about the user.
  Here is the context about the user :
  ${memoryStr}
  `;
  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini", //gemini-2.5-flash for Gemini Config
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: query },
    ],
  });

  const assitantMsg = response.choices[0].message.content;

  console.log(`\n\n\n🤖: ${assitantMsg}`);
  console.log("Adding to memory...");
  await mem.add(
    [
      { role: "user", content: query },
      { role: "assitant", content: assitantMsg },
    ],
    {
      userId: "saurav", // DB name
    },
  );
  console.log("Adding to memory done...");
}

chat("What is my name and where do i live");
