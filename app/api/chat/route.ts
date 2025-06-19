import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, documentSummary } = await req.json()

  // Add document context to the system message
  const systemMessage = documentSummary
    ? `You are a helpful assistant that can answer questions about the uploaded document. Here's a summary of the document: ${documentSummary}. Use this context to provide relevant and accurate answers.`
    : "You are a helpful assistant."

  const result = streamText({
    model: openai("gpt-4o"),
    system: systemMessage,
    messages,
  })

  return result.toDataStreamResponse()
}
