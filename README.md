# See the Forest Atlas for Obsidian

Explore your notes as an interactive knowledge constellation, directly inside
Obsidian. See the Forest Atlas uses your Vault's real links to help you discover
connections, inspect a note, and return to its original content without losing
your place in the graph.

## Features

- Open the global Atlas from the left ribbon's network icon, or use the command
  palette. Keyboard shortcuts are optional.
- Explore a local graph around a note, with depth and link-direction controls.
- Search and filter notes; manage exclusions and color groups in plugin settings.
- Select a node to inspect its details. Use the reading action to open the note
  in Obsidian; selecting a node does not immediately switch tabs.
- Use independent graph panels and a keyboard-accessible note list.
- Keep your data local: no telemetry, note uploads, account, subscription,
  runtime downloads, or remote rendering service.

## Requirements and installation

This release targets **desktop Obsidian 1.11.7 or later**. Mobile is not yet
supported. Some controls currently use Chinese labels. The plugin complements
the native Graph view; it does not implement every advanced native Graph option.

The current source prepares **0.1.1** review fixes; the published release remains
**0.1.0** until a new release is explicitly published. Do not infer installation
or community approval status from the source version alone.

Until the community review succeeds, download `main.js`, `manifest.json` and
`styles.css` from the [published release](https://github.com/SeeTForest/seetheforest-obsidian-plugin/releases/latest).
Place all three in `.obsidian/plugins/seetheforest-atlas/` inside your Vault, then
enable **See the Forest Atlas** in Community plugins. Close the Vault or disable
the plugin before upgrading, and preserve `data.json`. GitHub's source-code ZIP
is not an installation package. This README does not assert community approval.

## License and privacy

The original Obsidian integration is [MIT-licensed](LICENSE). **Atlas is a
proprietary, closed-source dependency**, not covered by the integration's MIT
license. The combined `main.js` is not wholly MIT. Read the
[license scope](LICENSE-SCOPE.txt) and [Atlas permission](ATLAS-RUNTIME-PERMISSION.txt).
Atlas, Worker, Wasm, styles and license notices are bundled for offline operation.
The plugin stores settings and stable note identifiers; it does not upload notes.

## Building and reviewing

Use Node.js 24 and system `tar`. The repository includes only the fixed signed
Atlas **compiled package**, its signature and public key, plus public API types
inside the package; it does not include Atlas implementation source or source
maps. These inputs may be used to build and review this plugin under the limited
permission above. No GitHub token or private repository access is needed for
dependency installation. Build-time npm access is separate from offline runtime.

```sh
npm run verify:review-inputs
npm ci --ignore-scripts
npm run typecheck
npm test
npm run build
npm run verify:package
```

For isolated validation use `node scripts/ci.mjs full` (or `source` for the
public-dependencies-only checks). See [local CI instructions](docs/ci.md).
Signature verification remains mandatory. Do not treat a successful build as
visual acceptance or official community approval. Report reproducible problems
through [GitHub Issues](https://github.com/SeeTForest/seetheforest-obsidian-plugin/issues)
without attaching private notes, credentials or session cookies.

## 中文使用与工程说明

把当前 Obsidian 笔记库的真实链接网络交给 See the Forest Atlas 显示，在原生工作区中探索并打开笔记。
不需要见林 Vault 框架、Profile、Codex、网站构建、账号或网络服务。笔记不会被改写或上传。

## 许可与离线运行

**插件适配层 MIT，Atlas 为专有闭源依赖。** MIT 仅覆盖本工程原创的 Obsidian 适配代码，
不覆盖 `@seetheforest/atlas` 或其他第三方代码，也不表示最终组合的 `main.js` 全部采用 MIT。
Atlas 获准随本插件免费分发并供用户安装运行；2026-10-10 增补仅限本插件构建/审核的签名包公开权限，不授予 Atlas 源码公开或其他用途的单独再分发权。
各自许可证及分发授权全文随安装文件保留，见 [LICENSE](LICENSE) 与 [Atlas 分发授权](ATLAS-RUNTIME-PERMISSION.txt)。

Atlas、两个 Worker、Wasm 和样式随插件安装包提供；已安装插件在本地离线运行，
无运行时下载、遥测、CDN、账号或自更新。开发者构建时下载 npm 依赖和签名 Atlas 包，
以及 Obsidian 自身下载插件安装/更新文件，不属于插件的运行时联网。
`package.json.private: true` 只用于防止误发 npm；MIT 许可和 GitHub 仓库是否公开是另外两个维度。

English disclosure: The Obsidian integration layer is MIT-licensed. Atlas is a proprietary,
closed-source dependency bundled with the plugin. Its code is not covered by the integration's MIT license.
The installed plugin runs offline with bundled Worker/Wasm assets, without runtime downloads or telemetry.
Build-time dependency retrieval is separate from plugin runtime behavior.

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

## 发行与社区状态

2026-10-10：用户已添加社区条目，官方扫描报告依赖安装失败及若干警告；源码已准备 0.1.1
修复，完整本地验证记录见 `docs/validation.md`。尚未推送或发布本次修复、未获官方复审通过。

首个发行版本为 **插件 0.1.0 + Atlas 0.1.7**，仅支持桌面 Obsidian 1.11.7 及以上。
用户已确认当前本机正式包复验通过；GitHub 发行不代表官方社区目录已收录。
发行入口：[0.1.0 Release](https://github.com/SeeTForest/seetheforest-obsidian-plugin/releases/tag/0.1.0)。
在正式获目录收录前，可按下文手动安装三个 Release 附件；不要将 GitHub 自动生成的 Source code 压缩包当作安装包。
全局/局部星图、搜索过滤、选择后阅读及离线运行已提供；移动端、原生 Graph 的完整高级参数面板尚未支持。
复杂拖动可能需要超过 15 秒归静，未通过缩短计算路径改变物理行为。

以下保留版本与验收过程；过去时段的“未发行”不代表当前 Release 状态。

2026-10-06 当前依赖已升级为私有 [Atlas v0.1.7 Release](https://github.com/SeeTForest/seetheforest-atlas/releases/tag/v0.1.7)，
Atlas/npm 两锁固定同一签名包，具备宿主 API v1 与选择/阅读分离接口。插件版本为 0.1.0，官方目录收录状态另行确认。
用户已验收固定 Vault 的 `.8-initial` 候选；正式包额外修复 Wasm 中的本机路径泄漏，运行源码未变，但字节并不相同。
新旧包差异及最终验证结果见 [测试记录](docs/validation.md)。随后用户确认关闭 Vault 并批准安装，
固定 Vault 已更新为正式 Atlas 0.1.7；2026-10-07 用户明确确认“正式包复验通过”，
当日只读核对三文件仍匹配 `b83e1ee` 的干净构建。此为当前本机版本的用户验收，不是跨平台覆盖或社区审核结论。

以下按时间保留此前开发过程，旧版阻塞不表示当前依赖状态：

2026-09-28 已建立源码、数据适配、视图、设置、测试及受保护制品构建门禁。
当时源码工作区锁定 Atlas 0.1.6，它是视觉与数据基线，但不含原生宿主接口，因此当时运行 `npm run build` 会被拦截。
2026-09-30 已在独立副本（现位于本仓库 `artifacts/validation/obsidian-candidate-gates-20260929/consumer/`）中消费
已签名的 `0.1.7-obsidian.4-gates`，完成类型检查、22 项测试、构建和制品检查。
同包已通过固定 Blog 快照的 19 个场景、106 项行为、8 项视觉对照；部分强拖动仍超过 15 秒体验目标。
真实 Obsidian 实装尚未验收，正式依赖未升级，候选不是正式 Release，不能用于发行。
不得将类型检查、单元测试或网页预览称为插件交付成功。

2026-10-05 的选择/阅读分离候选使用已签名 Atlas `0.1.7-obsidian.5-selection`，
隔离副本完成类型检查、30 项测试、构建、三文件制品检查及打包；证据位于
`artifacts/validation/select-before-read-20261005/`。Blog 回归和真实 Obsidian 验收分别记录，
不能用插件自动测试代替。正式源码依赖锁仍为 0.1.6。

2026-10-06 已在 `artifacts/validation/inspector-candidate-20261006/` 用签名
`0.1.7-obsidian.6-inspector` 完成完整本地 CI（38 项插件测试、12 项 CI 测试、验签、类型检查、
构建、三文件/离线 VM 检查及打包）。该包已整合正式 Inspector 与宿主接口。
随后 `.8-initial` 在 `artifacts/validation/initial-candidate-20261006/` 通过同一完整插件管线，
上游固定未旋转初态生成专项也已通过。最终 `.8` 有界 Blog 原矩阵 18 项中 17 通过，
剩余搜索项经用户批准修订单条失效用例后，独立评分 21/21、100% 通过，原失败记录保留。
本轮自动门禁覆盖已闭合，但长拖体验边界继续保留，隔离用例修订尚未进入 Blog 主分支。
正式依赖未更新；2026-10-06 经用户授权并确认关闭后，固定测试 Vault 已安装该 `.8-initial` 候选，
三个运行文件哈希通过，笔记与设置保留。用户随后明确确认该版本验收通过；这是该候选的用户验收，
并非社区审核或正式发行，也不表示已有全部平台的逐项测量记录。
当前状态以生产交付清单和测试记录为准。

2026-09-30 后续已完成社区安装三文件格式的源码适配：签名制品中的 Worker/Wasm 与插件布局
Worker 随 `main.js` 内嵌，运行时仅创建本地 Blob，不读取额外 `assets/` 或下载依赖。
三文件隔离验证见本仓库 `artifacts/validation/obsidian-community-package-20260930/`，不能视为已经获市场审核或真实实装通过。

总体目标是扩展原生 Graph 能力并保留 Atlas 体验。2026-10-06 用户明确物理/数学正确性与一致性、视觉与交互为核心，
其他功能由工程判断安排。首版优先可靠的探索、阅读与离线使用；高级搜索、力/显示滑块、方向箭头和创建时间动画
安排后续，不以这些缺口为由降低 Atlas 核心验收要求。当前差距详见 [原生功能对照](docs/native-graph-parity.md)。

生产交付的剩余门槛、固定 Vault 验收步骤与官方社区提交路线见 [生产交付清单](docs/release-readiness.md)。

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

本地脚本是重复验证的主入口：Windows 使用 `scripts\ci.bat source` / `scripts\ci.bat full`，
Linux/macOS/Git Bash 使用 `sh scripts/ci.sh source` / `sh scripts/ci.sh full`。
两者复用 `scripts/ci.mjs`，原有 `npm run ci:source` / `npm run ci:full` 同样有效；无需先在源码目录安装依赖。
GitHub Actions 只是跨平台源码检查与可选受保护构建的调用层，不承载另一套逻辑；本地前提、命令与结果位置见 [CI 与配置说明](docs/ci.md)。
源码检查通过不表示完整兼容验收通过；完整管线始终要求与正式锁一致的签名 Atlas 包。

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
当前锁为已验签的正式 Atlas 0.1.7；私有 Release 下载与本地准备步骤见 [CI 说明](docs/ci.md)。
验签不读取私钥；签名私钥只由上游获授权的发布流程使用。

在经授权的隔离副本中更换同路径 `vendor/atlas.tgz` 时，还必须显式运行
`npm install ./vendor/atlas.tgz --ignore-scripts` 更新 npm lock，再执行 `npm ci --ignore-scripts`。
单独替换归档或仅运行普通 `npm install` 可能仍安装旧锁对应的缓存包；构建会逐文件比对并拒绝不匹配制品。

## 安装方式（须先有通过门禁的包）

### 固定人工验收 Vault

本机持续使用本仓库的 `test-vaults/AtlasPlugin-Test/`，不要按日期或构建批次创建新的活动 Vault。
2026-10-05 已将原 Ops 构建目录中的测试 Vault 原样迁入此处；在 Obsidian 中使用“打开文件夹作为仓库”
选择新位置。后续新增用例、测试笔记、插件设置和工作区状态均在此迭代，不重新复制初始模板。

当前安装为插件 0.1.0 + 正式 Atlas 0.1.7，来自干净插件提交 `b83e1ee`。
构建回执位于 `artifacts/validation/ci/full-12ftNh/receipt.json`，ZIP 位于同目录
`workspace/outputs/seetheforest-atlas-obsidian-0.1.0.zip`。这不是插件社区发行。
历史候选按批次保留，Vault 不随批次改变；最新安装及旧三文件备份位于
`artifacts/validation/formal-atlas-20261006/vault-install/`。
更新时先关闭该 Vault 或禁用插件，仅替换校验通过的 `main.js`、`manifest.json`、`styles.css`，
保留插件 `data.json`、其他 `.obsidian` 配置和全部测试笔记。`test-vaults/` 不进入 Git 或发布制品。

### 其他 Vault 的手动安装

这里安装的是 `seetheforest-obsidian-plugin` 构建的 See the Forest Atlas 插件，
其中包含受保护的 Atlas 运行组件；不能将 Atlas 的 npm `.tgz` 当作插件安装包。
将安装包内 `seetheforest-atlas/` 放入所选 Vault 的 `.obsidian/plugins/`，
其中运行文件仅为 `main.js`、`manifest.json`、`styles.css`；资源与 Atlas/第三方许可证全文随
`main.js` 携带，不依赖附加文件下载。Obsidian 设置 → 社区插件中启用 See the Forest Atlas。
命令面板包含“打开全局星图”“打开局部星图”“重新读取当前笔记库”。
日常打开优先使用鼠标：点击 Obsidian 最左侧 Ribbon 上的树状网络图标（`network`），
悬停提示“打开 Atlas 全局星图”，即可在工作区打开全局星图，无需先选中笔记。
该按钮与 Obsidian 自带的 Graph View 按钮是两个独立入口；其排列位置由用户的 Ribbon 布局决定。
`Ctrl+P` → “打开全局星图”只是可选方式，不是使用插件的前提。
旧候选包的同一鼠标入口提示为“打开见林星图”，已支持点击打开。
候选 manifest 暂限桌面，最低版本 1.11.7；本机安装器版本已核对，实际兼容仍待实装验证。
运行源码没有 Node/Electron API 依赖；移动端解禁需要完成 Blob Worker、Wasm、触摸及资源生命周期实测。

当前源码采用“先选择，后阅读”：单击节点或对节点按 Enter/空格只选中并显示 Atlas 详情卡片，不切换笔记标签。
点击卡片“阅读原文”、文本后备列表中的笔记按钮，或右键“打开笔记”才打开原生阅读标签；
重复阅读复用该视图的阅读标签，保留星图以便返回。修饰键仅在明确的打开操作中交给 Obsidian `Keymap.isModEvent`。
此行为需要支持 `host.nodeActivation: "select"` 的签名 Atlas 包；当前正式 0.1.7 已包含该接口。
历史 0.1.7-obsidian.4-gates 候选仍有单击直接打开问题，不应再用它验证此行为。
未解析链接在明确的打开操作后先显示确认，再交给 Obsidian 打开或创建。
加载和索引过程不会创建笔记。标签节点进入标签过滤。

每个星图面板独立保存搜索、标签/附件/未解析/孤立节点开关、局部深度、方向和跟随状态，
由 Obsidian 工作区保存与恢复；点击标签只筛选当前面板。排除条件和颜色分组仍是插件级设置。
旧工作区没有面板选项时继承已有插件设置的副本，不改写笔记。更改一个面板的查询不会清除
其他面板需要的本地正文索引；正文不会进入工作区状态。此行为已有宿主替身自动测试，仍待实装验证。

### 面板布局（当前源码）

搜索与重新读取位于顶部。宽面板右侧集中放置“范围与过滤”和“笔记列表”，左侧优先留给星图；
控制栏独立滚动，两个分区均可折叠。面板宽度不超过 760px 时上下排列，限制控制区高度以保留星图空间。
“显示内容”适用于当前面板；“局部探索”的跟随、深度、方向仅在局部图显示，不删除已保存的局部选项。
笔记列表按行左对齐显示标题及完整路径，区分同名笔记；长文本换行，按钮继续支持键盘、原生打开及右键菜单。
外层控件跟随 Obsidian 主题；Atlas 内部配色、计算与交互不变。
右侧布局已包含在当前固定 Vault 安装中；早期候选截图保留在 `artifacts/validation/ui-right-sidebar-20261005/`。

## 隐私与分发

不含遥测、云上传、远程 CDN、自更新、账号、支付或 AI 整理功能。
只持久化必要设置和路径→稳定 ID；正文及可重建图不保存到插件数据或发行包。
Atlas 是闭源专有组件；插件的目标分发渠道是 Obsidian 社区插件市场。
2026-10-05 用户明确插件适配层采用 MIT，见根 `LICENSE`；此许可不覆盖 Atlas 与其他第三方代码。
构建包同时保留各自许可。2026-10-06 已获得通过验收的 Atlas 运行制品随本插件免费分发、供用户安装运行的有限授权，
见 [Atlas 插件内分发授权](ATLAS-RUNTIME-PERMISSION.txt)。不包含 Atlas 源码公开或单独再分发权。
经授权的 GitHub 发行与进入官方社区目录是不同步骤；后者仍须符合平台政策并通过审核，本地验收不代表获准上架。
Obsidian 社区目录要求披露闭源代码并作个案判断，禁止以混淆隐藏用途；不预设另有固定的独立前置审批，
也不预设必须公开 Atlas 或交出全部源码。所需材料依官方反馈确认；不能承诺已可上架。
官方来源与核验日期见 [功能对照](docs/native-graph-parity.md)。

打包格式、离线验收边界和后续市场闸门见 [社区安装制品契约](docs/community-package.md)。
