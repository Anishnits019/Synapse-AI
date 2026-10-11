from xml.sax.saxutils import escape
import os
import uuid
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from langchain.tools import tool

def create_pdf(summary: dict, output_dir: str = None) -> str:
    if output_dir is None:
        output_dir = os.path.join(os.getcwd(), "generated_pdfs")

    os.makedirs(output_dir, exist_ok=True)

    safe_title = (summary.get("title") or "Document Summary").replace("/", "-")
    filename = f"{safe_title}-{uuid.uuid4().hex[:8]}.pdf"
    output_path = os.path.join(output_dir, filename)

    styles = getSampleStyleSheet()
    doc = SimpleDocTemplate(
        output_path,
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
    return output_path