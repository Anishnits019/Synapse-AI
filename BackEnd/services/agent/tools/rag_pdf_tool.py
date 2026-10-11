import os
from langchain.tools import tool
from ..utils.pdf_builder import create_pdf

@tool
def rag_pdf_tool(summary:dict):
    """Generate a PDF from a structured summary."""
    output_dir = os.path.join(os.getcwd(), "generated_pdfs")
    os.makedirs(output_dir, exist_ok=True)
    pdf_path = create_pdf(summary, output_dir=output_dir)
    return {
        "pdf_path": pdf_path,
        "status": "success"
    }