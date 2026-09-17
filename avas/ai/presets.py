"""Provider presets for the AI assistant.

Every entry describes one OpenAI-compatible endpoint the settings dialog can
offer.  Only data lives here: the client treats every provider the same way
(``POST {base_url}/chat/completions``), so adding a provider is one dict.

Fields
------
``id``            stable identifier stored in the user's settings
``label``         display name (product names are not translated)
``base_url``      documented OpenAI-compatible base URL (already ends in the
                  API version segment, e.g. ``/v1``); empty for "custom"
``needs_key``     whether an API key is required
``local``         runs on the user's machine (no key, loopback, no proxy)
``example_model`` a model id that usually exists, used as a placeholder only
``notes``         ``(english, chinese)`` hint shown under the form
"""

PRESETS = [
    # ------------------------------------------------------------------ local servers
    {
        "id": "ollama",
        "label": "Ollama",
        "base_url": "http://localhost:11434/v1",
        "needs_key": False,
        "local": True,
        "example_model": "qwen2.5:14b",
        "notes": (
            "Start Ollama and pull a model first (ollama pull qwen2.5:14b). Tool calling needs a model "
            "whose template supports tools (Qwen 2.5/3, Llama 3.1+, Mistral); otherwise AVAS falls back "
            "to prompted tool calls. Ollama's default context is small: raise num_ctx in the model or via "
            "OLLAMA_CONTEXT_LENGTH.",
            "请先启动 Ollama 并拉取模型（ollama pull qwen2.5:14b）。原生工具调用需要模板支持 tools 的模型"
            "（Qwen 2.5/3、Llama 3.1+、Mistral），否则 AVAS 自动改用提示词方式调用工具。Ollama 默认上下文较小，"
            "可在模型中设置 num_ctx 或设置环境变量 OLLAMA_CONTEXT_LENGTH。",
        ),
    },
    {
        "id": "lmstudio",
        "label": "LM Studio",
        "base_url": "http://localhost:1234/v1",
        "needs_key": False,
        "local": True,
        "example_model": "qwen2.5-14b-instruct",
        "notes": (
            "Load a model and start the local server in LM Studio (Developer tab, default port 1234).",
            "在 LM Studio 中加载模型并启动本地服务器（Developer 页，默认端口 1234）。",
        ),
    },
    {
        "id": "vllm",
        "label": "vLLM",
        "base_url": "http://localhost:8000/v1",
        "needs_key": False,
        "local": True,
        "example_model": "Qwen/Qwen2.5-14B-Instruct",
        "notes": (
            "Native tool calls need 'vllm serve ... --enable-auto-tool-choice --tool-call-parser hermes' "
            "(parser depends on the model); without them AVAS uses prompted tool calls. Enter the key if "
            "the server was started with --api-key.",
            "原生工具调用需要以 “vllm serve ... --enable-auto-tool-choice --tool-call-parser hermes” 启动"
            "（解析器取决于模型），否则 AVAS 使用提示词方式调用工具。若服务端使用了 --api-key，请填写密钥。",
        ),
    },
    {
        "id": "llamacpp",
        "label": "llama.cpp server",
        "base_url": "http://localhost:8080/v1",
        "needs_key": False,
        "local": True,
        "example_model": "default",
        "notes": (
            "Run llama-server with --jinja for native tool calls; the model name is ignored by the server.",
            "使用 --jinja 启动 llama-server 以支持原生工具调用；服务端会忽略模型名。",
        ),
    },
    {
        "id": "xinference",
        "label": "Xinference",
        "base_url": "http://localhost:9997/v1",
        "needs_key": False,
        "local": True,
        "example_model": "qwen2.5-instruct",
        "notes": (
            "Launch a model in Xinference first; use the model UID as the model name.",
            "请先在 Xinference 中启动模型，模型名填写模型 UID。",
        ),
    },
    # ------------------------------------------------------------------ hosted services
    {
        "id": "openai",
        "label": "OpenAI",
        "base_url": "https://api.openai.com/v1",
        "needs_key": True,
        "local": False,
        "example_model": "gpt-4o-mini",
        "notes": (
            "Create a key at platform.openai.com. Reasoning models may reject temperature; clear it if so.",
            "在 platform.openai.com 创建密钥。推理模型可能不接受 temperature 参数，报错时请清空该项。",
        ),
    },
    {
        "id": "deepseek",
        "label": "DeepSeek",
        "base_url": "https://api.deepseek.com/v1",
        "needs_key": True,
        "local": False,
        "example_model": "deepseek-chat",
        "notes": (
            "Models: deepseek-chat, deepseek-reasoner (reasoning is shown separately).",
            "可用模型：deepseek-chat、deepseek-reasoner（思考过程单独显示）。",
        ),
    },
    {
        "id": "dashscope",
        "label": "Qwen (DashScope)",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "needs_key": True,
        "local": False,
        "example_model": "qwen-plus",
        "notes": (
            "Alibaba Cloud Model Studio, OpenAI-compatible mode. International accounts use "
            "https://dashscope-intl.aliyuncs.com/compatible-mode/v1.",
            "阿里云百炼 OpenAI 兼容模式。国际站账号请使用 https://dashscope-intl.aliyuncs.com/compatible-mode/v1。",
        ),
    },
    {
        "id": "moonshot",
        "label": "Moonshot / Kimi",
        "base_url": "https://api.moonshot.cn/v1",
        "needs_key": True,
        "local": False,
        "example_model": "moonshot-v1-32k",
        "notes": (
            "Keys from platform.moonshot.cn; international accounts use https://api.moonshot.ai/v1.",
            "密钥在 platform.moonshot.cn 获取；国际站账号请使用 https://api.moonshot.ai/v1。",
        ),
    },
    {
        "id": "siliconflow",
        "label": "SiliconFlow",
        "base_url": "https://api.siliconflow.cn/v1",
        "needs_key": True,
        "local": False,
        "example_model": "Qwen/Qwen2.5-72B-Instruct",
        "notes": (
            "Keys from cloud.siliconflow.cn; model names include the organisation prefix.",
            "密钥在 cloud.siliconflow.cn 获取；模型名包含组织前缀。",
        ),
    },
    {
        "id": "zhipu",
        "label": "Zhipu GLM",
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "needs_key": True,
        "local": False,
        "example_model": "glm-4-plus",
        "notes": (
            "BigModel open platform; the OpenAI-compatible path is /api/paas/v4 (not /v1).",
            "智谱开放平台；OpenAI 兼容路径为 /api/paas/v4（不是 /v1）。",
        ),
    },
    {
        "id": "openrouter",
        "label": "OpenRouter",
        "base_url": "https://openrouter.ai/api/v1",
        "needs_key": True,
        "local": False,
        "example_model": "openai/gpt-4o-mini",
        "notes": (
            "Routes to many vendors; choose a model that lists tool support.",
            "可路由到多家模型厂商；请选择支持工具调用（tools）的模型。",
        ),
    },
    {
        "id": "custom",
        "label": "Custom",
        "base_url": "",
        "needs_key": False,
        "local": False,
        "example_model": "",
        "notes": (
            "Any OpenAI-compatible endpoint: enter the base URL up to and including the version segment "
            "(the part before /chat/completions). Azure OpenAI needs its full deployment URL plus an "
            "'api-key' header and an api-version query parameter.",
            "任意 OpenAI 兼容接口：填写 /chat/completions 之前的基础地址（包含版本段，如 /v1）。"
            "Azure OpenAI 需填写完整部署地址，并添加 api-key 请求头和 api-version 查询参数。",
        ),
    },
]

_BY_ID = {p["id"]: p for p in PRESETS}


def get_preset(preset_id):
    """Return the preset dict for *preset_id* (the "custom" preset if unknown)."""
    return _BY_ID.get(preset_id, _BY_ID["custom"])
