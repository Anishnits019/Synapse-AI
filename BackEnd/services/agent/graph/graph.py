from langgraph.graph import StateGraph, START, END
from .state import AgentState
from .route import route
from ..agents.imageGen_agent import imageGenAgent
from ..agents.chat_agent import chatAgent
from ..agents.coding_agent import codingAgent
from ..agents.pdf_agent import pdfAgent
from ..agents.Rag_agent import RagAgent
from ..agents.imageAnalyzer_agent import ImageAnayzer
from langgraph.prebuilt import ToolNode,tools_condition
from ..agents.search_agent import searchAgent, tavily_tool
search_tool=[tavily_tool]

workflow = StateGraph(AgentState)

workflow.add_node("router", route)
workflow.add_node("chat_agent", chatAgent)
workflow.add_node("search_agent", searchAgent) 
workflow.add_node("coding_agent", codingAgent)
workflow.add_node("image_agent", imageGenAgent)
workflow.add_node("pdf_agent", pdfAgent)
workflow.add_node("rag_agent",RagAgent)
workflow.add_node("image_analyzer_agent",ImageAnayzer)

workflow.add_node("search_tool",ToolNode(search_tool))


# This node is added with tools called ToolNode because it has all tools which id required for agent to execute so 

workflow.add_edge(START, "router")

def routing_logic(state: AgentState):
    agent_choice = state.get("agent")
    if agent_choice in [
        "chat",  # Fixed missing comma
        "pdf",
        "rag",
        "pdfrag",
        "search",
        "vision",
        "image",
        "image_analyzer",
        "coding",
    ]:
        return agent_choice
    return "chat"

workflow.add_conditional_edges(
    "router",
    routing_logic,
    {
        "chat": "chat_agent",
        "pdf": "pdf_agent",
        "rag": "rag_agent",
        "pdfrag": "rag_agent",
        "search": "search_agent",
        "vision": "image_analyzer_agent",
        "image": "image_agent",
        "image_analyzer": "image_analyzer_agent",
        "coding": "coding_agent"
    }
)
# This node is from returnig from tools to search agent return its results
# we track the messages state in AgentState completely end to edn such that i can use different functinlaity to get the emssages adn use toolNode os

workflow.add_conditional_edges(
    "search_agent",
    tools_condition, 
    # this is a standard langgraph function which takes function for the "messages state" and there it find the tool message than allows tool to execute its functionality
    {
        "tools":"search_tool",
         END:"chat_agent"
    },
)

workflow.add_edge("search_tool","search_agent")
workflow.add_edge("rag_agent", END)
workflow.add_edge("chat_agent", END)
workflow.add_edge("pdf_agent", END)
workflow.add_edge("image_agent", END)
workflow.add_edge("coding_agent", END)
workflow.add_edge("image_analyzer_agent", END)


graph = workflow.compile()