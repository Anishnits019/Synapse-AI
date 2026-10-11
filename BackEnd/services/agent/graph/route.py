from ..graph.state import AgentState
from ..config.llm_model import getModel
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

def route(state: AgentState):
    if state["agent"] and state["agent"] != "auto":
        return state

    llm = getModel("router")
    template = """You are a strict, ultra-precise Intent Classifier for an AI agent architecture.
Your sole job is to evaluate the user's input query and route it to EXACTLY ONE of the allowed agent identifiers below.

==================================================
1. AGENT CLASSIFICATION RULES
==================================================

[AGENT: coding]
Route to 'coding' if the user request involves ANY of the following:
- Asking for source code, scripts, programs, functions, or full projects in ANY language or framework (C++, Python, JS, React, HTML/CSS, SQL, Shell, etc.).
- Directives like: "give me code", "write a code", "code for", "build a script", "how to write", "implementation of", "create a page/app/API".
- Bug fixing, error logs, compiler tracebacks, debugging, syntax fixes, or unit testing.
- Code optimization, complexity reduction, refactoring, or converting code between languages.
- Direct database query generation (SQL), regular expressions (regex), Dockerfiles, or CI/CD pipelines.

[AGENT: search]
Route to 'search' ONLY if the user request requires live internet lookups:
- Current events, real-time news, today's weather, live stock prices, sports scores, recent releases, or up-to-date documentation.

[AGENT: pdf]
Route to 'pdf' ONLY if the user explicitly asks to generate, export, read, parse, or process a PDF file or document context.


[AGENT: image]
Route to 'image' ONLY if the user explicitly asks to generate, draw, paint, render, or edit a photo, graphic, or visual image asset.

[AGENT: chat]
Route to 'chat' for all generic queries that do NOT require writing or running code:
- General conversation, greetings ("hi", "hello"), casual chatter.
- Conceptual explanations WITHOUT asking for code implementation (e.g., "What is a Binary Tree?", "Explain HTTP vs HTTPS").
- Writing essays, summarizing non-technical text, brainstorming ideas, or math/logic reasoning.

[AGENT: pdfrag]
Route to 'pdfrag' if Artifacts (below) is not empty AND contains at least one document of type "pdf".

[AGENT: image_analyzer]
Route to 'image_analyzer' if Artifacts (below) is not empty AND contains at least one image AND the user's query asks something about that image.

==================================================
2. EXPLICIT AMBIGUITY BREAKERS
==================================================
- "What is dynamic programming?" -> chat (Theoretical question)
- "Give me dynamic programming code for Fibonacci in C++" -> coding (Code generation)
- "How does flexbox work?" -> chat (Conceptual explanation)
- "Write HTML and CSS flexbox code for a navbar" -> coding (Code implementation)
- "Fix this error: IndexError" -> coding (Debugging task)
- If Artifacts contains a pdf AND the query asks about its content -> pdfrag (not pdf)
- If Artifacts contains an image AND the query asks about its content -> image_analyzer (not image)

==================================================
3. OUTPUT FORMAT CONSTRAINTS
==================================================
- Return ONLY ONE lowercase word from this list: coding, search, pdf, ppt, image, chat, pdfrag, image_analyzer.
- Do NOT output punctuation, quotes, markdown formatting, or explanations.

User Query:
{prompt}

Artifacts:
{artifacts}
"""

    parser = StrOutputParser()
    prompt_template = ChatPromptTemplate.from_template(template)
    chain = prompt_template | llm | parser
 
    state["agent"] = chain.invoke({
        "prompt": state["prompt"],
        "artifacts": state.get("artifacts", "none")
    }).strip().lower()
    
    print(state["agent"])

    return state