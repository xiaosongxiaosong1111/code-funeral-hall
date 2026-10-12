---
inclusion: always
---

# 项目结构

```text
.kiro/
  hooks/                         Kiro v1 事件触发配置
  skills/code-undertaker/        按需加载的葬礼工作流和领域知识
  specs/code-funeral-hall/       需求、设计和可执行任务
  steering/                      始终生效的产品与工程约束
data/
  cemetery.json                  本地墓园状态，不含源码
demo-src/                        唯一允许进行删除演示的夹具
docs/
  AI-HANDOFF.md                  换机或交给另一个 AI 时的完整接手说明
  KIRO-DEMO-GUIDE.md             实操和录屏指南
  VIDEO-SCRIPT.md                4 分钟逐镜头参赛台词
index.html / app.js / styles.css 静态页面源文件
scripts/
  cemetery.mjs                   纯领域逻辑
  undertaker.mjs                 bury/settle 命令入口
  build.mjs                      静态构建
  serve.mjs                      本地演示服务
  validate-project.mjs           项目契约检查
tests/                           node:test 测试和不受演示删除影响的固定夹具
```

## 归属规则

- 状态计算、路径过滤和墓碑合并放在 `scripts/cemetery.mjs`。
- Git、文件系统和测试进程编排放在 `scripts/undertaker.mjs`。
- Hook JSON 只描述触发器和命令，不复制领域逻辑。
- 页面只消费墓园 JSON，不直接执行 Git 或 Node 命令。
- 参赛流程写入 `docs/KIRO-DEMO-GUIDE.md`，跨设备和跨 AI 交接写入 `docs/AI-HANDOFF.md`，不要把操作说明塞进运行代码。
- 演示夹具不得被真实产品模块导入；本项目本身只用它制造受控回归。

## 命名

- JavaScript 模块使用 `.mjs` 和小写连字符文件名。
- 测试文件以 `.test.mjs` 结尾。
- Hook 文件名描述动作和触发时机，如 `bury-on-delete.json`。
- 墓碑状态固定为 `pending`、`resurrected`、`resting`，不要添加同义状态。
