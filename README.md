# See the Forest Atlas for Obsidian

把当前 Obsidian 笔记库的真实链接网络交给 See the Forest Atlas 显示，在原生工作区中探索并打开笔记。
不需要见林 Vault 框架、Profile、Codex、网站构建、账号或网络服务。笔记不会被改写或上传。

## 产品名称与工程身份

用户安装的插件展示名是 **See the Forest Atlas**，其构建来源是本仓库
`seetheforest-obsidian-plugin`，不是 `seetheforest-atlas` 仓库直接导出的插件。

| 层次 | 名称或标识 | 职责 |
| --- | --- | --- |
| 插件工程 / `package.json.name` | `seetheforest-obsidian-plugin` | Obsidian 数据、命令、视图、设置、生命周期及最终插件构建 |
| 用户展示名 / `manifest.json.name` | `See the Forest Atlas` | 用户识别和启用插件时看到的名称 |
| 安装标识 / `manifest.json.id` | `seetheforest-atlas` | 插件身份与 `.obsidian/plugins/seetheforest-atlas/` 安装目录，不表示源码来源 |
| 上游组件仓库 / npm 依赖 | `seetheforest-atlas` / `@seetheforest/atlas` | 独立闭源的知识网络视觉、交互与计算系统 |

构建关系为：Atlas 仓库生成签名受保护依赖包，本插件工程消费该包并完成 Obsidian 适配，
再由本插件工程生成安装文件。展示名、安装标识与仓库名不要求相同，本次不修改这些配置。
插件版本与 Atlas 版本独立管理；Atlas 发布或 Blog 回归通过，不等于插件发布或 Obsidian 验收通过。
制品命名和双版本追溯见 [社区安装制品契约](docs/community-package.md)。

## 当前状态：开发候选，尚非可安装交付

2026-09-28 已建立源码、数据适配、视图、设置、测试及受保护制品构建门禁。
当前源码工作区仍锁定 Atlas 0.1.6，它是视觉与数据基线，但不含原生宿主接口，因此在本工作区运行 `npm run build` 仍会被拦截。
2026-09-30 已在独立副本（现位于本仓库 `artifacts/validation/obsidian-candidate-gates-20260929/consumer/`）中消费
已签名的 `0.1.7-obsidian.4-gates`，完成类型检查、22 项测试、构建和制品检查。
同包已通过固定 Blog 快照的 19 个场景、106 项行为、8 项视觉对照；部分强拖动仍超过 15 秒体验目标。
真实 Obsidian 实装尚未验收，正式依赖未升级，候选不是正式 Release，不能用于发行。
不得将类型检查、单元测试或网页预览称为插件交付成功。

2026-09-30 后续已完成社区安装三文件格式的源码适配：签名制品中的 Worker/Wasm 与插件布局
Worker 随 `main.js` 内嵌，运行时仅创建本地 Blob，不读取额外 `assets/` 或下载依赖。
三文件隔离验证见本仓库 `artifacts/validation/obsidian-community-package-20260930/`，不能视为已经获市场审核或真实实装通过。

目标是覆盖原生 Graph 的功能并保留 Atlas 体验。当前差距详见
[原生功能对照](docs/native-graph-parity.md)；这里没有把功能全集缩减成已经完成的 MVP。

## 工程职责

本工程是独立 Obsidian 插件产品，最终向社区插件市场提交本工程构建的版本。
官网、Blog 与本插件均消费独立闭源 Atlas 的正式 Release，不直接依赖 Atlas 源码。
插件构建将获许可的 Atlas 运行制品纳入安装包，不携带开发源码、Source Map 或私有实现资料。
本次仅在上游增加最小必要的兼容接口及可选配置，既有 Blog 的视觉、数学、物理和交互效果
不得改变；新增配置缺省保持旧行为，旧调用不需要迁移。通过兼容验收再进入发行步骤。

- `src/vault-adapter.ts`：只读 Vault / MetadataCache；采用宿主已解析的链接事实。
- `src/graph.ts`：稳定身份、真实节点与关系、可逆视图过滤和局部遍历；不解析 Markdown、不包含布局算法。
- `src/atlas-adapter.ts`、`src/layout.worker.ts`：唯一 Atlas 接入与受保护数据 API 的离线程调用。
- `src/main.ts`：命令、工作区视图、设置、文件事件和原生笔记打开。
- `src/view-state.ts`：每个面板独立的搜索/过滤/局部范围及工作区状态恢复。
- `scripts/`：独立验签、白名单构建、内容哈希与制品检查。
- `tests/`：非私人合成输入；不进入安装包。

完整边界见 [数据与运行架构](docs/architecture.md)，验证事实见 [测试记录](docs/validation.md)。

## 本地开发

Node.js 24，npm lock 固定依赖。先取得已批准的 Atlas 包、分离签名和可信公钥，
更新 `vendor/atlas.lock.json` 为同一发行事实；不要凭包的版本字符串信任它。

```text
npm run prepare:atlas -- <archive.tgz> <signature.sig> <public-key.pem>
npm ci --ignore-scripts
npm run typecheck
npm test
npm run build
npm run verify:package
npm run verify:installed-runtime
npm run package
```

首次运行准备脚本只依赖 Node 内建模块及系统 tar，之后才能安装 `file:vendor/atlas.tgz`。
当前锁为已验签的 0.1.6 基线，标记了缺少宿主 API 的阻塞，不是候选源码已发行的声明。
验签不读取私钥；签名私钥只由上游获授权的发布流程使用。

在经授权的隔离副本中更换同路径 `vendor/atlas.tgz` 时，还必须显式运行
`npm install ./vendor/atlas.tgz --ignore-scripts` 更新 npm lock，再执行 `npm ci --ignore-scripts`。
单独替换归档或仅运行普通 `npm install` 可能仍安装旧锁对应的缓存包；构建会逐文件比对并拒绝不匹配制品。

## 安装方式（须先有通过门禁的包）

### 固定人工验收 Vault

本机持续使用本仓库的 `test-vaults/AtlasPlugin-Test/`，不要按日期或构建批次创建新的活动 Vault。
2026-10-05 已将原 Ops 构建目录中的测试 Vault 原样迁入此处；在 Obsidian 中使用“打开文件夹作为仓库”
选择新位置。后续新增用例、测试笔记、插件设置和工作区状态均在此迭代，不重新复制初始模板。

对应测试候选及来源回执位于本仓库 `artifacts/validation/obsidian-validation-20261005/`，
ZIP 位于其中 `consumer/outputs/seetheforest-atlas-obsidian-0.1.0.zip`。这是插件 0.1.0 + Atlas
0.1.7-obsidian.4-gates 的本地候选，不是正式发行。候选按批次保留，Vault 不随批次改变。
更新时先关闭该 Vault 或禁用插件，仅替换校验通过的 `main.js`、`manifest.json`、`styles.css`，
保留插件 `data.json`、其他 `.obsidian` 配置和全部测试笔记。`test-vaults/` 不进入 Git 或发布制品。

### 其他 Vault 的手动安装

这里安装的是 `seetheforest-obsidian-plugin` 构建的 See the Forest Atlas 插件，
其中包含受保护的 Atlas 运行组件；不能将 Atlas 的 npm `.tgz` 当作插件安装包。
将安装包内 `seetheforest-atlas/` 放入所选 Vault 的 `.obsidian/plugins/`，
其中运行文件仅为 `main.js`、`manifest.json`、`styles.css`；资源与 Atlas/第三方许可证全文随
`main.js` 携带，不依赖附加文件下载。Obsidian 设置 → 社区插件中启用 See the Forest Atlas。
命令面板包含“打开全局星图”“打开局部星图”“重新读取当前笔记库”。
候选 manifest 暂限桌面，最低版本 1.11.7；本机安装器版本已核对，实际兼容仍待实装验证。
运行源码没有 Node/Electron API 依赖；移动端解禁需要完成 Blob Worker、Wasm、触摸及资源生命周期实测。

单击真实笔记节点在原生阅读标签打开；重复点击复用该视图的阅读标签，保留星图以便返回。
修饰键使用 Obsidian `Keymap.isModEvent`。未解析链接先显示确认，再交给 Obsidian 打开或创建。
加载和索引过程不会创建笔记。标签节点进入标签过滤。

每个星图面板独立保存搜索、标签/附件/未解析/孤立节点开关、局部深度、方向和跟随状态，
由 Obsidian 工作区保存与恢复；点击标签只筛选当前面板。排除条件和颜色分组仍是插件级设置。
旧工作区没有面板选项时继承已有插件设置的副本，不改写笔记。更改一个面板的查询不会清除
其他面板需要的本地正文索引；正文不会进入工作区状态。此行为已有宿主替身自动测试，仍待实装验证。

## 隐私与分发

不含遥测、云上传、远程 CDN、自更新、账号、支付或 AI 整理功能。
只持久化必要设置和路径→稳定 ID；正文及可重建图不保存到插件数据或发行包。
Atlas 是闭源专有组件；插件的目标分发渠道是 Obsidian 社区插件市场。
正式发布前仍需确认插件许可、Atlas 再分发许可及市场审核要求，不能通过公开 Atlas 源码绕过该边界。
Obsidian 社区目录禁止以混淆隐藏用途，闭源代码个案审查；不能承诺已可上架。
官方来源与核验日期见 [功能对照](docs/native-graph-parity.md)。

打包格式、离线验收边界和后续市场闸门见 [社区安装制品契约](docs/community-package.md)。
