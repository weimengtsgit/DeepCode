# DeepCode 配置文件路径完整修复记录

## 问题历史

在DeepCode项目的开发和部署过程中，遇到了一系列由于**相对路径配置**导致的问题。所有这些问题的根本原因都是：在不同的运行环境（CLI、Streamlit UI、不同工作目录）中，相对路径无法正确解析。

## 修复概览

### 核心解决方案

创建了统一的配置路径管理工具：`utils/config_path.py`

此工具提供：
- 自动查找项目根目录（通过标记文件）
- 返回配置文件的绝对路径
- 支持所有配置文件类型

### 修复的问题列表

#### 问题 1: mcp_agent.config.yaml 找不到
**错误**: `⚠️ Config file mcp_agent.config.yaml not found, using default: brave`

**影响文件**:
- `workflows/agent_orchestration_engine.py`
- `utils/llm_utils.py`

**状态**: ✅ 已修复

---

#### 问题 2: MCP服务器路径问题
**错误**: `[Errno 2] No such file or directory: '.venv/bin/python'`

**根因**: 所有MCP服务器配置使用相对路径

**修复**:
- 创建并运行 `fix_mcp_paths.py` 脚本
- 将所有服务器的Python解释器路径改为绝对路径
- 更新8个MCP服务器配置

**状态**: ✅ 已修复

---

#### 问题 3: FastMCP API不兼容
**错误**: `TypeError: FastMCP.__init__() got an unexpected keyword argument 'prompt'`

**修复**: 将 `prompt=` 改为 `instructions=`

**状态**: ✅ 已修复

---

#### 问题 4: mcp-agent版本过旧
**错误**: `send_request failed` (无详细错误信息)

**根因**: mcp-agent 0.0.9 与 mcp 1.23.1 不兼容

**修复**: 升级 mcp-agent 到 0.2.6

**状态**: ✅ 已修复

---

#### 问题 5: mcp_agent.secrets.yaml 找不到
**错误**: `Failed to load API config: [Errno 2] No such file or directory: 'mcp_agent.secrets.yaml'`

**影响文件**:
- `workflows/code_implementation_workflow.py`
- `workflows/code_implementation_workflow_index.py`
- `workflows/codebase_index_workflow.py`
- `workflows/agent_orchestration_engine.py`
- `tools/code_indexer.py`

**状态**: ✅ 已修复（本次）

---

## 完整修改文件列表

### 新建文件
1. **utils/config_path.py** - 配置路径管理工具
   - `get_project_root()` - 获取项目根目录
   - `get_config_path()` - 获取配置文件绝对路径
   - `get_secrets_path()` - 获取secrets文件绝对路径

### 修改文件

#### 配置文件
1. **mcp_agent.config.yaml**
   - 所有MCP服务器路径改为绝对路径
   - Python解释器路径
   - 工具脚本路径
   - PYTHONPATH环境变量

2. **requirements.txt**
   - 添加版本限制：`mcp-agent>=0.2.6`
   - 添加版本限制：`mcp>=1.20.0`

#### 工具文件
3. **tools/bocha_search_server.py**
   - FastMCP API更新（prompt → instructions）

4. **tools/code_indexer.py**
   - 添加导入：`from utils.config_path import get_secrets_path, get_config_path`
   - 修改 `__init__` 默认参数：`config_path=None`
   - 添加绝对路径处理逻辑

#### 工作流文件
5. **workflows/agent_orchestration_engine.py**
   - 添加导入：`from utils.config_path import get_config_path`
   - 修改 `get_default_search_server` 使用绝对路径
   - 修改 `run_codebase_indexing` 调用传入 `None`

6. **workflows/code_implementation_workflow.py**
   - 添加导入：`from utils.config_path import get_secrets_path, get_config_path`
   - 修改 `__init__` 默认参数：`config_path=None`
   - 添加绝对路径处理逻辑
   - 修改 `get_default_models()` 调用

7. **workflows/code_implementation_workflow_index.py**
   - 添加导入：`from utils.config_path import get_secrets_path, get_config_path`
   - 修改 `__init__` 默认参数：`config_path=None`
   - 添加绝对路径处理逻辑
   - 修改 `get_default_models()` 调用

8. **workflows/codebase_index_workflow.py**
   - 添加导入：`from utils.config_path import get_secrets_path`
   - 修改 `run_indexing_workflow` 参数：`config_path=None`
   - 修改 `run_codebase_indexing` 函数参数：`config_path=None`
   - 添加绝对路径处理逻辑

#### 工具函数文件
9. **utils/llm_utils.py**
   - 添加导入：`from utils.config_path import get_config_path, get_secrets_path`
   - 更新所有函数默认参数：`config_path=None`
   - 修复的函数：
     - `get_preferred_llm_class()`
     - `get_token_limits()`
     - `get_default_models()`
     - `get_document_segmentation_config()`
     - `should_use_document_segmentation()`

## 统一的路径处理模式

所有需要读取配置文件的地方现在都遵循这个模式：

```python
from utils.config_path import get_config_path, get_secrets_path

def some_function(config_path: str = None):
    # Use absolute path if not provided
    if config_path is None:
        config_path = get_config_path()  # 或 get_secrets_path()

    # 然后正常使用 config_path
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
```

## 验证步骤

修复完成后的验证：

```bash
# 1. 检查所有包版本
pip list | grep -E "mcp-agent|^mcp"
# 期望输出:
# mcp-agent    0.2.6
# mcp          1.23.1

# 2. 测试配置路径工具
python utils/config_path.py
# 期望输出:
# Project Root: /path/to/DeepCode
# Config Path: /path/to/DeepCode/mcp_agent.config.yaml
# Config exists: True

# 3. 启动应用
source .venv/bin/activate
streamlit run ui/streamlit_app.py

# 4. 上传文件并测试
# 应该能正常工作，不再出现文件找不到的错误
```

## 预期正常日志

修复后，应用运行时的日志应该类似：

```
🚀 Initializing intelligent multi-agent research orchestration system
📁 Working environment: local
✅ Workspace status: ready
🔍 Using search server: bocha-mcp
[INFO] bocha-mcp: Up and running with a persistent connection!
[INFO] Tools loaded: bocha_web_search, bocha_ai_search
⚡ Using standard code implementation workflow (fast mode)...
[INFO] Code implementation workflow initialized
✅ All systems ready
```

## 关键经验教训

1. **永远使用绝对路径** - 在多环境部署的应用中，相对路径是不可靠的
2. **统一配置管理** - 创建中心化的配置路径工具
3. **版本锁定** - 在 requirements.txt 中明确指定最低版本
4. **全面测试** - 在不同工作目录下测试应用
5. **错误处理** - 提供清晰的错误消息，便于调试

## 修复日期
2025-12-10

## 修复状态
✅ 所有路径问题已完全解决

## 相关文档
- `BUGFIX_MCP_SERVER.md` - MCP服务器路径修复记录
- `BUGFIX_MCP_COMMUNICATION.md` - MCP通信问题修复记录
- `BUGFIX_CONFIG_PATH_COMPLETE.md` - 本文档（完整路径修复记录）
