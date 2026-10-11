import "dotenv/config";
import Groq from "groq-sdk";
import { tavily } from "@tavily/core";
import NodeCache from "node-cache";

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


const cache = new NodeCache({ stdTTL: 60 * 60 * 24 });


export async function generate(userMessage, threadId) {
  const baseMessages = [
    {
      role: "system",
      content: `You are a smart personal assistant.
If you know the answer to a question, answer it directly in plain English.
If the answer requires real-time, local, or up-to-date information, or if you don't know the answer, use the available tools to find it.
You have access to the following tool:
webSearch(query: string): Use this to search the internet for current or unknown information.
Decide when to use your own knowledge and when to use the tool.
Do not mention the tool unless needed.
Never use markdown symbols like ** or # or -. Write in plain sentences. Keep answers clear and concise. If the user asks for suggestions, lists or detail, give a complete answer written as plain sentences or short paragraphs, not markdown.

Examples:
Q: What is the capital of France?
A: The capital of France is Paris.

Q: What's the weather in Mumbai right now?
A: (use the search tool to find the latest weather)

Q: Who is the Prime Minister of India?
A: (use the search tool to confirm)

Q: Tell me the latest IT news.
A: (use the search tool to get the latest news)

Q: Suggest an outfit for a casual day out.
A: A well-fitted white tee with dark jeans and clean white sneakers works well. Add a light jacket if it is cool, and a simple watch to finish the look.

current date and time: ${new Date().toUTCString()}`,
    },
    // {
    //   role: "user",
    //   content: `What is the current weather in Lucknow`,
    //   // When was iphone 17 launched?
    //   // Hii
    // },
  ];

  const messages = cache.get(threadId) ?? baseMessages;

  messages.push({
    role: "user",
    content: userMessage,
  });

  const MAX_RETRIES = 10;
  let count = 0;

  while (true) {
    if(count > MAX_RETRIES) {
      return "I could not find the result, please try again";
    }
    count++;

    const completions = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      temperature: 0,
      messages: messages,
      tools: [
        {
          type: "function",
          function: {
            name: "webSearch",
            description:
              "Search the latest and real time information on the internet.",
            parameters: {
              // JSON Schema object
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query to perform search on.",
                },
              },
              required: ["query"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: "auto",
    });

    messages.push(completions.choices[0].message);

    const toolCalls = completions.choices[0].message.tool_calls;

    if (!toolCalls) {
      // here we end the chatbot response
      cache.set(threadId, messages);
      // console.log(cache);  
      return completions.choices[0].message.content;
    }

    for (const tool of toolCalls) {
      //   console.log("tool:", tool);
      const functionName = tool.function.name;
      const functionParams = tool.function.arguments;

      if (functionName === "webSearch") {
        const toolResult = await webSearch(JSON.parse(functionParams));
        // console.log("Tool result: ", toolResult);

        messages.push({
          tool_call_id: tool.id,
          role: "tool",
          name: functionName,
          content: toolResult,
        });
      }
    }
  }
}

async function webSearch({ query }) {
  // Here we will do tavily api call
  console.log("Calling web search...");
  const response = await tvly.search(query);
  //   console.log("Response", response);

  const finalResult = response.results
    .slice(0, 3)
    .map((result) => result.content.slice(0, 500))
    .join("\n\n");
  //   console.log("finalResult:", finalResult);

  return finalResult;
}
