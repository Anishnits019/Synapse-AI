from xml.sax.saxutils import escape
import os
import uuid
import io

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from langchain.tools import tool

def create_pdf(summary: dict):
    """Generates a PDF in-memory and returns a BytesIO stream buffer."""
    buffer = io.BytesIO()
    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=0.9 * inch,
        rightMargin=0.9 * inch,
        topMargin=0.9 * inch,
        bottomMargin=0.9 * inch,
    )

    story = [
        Paragraph(escape(str(summary.get("title", "Document Summary"))), styles["Title"]),
        Paragraph(escape(str(summary.get("subtitle", "Summary"))), styles["Italic"]),
        Spacer(1, 0.3 * inch),
    ]

    for section in summary.get("sections", []):
        heading = section.get("heading", "Section")
        story.append(Paragraph(escape(str(heading)), styles["Heading2"]))
        points = section.get("points", [])
        story.append(
            ListFlowable(
                [ListItem(Paragraph(escape(str(p)), styles["BodyText"])) for p in points],
                bulletType="bullet",
                start="•",
                leftIndent=18,
            )
        )
        story.append(Spacer(1, 0.2 * inch))

    doc.build(story)
    buffer.seek(0)

    return buffer