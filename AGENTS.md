# See the Forest Obsidian plugin

- 独立产品源码仓库；不属于 Ops 源码树，不自动提交、推送或发布。
- 当前 Vault 仅本地只读读取。不得上传、写入笔记、自动添加 ID 或执行笔记脚本。
- Obsidian Vault / MetadataCache 是文件身份与链接解析的事实来源。不得用网站发布过滤隐藏本地笔记，不另写 Markdown 解析器。
- Atlas 仅经签名、哈希与保护清单核验后的 npm 制品接入；禁止源码直连、复制物理/渲染算法、修改保护制品或绕过验签。
- 产品目标是发布本工程自身构建的 Obsidian 插件到社区插件市场，依赖锁定的 Atlas Release；源码保存、Atlas 发布、插件发布和市场审核是独立步骤，不自动授权外部发布。
- 用户展示名 `See the Forest Atlas`、安装 ID `seetheforest-atlas` 与插件工程 `seetheforest-obsidian-plugin` 必须区分；不得根据展示名或安装目录把插件制品归为 Atlas 仓库直接导出。交付与验收分别标明插件版本/源码身份及内含 Atlas 版本/制品哈希，不因名称澄清修改安装 ID、依赖锁或运行行为。
- Atlas 适配只允许最小必要的输入接口、原生宿主和可选参数扩展；不得改变 Blog 既有视觉、数学、物理、交互和默认配置，也不得建立专用渲染/物理分叉。旧 Blog 无需改调用，新增选项必须显式启用且按实例隔离。
- Blog 默认路径的完整视觉和交互回归是兼容验收硬门槛；类型检查和单元测试不能替代实测。Atlas 源码提交不能触发 Blog/官网依赖自动升级。
- 必需的通用宿主接口在 Atlas 上游实现并验证。缺少合格制品时构建必须失败，不以替代图冒充。
- 无云上传、遥测、账号、支付、自动更新和远程运行时依赖。
- 插件适配层使用 MIT；Atlas 是专有闭源依赖，不继承适配层许可，组合 main.js 不得宣称全部 MIT。保留 Atlas、插件内分发授权及第三方许可全文。`package.json.private: true` 仅防止误发 npm，不表示适配层采用闭源许可或决定 GitHub 仓库可见性。
- 区分构建时下载和运行时联网：维护脚本可按授权取得锁定签名依赖，已安装插件必须使用内嵌 Worker/Wasm 离线运行，不新增下载或遥测。官方闭源披露与个案判断不等于固定独立前置审批；不能预设须公开 Atlas 或交出整个仓库。
- `outputs/`、`node_modules/` 不入 Git。2026-10-10 用户授权在不含 Atlas 源码的前提下，公开官方审核所需的固定构建输入：`vendor/atlas.lock.json`、`atlas.tgz`、`atlas.sig`、`atlas-public.pem`。仅此白名单允许入 Git；提交前必须通过 `verify:review-inputs`。不得提交签名私钥、额外 Atlas 包、测试库、笔记、源码地图、内部文档或机器路径。此授权不等于 Atlas 源码公开或其他产品的独立再分发权，范围见 `ATLAS-RUNTIME-PERMISSION.txt`。
- 隔离构建与历史证据放在本仓库 `artifacts/validation/`，不再放 Ops 根 `outputs/`；`artifacts/` 与 `test-vaults/` 均不入 Git。本仓库现有 `dist/`、`outputs/` 构建契约保持兼容。
- 唯一活动人工测试 Vault 固定为本仓库 `test-vaults/AtlasPlugin-Test/`。按需求增量维护，不每次构建创建新 Vault；保留用户笔记、data.json、启用状态及工作区配置。更新前关闭相关 Vault 或禁用插件，只替换经核验的三个插件运行文件，不重置整个 Vault。
- 交付前运行 `npm run typecheck`、`npm test`、`npm run build`、`npm run verify:package`；真实 Obsidian 验证与单元测试分别报告。
- CI 本地脚本优先：检查、构建、打包和失败判定统一放在 `scripts/`，并在 `docs/ci.md` 说明前提、调用和结果位置；Windows / shell 入口复用同一实现，不建立多套逻辑。GitHub Actions 仅在跨平台验证或受保护构建确有需要时使用，只负责触发、环境、权限与调用本地脚本，不在 YAML 中编写独立业务流程；本地验证不得依赖 GitHub Actions 才能运行。
- 保留其他仓库与用户修改。移动端未验证不得宣称兼容；功能对照中的差距不得称为全部完成。
