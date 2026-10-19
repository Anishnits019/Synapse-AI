import json

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from ..config.llm_model import getModel
from ..config.memory import getMemory
from ..exception import AgentError, AgentExecutionError, AgentResponseError
from ..graph.state import AgentState
from ..logger import logging


logger = logging.getLogger(__name__)


INTENT_SYSTEM_PROMPT = """You are an ultra-precise software engineering intent classifier. 
Your task is to analyze the user request and categorize it into exactly one of these categories:
- CODE_GENERATION
- CODE_REVIEW
- CODE_EXPLANATION
- DEBUGGING
- OPTIMIZATION
- CONVERSION
- DOCUMENTATION

CRITICAL RULES:
1. Output ONLY the exact category name in uppercase.
2. Do NOT include markdown formatting, backticks, punctuation, explanations, or conversational filler.
3. If the request spans multiple categories, choose the primary action requested."""

CODE_GENERATION_SYSTEM_PROMPT = """You are CortexAI Elite Principal Code Generation Agent.
Generate clean, production-ready, secure, and robust code based on the user's request.

CRITICAL OUTPUT CONSTRAINTS:
1. Return ONLY a single, valid raw JSON object. 
2. ABSOLUTELY NO MARKDOWN CODE FENCES (e.g., do not use ```json or ```).
3. Do not include any introductory or concluding conversational text.
4. The output must strictly match this exact JSON schema:
{
  "files": [
    {
      "name": "filename.ext",
      "content": "Full source code with proper escaping for strings and newlines"
    }
  ]
}

STRICT ARCHITECTURE RULES:
- For explicitly requested frameworks/languages, use that exact stack.
- For non-web languages, generate only the required source files.
- For general web apps without a specified stack, generate index.html, style.css, and script.js."""

GENERAL_CODING_SYSTEM_PROMPT = """You are CortexAI Senior Code Reviewer and Technical Mentor.
Provide a clear, highly professional engineering analysis using clean Markdown only.

CRITICAL RULES:
1. Do NOT return raw project JSON or file artifacts.
2. Structure your response logically using clear headings (##) and bullet points.
3. Always include corrected, production-grade code snippets inside fenced code blocks with proper language tags (e.g., ```python) when addressing bugs or optimizations.
4. Keep explanations concise, direct, and actionable. Avoid fluff."""


async def codingAgent(state: AgentState):
    logger.info("Coding agent execution started")
    try:
        llm = getModel("coding")
        user_prompt = state.get("prompt", "")

        intent_response = await llm.ainvoke([
            SystemMessage(content=INTENT_SYSTEM_PROMPT),
            HumanMessage(content=user_prompt),
        ])
        intent = getattr(intent_response, "content", "").strip().upper()
        state["intent"] = intent

        history = await getMemory(state["conversationID"])
        conversation_messages = []

        for message in history:
            content = message.get("content", "")
            if not content:
                continue
            if message.get("role") == "user":
                conversation_messages.append(HumanMessage(content=content))
            elif message.get("role") == "assistant":
                conversation_messages.append(AIMessage(content=content))

        if not conversation_messages or not (
            isinstance(conversation_messages[-1], HumanMessage)
            and conversation_messages[-1].content == user_prompt
        ):
            conversation_messages.append(HumanMessage(content=user_prompt))

        if intent == "CODE_GENERATION":
            response = await llm.ainvoke([
                SystemMessage(content=CODE_GENERATION_SYSTEM_PROMPT),
                *conversation_messages,
            ])
            content = getattr(response, "content", "").strip()

            try:
                data = json.loads(content)
            except json.JSONDecodeError as error:
                raise AgentResponseError(
                    "Coding model returned invalid JSON for generated files"
                ) from error

            if not isinstance(data, dict) or not isinstance(data.get("files"), list):
                raise AgentResponseError(
                    "Coding model response must contain a files list"
                )

            artifacts = []
            for item in data["files"]:
                if (
                    not isinstance(item, dict)
                    or not isinstance(item.get("name"), str)
                    or not isinstance(item.get("content"), str)
                ):
                    raise AgentResponseError(
                        "Each generated file must include a string name and content"
                    )
                artifacts.append({
                    "name": item["name"],
                    "content": item["content"],
                })

            if not artifacts:
                raise AgentResponseError(
                    "Coding model returned no generated files"
                )

            state["artifacts"] = artifacts
            state["chat_response"] = "Generated: " + ", ".join(
                artifact["name"] for artifact in artifacts
            )
        else:
            response = await llm.ainvoke([
                SystemMessage(content=GENERAL_CODING_SYSTEM_PROMPT),
                HumanMessage(content=f"Task intent: {intent}"),
                *conversation_messages,
            ])
            state["chat_response"] = getattr(response, "content", "").strip()
            state["artifacts"] = []

        logger.info("Coding agent completed successfully")
        return state
    except AgentError:
        logger.exception("Coding agent failed")
        raise
    except Exception as error:
        logger.exception("Coding agent failed")
        raise AgentExecutionError(
            "Coding agent failed to process the request"
        ) from error
