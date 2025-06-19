"use client"

import { useState } from "react"
import { useChat } from "@ai-sdk/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, Send, ArrowLeft, FileText, MessageSquare } from "lucide-react"

interface ChatInterfaceProps {
  documentData: {
    summary: string
    followUpQuestions: string[]
    fileName: string
    fileSize: number
    fileId: string
  }
  onBackToUpload: () => void
}

// Define the UIMessage type
interface UIMessage {
  id: string;
  role: string;
  parts: Array<{ type: string; text?: string }>; // Allow text to be optional
  content?: string;
}

export default function ChatInterface({ documentData, onBackToUpload }: ChatInterfaceProps) {
  const [isDocumentOpen, setIsDocumentOpen] = useState(false)

  const { messages: originalMessages, input, handleInputChange, handleSubmit: originalHandleSubmit, isLoading } = useChat({
    body: {
      documentSummary: documentData.summary,
      fileId: documentData.fileId,
    },
  })

  const [messages, setMessages] = useState<UIMessage[]>(() => originalMessages || [])
  const [input, setInput] = useState("")

  const handleQuestionClick = (question: string) => {
    handleSubmit(new Event("submit") as any, {
      data: { message: question },
    })
  }

  const handleSubmit = async (event: React.FormEvent, options?: { data?: { message: string } }) => {
    event.preventDefault();
    if (!input.trim() && !options?.data?.message) return;

    const newMessage: UIMessage = {
      id: Date.now().toString(),
      role: "user",
      parts: [{ type: "text", text: options?.data?.message || input }],
      content: options?.data?.message || input, // Ensure content is always a string
    };

    // Append the new message to the existing messages
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    // Clear the input field
    setInput("");

    // Call the original handleSubmit logic
    await originalHandleSubmit(event, options);

    // Make a POST request to the /chat endpoint
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, newMessage],
          file_id: documentData.fileId,
        }),
      });
      console.log(response)
      if (response.ok) {
        const data = await response.json();
        // Handle the response data as needed
      }
    } catch (error) {
      console.error("Error during chat request:", error);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onBackToUpload} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">{documentData.fileName}</span>
            </div>
          </div>
        </div>

        {/* Document Summary */}
        <div className="p-4 bg-gray-50 border-b">
          <Collapsible open={isDocumentOpen} onOpenChange={setIsDocumentOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <span className="font-medium text-gray-900">Document Summary</span>
                {isDocumentOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-700 whitespace-pre-line">{documentData.summary}</div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Start a conversation about your document</p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user" ? "bg-blue-600 text-white" : "bg-white border shadow-sm text-gray-900"
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {message.parts.map((part, i) => {
                    if (part.type === "text") {
                      return <span key={i}>{part.text}</span>
                    }
                    return null
                  })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border shadow-sm rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="border-t bg-white p-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask a question about your document..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Follow-up Questions Sidebar */}
      <div className="lg:w-80 bg-white border-l p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Suggested Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {documentData?.followUpQuestions && documentData.followUpQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full text-left justify-start h-auto p-3 text-sm"
                onClick={() => handleQuestionClick(question)}
                disabled={isLoading}
              >
                {question}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
