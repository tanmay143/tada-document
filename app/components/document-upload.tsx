"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Loader2 } from "lucide-react"

interface DocumentUploadProps {
  onDocumentProcessed: (data: any) => void
}

export default function DocumentUpload({ onDocumentProcessed }: DocumentUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadedFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
  })

  const handleContinue = async () => {
    if (!uploadedFile) return

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append("file", uploadedFile)

      const response = await fetch("/api/process-document", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        onDocumentProcessed({
          summary: data.summary_and_followup,
          fileId: data.file_id,
          fileName: uploadedFile.name,
          fileSize: uploadedFile.size
        })
      }
    } catch (error) {
      console.error("Error processing document:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Chat</h1>
          <p className="text-gray-600">Upload a document to start chatting about its contents</p>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center text-xl">Upload Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-blue-400 bg-blue-50"
                  : uploadedFile
                    ? "border-green-400 bg-green-50"
                    : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center space-y-3">
                {uploadedFile ? (
                  <>
                    <FileText className="h-12 w-12 text-green-500" />
                    <div>
                      <p className="font-medium text-green-700">{uploadedFile.name}</p>
                      <p className="text-sm text-green-600">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-700">
                        {isDragActive ? "Drop your file here" : "Drag & drop your file here"}
                      </p>
                      <p className="text-sm text-gray-500">or click to browse</p>
                      <p className="text-xs text-gray-400 mt-2">Supports PDF and DOCX files</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Button
              onClick={handleContinue}
              disabled={!uploadedFile || isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Document...
                </>
              ) : (
                "Continue to Chat"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
