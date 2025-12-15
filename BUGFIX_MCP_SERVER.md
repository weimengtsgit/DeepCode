# DeepCode MCP 服务器问题修复总结

## 问题描述
在界面上传文件后，日志显示：
```
❌ run_research_analyzer failed: bocha-mcp: Failed to initialize server; check logs for errors.
[Errno 2] No such file or directory: '.venv/bin/python'
```

## 根本原因

发现了两个主要问题：

### 1. 配置文件路径问题
**问题**: 所有读取 `mcp_agent.config.yaml` 的代码使用相对路径，在 Streamlit UI 环境中工作目录不一致导致找不到配置文件。

**修复**:
- 创建 `utils/config_path.py` 工具，自动查找项目根目录并返回配置文件的绝对路径
- 更新以下文件使用新的配置路径工具：
  - `workflows/agent_orchestration_engine.py`
  - `utils/llm_utils.py`

### 2. MCP 服务器路径问题
**问题**: `mcp_agent.config.yaml` 中所有 MCP 服务器配置使用相对路径 `.venv/bin/python`，导致在不同工作目录下启动时找不到 Python 解释器。

**修复**:
- 创建并运行 `fix_mcp_paths.py` 脚本，将所有相对路径转换为绝对路径
- 更新了 8 个服务器的配置：
  - bocha-mcp
  - brave
  - code-implementation
  - code-reference-indexer
  - command-executor
  - document-segmentation
  - file-downloader
  - github-downloader

### 3. FastMCP API 更新问题
**问题**: `tools/bocha_search_server.py` 使用了已废弃的 `prompt` 参数。

**修复**:
- 将 `FastMCP(name, prompt=...)` 改为 `FastMCP(name, instructions=...)`

## 修复后的文件

### 新建文件
1. `utils/config_path.py` - 配置文件路径解析工具

### 修改文件
1. `mcp_agent.config.yaml` - 所有 MCP 服务器路径改为绝对路径
2. `tools/bocha_search_server.py` - 修复 FastMCP API 调用
3. `workflows/agent_orchestration_engine.py` - 使用配置路径工具
4. `utils/llm_utils.py` - 使用配置路径工具

## 验证

修复后通过以下测试验证：
```bash
# 1. 测试配置路径工具
python utils/config_path.py
# ✅ 输出正确的项目根目录和配置文件路径

# 2. 测试 bocha-mcp 服务器启动
# ✅ 服务器成功启动并运行在 stdio 模式
```

## 使用方法

修复后，按以下步骤重新启动应用：

```bash
# 1. 激活虚拟环境
source .venv/bin/activate

# 2. 启动 Streamlit UI
streamlit run ui/streamlit_app.py

# 3. 上传文件测试
# 应该能看到正确的日志：
# 🔍 Using search server: bocha-mcp
# bocha-mcp: Up and running with a persistent connection!
```

## 预防措施

为避免类似问题再次发生：

1. **配置文件读取**: 始终使用 `utils/config_path.py` 中的工具函数获取配置文件路径
2. **MCP 服务器配置**: 使用绝对路径或确保相对路径从项目根目录解析
3. **API 兼容性**: 注意第三方库 API 变更，及时更新代码

## 日期
2025-12-10

## 状态
✅ 已解决并验证
