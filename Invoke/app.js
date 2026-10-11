import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY});

async function main() {
    const completions = await groq.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        temperature: 0,
        // top_p: 0.2,
        // stop: null,
        // max_completion_tokens: 1000,
        // frequency_penalty: 1,
        // presence_penalty: 1,
        // response_format: {"type": "json_object"},
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "iphone_launch",
                strict: true,
                schema: {
                    type: "object",
                    properties: {
                        product: {
                            type: "string"
                        },
                        launch_date: {
                            type: "string"
                        }
                    },
                    required: ["product", "launch_date"],
                    additionalProperties: false
                }
            }
        },
        messages: [
            // {
            //     role: 'user',
            //     content: 'Hi',
            //         // content: 'What is Generative AI',
            // },

            {
                role: 'system',
                content: `You are a smart personal assistent who answers the asked questions.`,
            },
            {
                role: 'user',
                content: `When was iphone 16 launched`,
            },
        ],
    });

    // console.log(completions)
    // console.log(completions.choices[0].message);
    console.log(completions.choices[0]?.message?.content || "");
}

main();