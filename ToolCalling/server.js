import "dotenv/config";
import readline from "node:readline/promises";
import Groq from "groq-sdk";
import { tavily } from "@tavily/core";

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const messages = [
    {
      role: "system",
      content: `You are a smart personal assistant who answers the asked questions.
                You have access to following tools:
                1. webSearch({query}: {query: string}) Search the latest and realtime information on the internet.
                current datetime: ${new Date().toUTCString()}`,
    },
    // {
    //   role: "user",
    //   content: `What is the current weather in Lucknow`,
    //   // When was iphone 17 launched?
    //   // Hii
    // },
  ];

  while (true) {
    const question = await rl.question("You: ");
    // bye
    if (question === "bye") {
      break;
    }

    messages.push({
      role: "user",
      content: question,
    });

    while (true) {
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
        console.log(`Assistant: ${completions.choices[0].message.content}`);
        break;
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
  rl.close();
}

main();

async function webSearch({ query }) {
  // Here we will do tavily api call
  console.log("Calling web search...");
  const response = await tvly.search(query);
  //   console.log("Response", response);

  const finalResult = response.results
    .slice(0, 3)
    .map((result) => result.content)
    .join("\n\n");
  //   console.log("finalResult:", finalResult);

  return finalResult;
}
