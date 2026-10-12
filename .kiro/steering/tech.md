---
inclusion: always
---

# 技术约束

## 技术栈

- Node.js 20+，ES Modules。
- Node.js 标准库和 `node:test`；不要为少量逻辑增加依赖。
- HTML、CSS、浏览器原生 JavaScript/SVG；页面为静态产物。
- Git 提供删除事实与历史元数据。
- `data/cemetery.json` 是页面读取的唯一运行数据源。

## 常用命令

- `npm test`：运行全部自动化测试。
- `npm run validate`：检查项目、Hook 和公开数据约束。
- `npm run build`：校验墓园字段并生成强制标为回放模式的静态发布产物。
- `npm run dev`：启动本地演示服务。
- `npm run funeral:bury`：调试墓碑登记；正式证据应由 Hook 触发。
- `npm run funeral:settle`：调试测试裁定；正式证据应由 Hook 触发。

## 实现原则

- 保持依赖为零；优先使用已有模块和平台能力。
- 领域转换使用纯函数和新对象，不原地修改墓园文档。
- 文件写入使用临时文件后原子替换。
- 子进程使用程序名和参数数组，不拼接不可信路径形成 Shell 命令。
- 测试失败可代表合法的 `resurrected` 领域状态；仍必须记录可诊断摘要。
- 任何新分支、解析或状态转换都需要一个小而有意义的测试。
