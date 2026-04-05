# MyCodexSkills

个人 Codex Skill 集合，用于增强 AI 助手的专业能力。

## Skill 列表

### code-slim-refactor

用于代码精简重构（收敛重构）的 Skill。当你需要对本地 Git 仓库进行显式的收敛导向重构时使用，支持以下场景：
- 代码瘦身（code slim）
- 精简重构（slim refactor / 收敛重构）
- 冗余代码移除（redundancy removal）
- 结构化简化（structured simplification）

提供两种工作模式：
- **quick**: 轻量级收敛，适用于范围明确的小型重构
- **strict**: 正式重构流程，包含完整的可追溯性和合并门控

### eat-template-builder

配合 [EasyAgentTeam](https://github.com/Lennith/EasyAgentTeam) 项目使用的模板构建工具。用于搭建和构建 EasyAgentTeam 模板包，功能包括：
- 从可复用工作空间脚手架创建模板
- 定义可复用的 Agent 和角色
- 构建工作流模板
- 导入 Skill 到模板包
- 验证和发布模板到 EasyAgentTeam 后端

遵循计划优先原则，在生成最终模板前需要与用户对齐规划，涉及工作流时需使用 Markdown Mermaid 流程图确认。
