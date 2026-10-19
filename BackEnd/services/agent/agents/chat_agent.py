from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import SystemMessage

from ..config.llm_model import getModel
from ..exception import AgentError, AgentExecutionError
from ..graph.state import AgentState
from ..logger import logging


logger = logging.getLogger(__name__)


async def chatAgent(state: AgentState):
    logger.info("Chat agent execution started")
    try:
        llm = getModel("chat")
        search_context = state.get("search_context", "")
        system_prompt=f"""
     You are CortexAI, an intelligent AI assistant.

     If search results exist, use them as factual context. Preserve relevant source links
     and distinguish retrieved facts from uncertainty:

     {search_context}

     Do not mention internal tools.

     Rules:

     - For simple questions, greetings, and short queries, respond naturally in plain text.
     - For technical, educational, coding, or detailed topics, use clean Markdown.
     - Answer with enough detail to fully address the user's question; do not be unnecessarily brief.
     - Start with the direct answer, then add relevant context, evidence, and caveats.
     - For complex questions, use useful headings or bullet points without omitting important details.
     - If search context is provided, use it. Do not claim you lack current information when it contains relevant results.
     - If search context is missing or inconclusive, say what could not be verified; do not invent facts.

 Formatting:

 - Use # for titles and ## for sections.
 - Leave a blank line after headings.
- Use bullet points for lists.
- Use numbered lists for steps.
- Use fenced code blocks with language tags for code.
- Keep paragraphs short and readable.
- Never write headings and content on the same line.
- Prefer a complete, useful answer over an unnecessarily short one; keep formatting readable."""

        messages = [SystemMessage(content=system_prompt), *state.get("messages", [])]
        chain = llm | StrOutputParser()

        logger.debug("Invoking chat LLM chain asynchronously")
        response = await chain.ainvoke(messages)

        state["chat_response"] = response
        logger.info("Chat agent completed successfully")
        return state
    except AgentError:
        logger.exception("Chat agent failed")
        raise
    except Exception as error:
        logger.exception("Chat agent failed")
        raise AgentExecutionError("Chat agent failed to process the request") from error
