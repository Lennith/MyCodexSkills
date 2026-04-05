# TemplateAgent Static Workspace

这个目录是可直接复制使用的静态模板工作区，不依赖外部 EasyAgentTeam 仓库路径。

## 快速开始

1. 先完成目标、角色、skill 导入、ID、workflow 结构的计划对齐。
2. 如果包含 workflow，先给出 Markdown Mermaid 流程图并得到确认。
3. 在 `bundles/submitted.bundle.json` 写入你的模板内容。
4. 执行：

```powershell
node .agent-tools/scripts/template_bundle_guard.mjs check
node .agent-tools/scripts/template_bundle_guard.mjs publish
```

5. 查看结果：
- `reports/template-guard/last_check.json|md`
- `reports/template-guard/last_publish.json|md`

## 说明

- `publish` 只做注册，不会自动启动 run。
- 如果 `skills/` 目录暂时为空，guard 会跳过本地 skill import，等你放入真实 skill 包后再导入。
- 如果后端地址不是默认值，编辑 `.agent-tools/config.json` 或在命令中传 `--base-url`。
