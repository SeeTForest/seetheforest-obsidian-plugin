# 社区安装制品契约

核验日期：2026-09-30。实现是本地开发候选，不是发布授权或市场审核结论。

## 制品身份与命名

2026-10-05 明确工程与用户命名的区别；本节不代表重新核验平台政策或通过发行验收。

- 构建工程：`seetheforest-obsidian-plugin`，由本工程的 `scripts/build.mjs` 和 `scripts/package.mjs` 生成插件制品。
- 用户展示名：`See the Forest Atlas`；安装 ID 与目录：`seetheforest-atlas`。
- 本地 ZIP：`seetheforest-atlas-obsidian-<插件版本>.zip`；文件名中的版本来自插件 `manifest.json.version`，不是 Atlas 版本。
- ZIP 内的 `seetheforest-atlas/` 是插件安装目录，不是 Atlas 源码目录；其三个运行文件均是插件工程的构建输出。
- 内含组件：锁定并验签的 `@seetheforest/atlas` 运行制品。Atlas npm 归档不是可直接安装的 Obsidian 插件。

不为匹配仓库名而变更现有展示名、安装 ID、ZIP 名称或目录结构。对外可称“See the Forest Atlas 插件”；
工程交付应称“`seetheforest-obsidian-plugin` 构建的 See the Forest Atlas 插件，内含 Atlas 运行组件”。
Atlas 版本、插件版本、各自的 Release 与验收结论独立管理。

## 构建与验收追溯

当前信息分布在构建清单与候选回执中，不应把其中一个文件误认为完整来源证明：

| 事实 | 当前记录位置 / 字段 |
| --- | --- |
| 插件工程名称 | 插件 `package.json.name` |
| 用户名称、安装 ID、插件版本 | 插件 `manifest.json`；构建清单顶层 `version` 是插件版本 |
| 插件源码身份 | 隔离候选的 `identity.json`：`pluginBaseCommit`、`sourceIncludesUncommittedChanges`、`sourceHashes` |
| 内含 Atlas 版本与输入归档哈希 | `outputs/package-integrity.json` 的 `atlas.version`、`atlas.sha256`；与实际消费的锁及验签记录核对 |
| 三个运行文件、内嵌资源与许可文本哈希 | `outputs/package-integrity.json` 的 `files`、`embeddedAssets`、`noticesSha256` |
| ZIP 哈希 | `outputs/<ZIP 文件名>.sha256`；现有候选 `identity.json` 也保存 `zipSha256` |

现有三文件候选的身份回执现位于本仓库 `artifacts/validation/obsidian-community-package-20260930/identity.json`，
对应构建清单位于该目录下的 `consumer/outputs/package-integrity.json`。两者共同记录上述来源；
`pluginBaseCommit` 只是构建时的源码基点，该回执明确包含未提交改动，不能将基点单独当作完整构建源码。
不能在后续提交后倒改历史回执，使其看似由干净提交构建。

当前常规构建脚本自动产生完整性清单和打包摘要，但不会自动生成上述包含插件 Git 来源的候选 `identity.json`。
每次交付须同时保存实际来源回执与对应制品摘要；隔离副本不得把父 Ops 仓库的 HEAD 冒充插件提交。
缺少来源记录时只能声明字节核验结果，不能宣称完成源码追溯或正式发行验收。
这些构建端记录不增加用户安装目录的文件，也不替代签名或真实 Obsidian 测试。

2026-10-05 新构建的来源回执位于 `artifacts/validation/obsidian-validation-20261005/identity.json`，
使用干净插件提交 `47d1832`，并明确记录隔离副本的两份 Atlas 依赖锁覆盖及换行差异。
该批次的 Vault 已独立迁入固定 `test-vaults/AtlasPlugin-Test/`；构建批次只保留制品与证据，
不再作为日常 Vault 所在位置。旧回执保留当时路径，不倒改历史；目录迁移见 [验证记录](validation.md)。

## 官方安装边界

[官方插件发布说明](https://docs.obsidian.md/plugins/releasing/submit-plugin) 列出的安装下载文件为
`main.js`、`manifest.json` 和可选 `styles.css`。不能依赖 ZIP 中附加目录会被社区安装器下载。

旧布局依赖 `assets/` 中的布局 Worker、Atlas Worker 与 Wasm，仅适用于保留整个目录的手工安装。
新构建输出恰好三个运行文件；本地 ZIP 只是包装同一三个文件的侧载便利物，不代替 GitHub Release。

## 字节、许可与资源生命周期

1. 仍先验签 Atlas 归档、公钥指纹、保护清单及逐文件哈希，并核对实际 node_modules 字节。
2. Atlas Worker/Wasm 保留原始字节，Base64 仅用于在 `main.js` 中运输；不更改、重编译或补丁修改它们。
3. 插件布局 Worker 仍通过受保护的数据 API 构建，作为第三个内嵌资源，不复制布局算法。
4. 浏览器端解码为原始 Uint8Array，再创建本地 Blob URL；不读取插件目录、不访问 CDN、不自行下载依赖。
5. 每个插件运行实例拥有自己的资源；部分初始化失败及时撤销已创建 URL，卸载可重复调用且不影响其他实例。
6. Atlas 与第三方许可证全文保存在 `main.js` 开头的可读注释；不能假设单独许可证文件会被安装器取回。
7. 完整性清单写入构建端 `outputs/package-integrity.json`，不依赖它存在于用户安装目录。

Base64 是公开说明用途的二进制资源封装，不是额外的源码保护方案，也不保证符合市场的闭源审核政策。
Atlas 已有保护构建不变；没有将 Atlas 私有源码复制到插件仓库。构建体积增加须记录真实文件大小。

## 校验

- `verify:package` 要求输出目录恰好三文件，核对文件哈希、内嵌三资源哈希/长度、许可证和泄漏标记。
- `verify:installed-runtime` 运行实际构建出的 `main.js`，使用 Node VM 的 Obsidian 宿主替身：禁止网络
  与 Vault adapter 读取，验证初始化资源、Wasm 编译、布局、取消、独立实例以及卸载撤销。
- 该测试没有真正的 Obsidian、DOM 渲染、GPU 或浏览器 Worker，不能证明 Electron CSP 和实际界面通过。
- 遇到旧的多文件 dist 时构建会拒绝，不自动递归清理旧证据；应在新隔离目录构建。

## 仍未解除的发行闸门

- 正式工作区 Atlas Lock 仍为 0.1.6；完整构建验证只在已授权候选的隔离 consumer 执行。
- 真实 Obsidian 隔离 Vault 安装、离线、主题、多面板和 GPU/Worker 释放待测。
- 根目录插件 LICENSE、Atlas 再分发许可及可审查源码交付待明确，不擅自选择许可或公开仓库。
- [官方开发者政策](https://docs.obsidian.md/community-directory/developer-policies) 要求披露闭源代码并个案审查，
  禁止为隐藏用途而混淆；三文件技术适配不代表获准上架。
- 正式 Release、Tag、依赖升级和市场提交都需要独立授权。
