"""AI assistant plumbing: OpenAI-compatible client, tool-using agent loop, key storage, presets.

Standard library only (plus numpy values being accepted in tool results), so it
works offline with local servers such as Ollama, LM Studio, vLLM, llama.cpp
and Xinference as well as with hosted OpenAI-compatible APIs.

Typical use from a GUI service (in a worker thread)::

    from avas.ai import Agent, ProviderConfig, Tool, get_secret

    cfg = ProviderConfig(base_url="http://localhost:11434/v1", model="qwen2.5:14b",
                         api_key=get_secret("ollama", env_fallback=False))
    agent = Agent(cfg, tools, system_prompt, emit=push_event_to_page)
    history = agent.run(history, "Plot the beam envelope", stop_event)
"""
from avas.ai.agent import (Agent, FINAL_ANSWER_PROMPT, PROMPTED_TOOLS_HEADER, Tool, ToolContext, ToolError,
                           estimate_tokens, history_to_text_protocol, prompted_tools_prompt, shrink_history)
from avas.ai.client import (ERROR_KINDS, TOOL_MODES, ChatClient, LLMError, ProviderConfig, mask_secret,
                            normalize_base_url, parse_tool_arguments)
from avas.ai.presets import PRESETS, get_preset
from avas.ai.secrets import backend_name, delete_secret, get_secret, set_secret

__all__ = [
    "Agent", "Tool", "ToolContext", "ToolError", "PROMPTED_TOOLS_HEADER", "FINAL_ANSWER_PROMPT",
    "estimate_tokens", "history_to_text_protocol", "prompted_tools_prompt", "shrink_history",
    "ChatClient", "LLMError", "ProviderConfig", "ERROR_KINDS", "TOOL_MODES", "mask_secret",
    "normalize_base_url", "parse_tool_arguments",
    "PRESETS", "get_preset",
    "get_secret", "set_secret", "delete_secret", "backend_name",
]
