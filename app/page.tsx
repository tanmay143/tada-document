"use client"

import { useState } from "react"
import DocumentUpload from "./components/document-upload"
import ChatInterface from "./components/chat-interface"

export default function DocumentChatbot() {
  const [currentScreen, setCurrentScreen] = useState<"upload" | "chat">("upload")
  const [documentData, setDocumentData] = useState<{
    summary: string
    followUpQuestions: string[]
    fileName: string
    fileSize: number
  } | null>(null)

  const handleDocumentProcessed = (data: any) => {
    setDocumentData(data)
    setCurrentScreen("chat")
  }

  const handleBackToUpload = () => {
    setCurrentScreen("upload")
    setDocumentData(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {currentScreen === "upload" ? (
        <DocumentUpload onDocumentProcessed={handleDocumentProcessed} />
      ) : (
        <ChatInterface documentData={documentData!} onBackToUpload={handleBackToUpload} />
      )}
    </div>
  )
}
