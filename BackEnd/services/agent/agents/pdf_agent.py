import os
from typing import List
import json
from langchain_core.messages import HumanMessage, SystemMessage,AIMessage
from pydantic import BaseModel, Field

from ..config.llm_model import getModel
from ..graph.state import AgentState
from ..utils.pdf_builder import create_pdf
from ..config.memory import getMemory
from ..utils.uploadTos3 import upload_to_s3
from ..utils.getFromS3 import get_from_s3


class Section(BaseModel):
    heading: str = Field(description="Section heading")
    points: List[str] = Field(
        description="Three to six concise points for the section"
    )


class PDFSummary(BaseModel):
    title: str = Field(description="Document title")
    subtitle: str = Field(description="Brief document summary")
    sections: List[Section] = Field(
        description="Four to eight sections summarizing the document"
    )


PDF_SYSTEM_PROMPT = """You are an expert document analyzer and summarizer. Your primary task is to generate accurate, high-quality summaries based strictly on the provided document and conversation context.

### ADAPTIVE SUMMARY DIRECTIVES:
First identify the style the user's LATEST request asks for, then follow ONLY that style:

1. SHORT / BRIEF SUMMARY (e.g. "short", "brief", "tl;dr", "quick"):
   - Use 1-2 sections with 3-5 high-level points in total.
   - Focus exclusively on the core thesis and ultimate conclusions.

2. IMPORTANT POINTS / KEY TAKEAWAYS SUMMARY (e.g. "key points", "important points", "takeaways"):
   - Use 3-6 sections with clear topic headings and 2-4 points each.
   - Limit details to essential data, core decisions, and critical action items.

3. DETAILED / EXHAUSTIVE SUMMARY (e.g. "detailed", "in-depth", "full", "comprehensive"):
   - Use 6-12 sections following the document's own structure, with 5-8 points each.
   - Include relevant statistics, supporting evidence, background context, and nuanced arguments.
   - Do not skip any major topic.

4. DEFAULT SUMMARY (when no specific style is requested):
   - Use 4-6 logical sections with 3-5 clear, impactful points each highlighting key facts.

If the user asks about a specific part or topic (e.g. "only chapter 2", "just the methodology"), summarize ONLY that part and ignore the rest.
If the user gives extra requirements (language, tone, audience), follow them.

### GROUNDING & CONTEXT RULES:
- Rely strictly on the information provided in the input document and prior conversation history. Do not extrapolate or introduce external facts.
- Preserve exact numbers, names, dates, and terms from the document. Never round or guess.
- If the user asks follow-up requests (e.g. "make it shorter", "add more on X"), refine the previous summary using both the document context and prior chat history.
- Each point must be specific and self-contained. No filler, no repeated points across sections.
- Write in the same language as the user's request unless they ask for a different one.
- Maintain an objective, professional, and easy-to-read layout.
"""

PDF_NAME_PROMPT = """
Based on the provided data, generate a suitable, concise, and descriptive file name for a PDF document.

Rules:
- Use normal spaces between words (e.g., Cardiovascular Disease Report.pdf).
- Do NOT use hyphens (-) or underscores (_).
- Must end with '.pdf'.
- Output ONLY the file name string. Do not include extra text, markdown code blocks, or quotes.
File Name:
"""


async def pdfAgent(state: AgentState):
    llm = getModel("pdf")
    structured_llm = llm.with_structured_output(PDFSummary)

    messages = [SystemMessage(content=PDF_SYSTEM_PROMPT),*state.get("messages",[])]

    summary = await structured_llm.ainvoke(messages)

    summary_data = summary.model_dump()

    
    filename_response=await llm.ainvoke([
        SystemMessage(content=PDF_NAME_PROMPT),
        HumanMessage(content=summary.model_dump_json())
    ])

    filename=filename_response.content.strip().strip("'").strip('"')
    if not filename.endswith(".pdf"):
        filename=+".pdf"
    
    pdf_buffer = create_pdf(summary_data)
    object_key=upload_to_s3(filename,pdf_buffer,"application/pdf")

    pdf_path=get_from_s3(object_key, expires_in=3600)

    state["chat_response"] = "PDF generated successfully."
    state["artifacts"] = [{
        "name":filename,
        "file_path":pdf_path
    }]
    return state
