import os
from typing import List

from langchain_core.messages import HumanMessage, SystemMessage,AIMessage
from pydantic import BaseModel, Field

from ..config.llm_model import getModel
from ..graph.state import AgentState
from ..utils.pdf_builder import create_pdf
from ..config.memory import getMemory



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


PDF_SYSTEM_PROMPT = """You are an expert document summarizer.
Create a factual summary based only on the user's document or text.
Return four to eight sections, with three to six concise points per section.
use the previous messages if the user asked question to create base don previous chat inputs 
"""

async def pdfAgent(state: AgentState):
    llm = getModel("pdf")
    structured_llm = llm.with_structured_output(PDFSummary)
    prompt = state.get("prompt", "")

    history=await getMemory(state["conversationID"])

    messages=[SystemMessage(content=PDF_SYSTEM_PROMPT)]
    
    for msg in history:
              if msg["role"]=="user":
                   messages.append(HumanMessage(content=msg["content"]))
              elif msg["role"]=="assistant":
                   messages.append(AIMessage(content=msg["content"]))
    messages.append(HumanMessage(content=prompt))

    summary = await structured_llm.ainvoke(messages)

    summary_data = summary.model_dump()
    output_dir = os.path.join(os.getcwd(), "generated_pdfs")
    pdf_path = create_pdf(summary_data, output_dir=output_dir)

    state["chat_response"] = "PDF generated successfully."
    state["artifacts"] = [{
        "name": os.path.basename(pdf_path),
        "content": pdf_path,
        "language": "pdf",
    }]
    state["pdf_path"] = pdf_path
    return state
