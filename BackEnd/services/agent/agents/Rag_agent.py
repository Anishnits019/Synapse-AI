from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from ..config.llm_model import getModel
from ..config.memory import getMemory
from ..config.vectordb import search_documents
from ..exception import AgentError, AgentExecutionError
from ..graph.state import AgentState
from ..logger import logging


logger = logging.getLogger(__name__)


async def RagAgent(state: AgentState):
    logger.info("RAG agent execution started")
    try:
        llm = getModel("pdf")
        question = state.get("prompt", "")
        documents = await search_documents(question)
        context = "\n\n".join(document.page_content for document in documents)

        messages = [SystemMessage(content=(
                "Answer the question using only the document context below. "
                "If the answer is not in the context, say that the uploaded "
                "documents do not contain the answer. Do not invent facts.\n\n"
                f"Document context:\n{context}"
            ))]

        history = await getMemory(state["conversationID"])
        for message in history:
            content = message.get("content", "")
            if message.get("role") == "user" and content:
                messages.append(HumanMessage(content=content))
            elif message.get("role") == "assistant" and content:
                messages.append(AIMessage(content=content))

        if not (
            isinstance(messages[-1], HumanMessage)
            and messages[-1].content == question
        ):
            messages.append(HumanMessage(content=question))

        response = await llm.ainvoke(messages)
        state["chat_response"] = response.content
        logger.info("RAG agent completed successfully")
        return state
    except AgentError:
        logger.exception("RAG agent failed")
        raise
    except Exception as error:
        logger.exception("RAG agent failed")
        raise AgentExecutionError("RAG agent failed to process the request") from error
