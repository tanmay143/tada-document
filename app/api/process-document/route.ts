export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get("file") as File

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 })
  }

  // Simulate document processing - in a real app, you'd use a PDF/DOCX parser
  const mockSummary = `Document: ${file.name}
  
This document appears to be a ${file.type.includes("pdf") ? "PDF" : "Word"} document containing information about business processes, procedures, and guidelines. The document includes sections on project management, team collaboration, and strategic planning initiatives.

Key topics covered:
• Project planning and execution
• Team communication protocols  
• Performance metrics and KPIs
• Risk management strategies
• Quality assurance processes

The document is approximately ${Math.round(file.size / 1024)} KB in size and contains detailed information that can be used to answer questions about organizational processes and best practices.`

  const followUpQuestions = [
    "What are the main objectives outlined in this document?",
    "Can you explain the key processes described?",
    "What are the recommended best practices mentioned?",
    "How should teams implement these guidelines?",
    "What metrics should be tracked according to this document?",
  ]

  return Response.json({
    summary: mockSummary,
    followUpQuestions,
    fileName: file.name,
    fileSize: file.size,
  })
}
