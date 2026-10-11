from ..graph.state import AgentState
from ..config.llm_model import getModel
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from ..config.memory import getMemory
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

async def chatAgent(state:AgentState):
     llm =getModel("chat")
     search_context = state.get("search_context", "")

     history=await getMemory(state["conversationID"])

     system_prompt=f"""
     You are CortexAI, an intelligent AI assistant.

     If search results exist, use them as factual context:

     {search_context}

     Do not mention internal tools.


     Rules:

     - For simple questions, greetings, and short queries, respond naturally in plain text.
     - For technical, educational, coding, or detailed topics, use clean Markdown.


 Formatting:

- Use # for titles and ## for sections.
 - Leave a blank line after headings.
- Use bullet points for lists.
- Use numbered lists for steps.
- Use fenced code blocks with language tags for code.
- Keep paragraphs short and readable.
- Never write headings and content on the same line.
- Never generate large walls of text."""

     messages=[SystemMessage(content=system_prompt)]

     for msg in history:
          if msg["role"]=="user":
               messages.append(HumanMessage(content=msg["content"]))
          elif msg["role"]=="assistant":
               messages.append(AIMessage(content=msg["content"]))
     
     current_prompt = state["prompt"]
     if not (
          isinstance(messages[-1], HumanMessage)
          and messages[-1].content == current_prompt
     ):
          messages.append(HumanMessage(content=current_prompt))


     chain = llm | StrOutputParser()

     response = await chain.ainvoke(messages)

     state["chat_response"] = response

     return state
