from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from dotenv import load_dotenv
import os
from pydantic import BaseModel
from typing import List, Optional, Literal, Union, Dict

load_dotenv()
app = FastAPI()

# Allow all CORS origins (adjust for prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]  # previous messages + current message
    file_id: Optional[str] = None  # optional doc file uploaded before

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.post("/upload")
async def upload_doc(file: UploadFile = File(...)):
    if not file.filename.endswith((".pdf", ".docx")):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")

    # Upload file to OpenAI
    try:
        file_stream = await file.read()
        upload = openai_client.files.create(
            file=(file.filename, file_stream),
            purpose="assistants"
        )
        file_id = upload.id
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload to OpenAI failed: {str(e)}")

    # Compose prompt with instructions
    prompt = f"""
You are an expert assistant helping a user prepare for meetings.
The uploaded document contains important context. Based on the file:
1. Summarize the key points.
2. Generate 3–5 follow-up questions the user should ask in their next meeting.
Reply in the following format:
### Summary
...
### Follow-Up Questions
1. ...
2. ...
"""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a meeting assistant AI."},
                {"role": "user", "content": prompt}
            ],
            tools=[
                {
                    "type": "file_search"
                }
            ],
            tool_choice="auto",
            file_ids=[file_id],
        )

        content = response.choices[0].message.content
        return {
            "summary_and_followup": content,
            "file_id": file_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during ChatGPT API call: {str(e)}")
    


@app.post("/chat")
async def chat_with_context(chat: ChatRequest):
    try:
        # Build the API call
        request_payload = {
            "model": "gpt-4o",
            "messages": chat.messages,
        }

        # If file_id is present, include file-search tool
        if chat.file_id:
            request_payload["tools"] = [{"type": "file_search"}]
            request_payload["tool_choice"] = "auto"
            request_payload["file_ids"] = [chat.file_id]

        # Make the API call
        response = openai_client.chat.completions.create(**request_payload)

        return {
            "response": response.choices[0].message.content
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")
