from dotenv import find_dotenv, load_dotenv
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_tavily import TavilySearch

from ..config.llm_model import getModel
from ..config.memory import getMemory
from ..graph.state import AgentState

load_dotenv(find_dotenv())

tavily_tool = TavilySearch(
    max_results=2,
    topic="general",
    search_depth="advanced",
    include_images=True,
)

SEARCH_SYSTEM_PROMPT = """You are CortexAI, an intelligent AI assistant.
Use search results to answer accurately and do not mention internal tools.
For technical or detailed topics, use clean Markdown with headings, bullets,
and fenced code blocks where useful. Keep responses concise.
If search results include relevant image URLs, embed them with Markdown."""


async def searchAgent(state: AgentState):
    llm = getModel("search")
    llm_with_tools = llm.bind_tools([tavily_tool])
    messages = [SystemMessage(content=SEARCH_SYSTEM_PROMPT)]

    history = await getMemory(state["conversationID"])
    for message in history:
        content = message.get("content", "")
        if message.get("role") == "user" and content:
            messages.append(HumanMessage(content=content))
        elif message.get("role") == "assistant" and content:
            messages.append(AIMessage(content=content))

    current_prompt = state.get("prompt", "")
    if not (
        isinstance(messages[-1], HumanMessage)
        and messages[-1].content == current_prompt
    ):
        messages.append(HumanMessage(content=current_prompt))

    ai_response = await llm_with_tools.ainvoke(messages)
    state["messages"] = [ai_response]

    if not getattr(ai_response, "tool_calls", None):
        state["chat_response"] = ai_response.content
        state["search_context"] = ai_response.content

    return state
