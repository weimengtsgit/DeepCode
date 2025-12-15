# DeepCode MCP 通信问题完整修复记录

## 问题描述

在界面上传文件并点击"开始processing"后，出现以下错误：
```
[ERROR] mcp_agent.mcp.mcp_agent_client_session - send_request failed:
[ERROR] mcp_agent.mcp.mcp_connection_manager - bocha-mcp: Lifecycle task encountered an error: unhandled errors in a TaskGroup (1 sub-exception)
```

## 根本原因

**版本不兼容问题**：项目使用了非常旧的 `mcp-agent 0.0.9`，与最新的 `mcp 1.23.1` 包存在严重的兼容性问题。

## 诊断过程

### 1. 初步测试
- ✅ bocha-mcp服务器能正常启动
- ✅ bocha-mcp服务器能正确响应标准MCP协议的initialize请求
- ❌ mcp-agent客户端在send_request时失败

### 2. 版本检查
```bash
# 发现问题
mcp-agent: 0.0.9 (非常旧的版本)
mcp: 1.23.1 (最新版本)
mcp-agent最新版本: 0.2.6
```

### 3. 测试验证
创建了底层MCP stdio通信测试，确认：
- 服务器端完全正常
- 问题出在mcp-agent客户端会话处理

## 解决方案

升级 mcp-agent 到最新版本：

```bash
pip install --upgrade mcp-agent
```

升级后版本：
- mcp-agent: 0.0.9 → **0.2.6** ✅
- mcp: 1.23.1 (保持不变)

## 验证结果

升级后测试通过：
```
✅ SUCCESS: bocha-mcp server is working correctly!
✅ Tools retrieved: 2
   - bocha-mcp_bocha_web_search
   - bocha-mcp_bocha_ai_search
```

## 之前的修复（仍然有效）

### 1. 配置文件路径问题 (已修复)
- 创建 `utils/config_path.py` - 使用绝对路径解析配置文件
- 更新所有MCP服务器路径为绝对路径

### 2. FastMCP API更新 (已修复)
- 将 `prompt=` 改为 `instructions=` 参数

## 最终文件修改列表

### 新建文件
1. `utils/config_path.py` - 配置路径工具

### 修改文件
1. `mcp_agent.config.yaml` - 所有服务器路径改为绝对路径
2. `tools/bocha_search_server.py` - FastMCP API更新
3. `workflows/agent_orchestration_engine.py` - 使用配置路径工具
4. `utils/llm_utils.py` - 使用配置路径工具
5. `requirements.txt` - (应该pin版本，见下方)

## 重要建议

### 更新 requirements.txt

建议将 requirements.txt 更新为：
```
aiofiles>=0.8.0
aiohttp>=3.8.0
anthropic
asyncio-mqtt
docling
google-genai
mcp-agent>=0.2.6  # 指定最低版本，避免安装旧版本
mcp>=1.20.0       # 确保mcp版本兼容
mcp-server-git
nest_asyncio
openai
pathlib2
PyPDF2>=2.0.0
reportlab>=3.5.0
streamlit
```

### 安装命令

对于新环境安装：
```bash
# 1. 激活虚拟环境
source .venv/bin/activate

# 2. 安装依赖
pip install -r requirements.txt

# 3. 验证关键包版本
pip list | grep -E "mcp-agent|^mcp"
# 应该看到:
# mcp-agent    0.2.6 (或更高)
# mcp          1.23.1 (或更高)
```

## 使用方法

现在可以正常使用DeepCode：

```bash
# 1. 激活虚拟环境
source .venv/bin/activate

# 2. 启动UI
streamlit run ui/streamlit_app.py

# 3. 上传文件并处理
# 应该能看到正常的处理流程和bocha-mcp搜索功能
```

## 预期日志输出

正常运行时的日志：
```
🔍 Using search server: bocha-mcp
[INFO] Creating persistent connection to server: bocha-mcp
[INFO] bocha-mcp: Up and running with a persistent connection!
[INFO] Connected to bocha-mcp
[INFO] Tools loaded: bocha_web_search, bocha_ai_search
```

## 问题总结

这次遇到的问题是一个典型的**依赖版本管理**问题：

1. **问题表现**: 模糊的错误消息 (`send_request failed:` 后面为空)
2. **真实原因**: 版本不兼容导致的底层协议通信失败
3. **解决方法**: 升级到兼容的最新版本
4. **预防措施**: 在requirements.txt中明确指定最低版本要求

## 修复日期
2025-12-10

## 状态
✅ 完全解决并验证通过
