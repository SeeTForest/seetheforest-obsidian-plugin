# 插件持续集成与重复验证

更新：2026-10-05。CI 只验证本插件，不发布、不更新正式 Atlas Lock、不覆盖测试 Vault。

2026-10-06 增量：源码 CI 增加官方 Obsidian 非类型 lint；完整 CI 增加完整推荐类型 lint 和经签名核验的
50 / 500 / 4096 节点合成基准。lint 的 warning 不冒充零警告，性能基准不冒充真实 Obsidian/GPU 验收。
新步骤与结果同样写入阶段回执；配置为 `eslint.source.config.mjs`、`eslint.config.mjs`。

## 两条管线

| 入口 | 输入与权限 | 执行范围 | 不代表什么 |
| --- | --- | --- | --- |
| `npm run ci:source` | Node.js 24、公共 npm 依赖；不需要 Atlas 或密钥 | 版本/许可/依赖契约、现有插件单测、CI 与打包负例 | 不做完整类型检查、实际 Atlas 构建或视觉验收 |
| `npm run ci:full` | 同上，加当前 Lock 对应的已签名 Atlas 三个输入文件、系统 tar | 验签与宿主接口预检、锁定安装、完整类型检查、全部测试、构建、三文件与内嵌资源检查、实际包 VM 检查、ZIP 回读 | 不是真实 Obsidian、GPU、Blog 视觉回归或发行批准 |

两条命令都从源码白名单建立新隔离副本，位于本产品的
`artifacts/validation/ci/<source或full>-<随机标识>/workspace/`。
这只是一次验证的构建目录，不是新的测试 Vault。人工 Vault 始终使用 `test-vaults/AtlasPlugin-Test/`。
命令不清空已有证据、不覆盖源码依赖或本机 `node_modules`，也不复制笔记、`.local` 或其他产品。

每次生成 `receipt.json`：开始/结束时间、平台与 Node 版本、阶段成功/失败、实际源码文件哈希、
插件本仓库 Git 基点与脏状态（若无法可靠确定则为 null）、Atlas 双版本追溯、完整构建的字节清单及 ZIP 哈希。
白名单源码哈希包括构建脚本、测试、工作流和配置，不包括 README 等非构建输入。
失败返回非零退出码并保留已完成阶段和本地日志。被终止/超时的进程可能留下 `running`，不能视为通过。

源码管线仅在隔离的 `package.json` 和 npm lock 中移除 Atlas 一项；保留其他包的固定版本与 integrity，
并拒绝额外本地路径或非公共 npm 注册表输入。它不伪造 Atlas 类型或实现，因而不能宣称完整 typecheck 通过。
实际适配层行为测试使用明确的宿主替身；完整管线才读取真实 Atlas 公开类型和运行字节。

## GitHub Actions

- `source-ci.yml`：PR、main push 或手动触发；Ubuntu / Windows，Node 24。
- `protected-ci.yml`：仅 main 上手动触发；Ubuntu / Windows，受 `atlas-ci` Environment 管理。其他 ref 被跳过，不是验收通过。
- Action 固定完整 Commit SHA；checkout 不保留凭据；`contents: read`；不使用私有依赖缓存。
- 不使用 `pull_request_target` / `workflow_run` 接收外部代码，不向 PR 提供 Atlas Release Token。
- 受保护包、ZIP、完整日志和源码副本均不自动上传为 Actions artifact，也不发布 Release。
- GitHub Step Summary 只输出阶段状态；公共源码测试失败时输出该公共管线日志。
  完整构建失败不公开原始日志（它可能包含闭源内容）；维护者用同一输入在本地复现查看阶段日志。
  托管 runner 销毁后本地详细日志不保留，这是当前保密取舍，不宣称已有云端诊断归档。

### 需要维护者另行配置的 GitHub 事项

当前只提交配置文件的实现，不自动更改远端设置、Secret、分支规则或仓库可见性。

1. 将审核后的工作流合入 main，启用 Actions。把两个 `Source / ...` 检查设为分支必需状态。
2. 保护 main，要求评审，重点审阅 `.github/`、`scripts/`、依赖锁和许可变更。
3. 建立 `atlas-ci` Environment，限制仅 main，要求人工审批。若账号/仓库方案不支持这些保护，
   不启用受保护下载，继续本地 `ci:full`；单有 Environment 名称不是安全保证。
4. 只在该 Environment 配置下列值，不配置仓库级可供 PR 使用的 Atlas Token。

| 类型 | 名称 | 含义 |
| --- | --- | --- |
| Variable | `ATLAS_CI_ENABLED` | 完成保护审查后设为 `true` |
| Variable | `ATLAS_RELEASE_REPOSITORY` | 已批准的发行制品库 `owner/repo`，无需访问 Atlas 源码 |
| Variable | `ATLAS_RELEASE_TAG` | 精确 Release Tag；不自动使用 latest |
| Secret | `ATLAS_RELEASE_READ_TOKEN` | 仅对应制品库 Contents 只读权限的短权限凭据；不是签名私钥 |

Release 需要有以下三个精确名称的资产：

```text
seetheforest-atlas-<vendor/atlas.lock.json 的 version>.tgz
seetheforest-atlas-<version>.tgz.sig
atlas-signing-public.pem
```

`npm run fetch:atlas` 使用 GitHub CLI 只读下载上述资产，再核验源码锁中的 SHA-256、公钥 SPKI 指纹、
Ed25519 签名、保护标志和逐文件摘要；全部通过才复制到 `vendor/`。
Release Tag 只决定下载位置，不替代摘要/签名信任。配置 Tag 与版本不一致或资产缺失时失败，不回退。
Token 仅传给下载步骤，不传给安装、测试或构建。CI 不需要任何签名私钥。
本机无需使用该下载器：可继续 `npm run prepare:atlas -- <tgz> <sig> <pem>` 使用已批准本地包。

工作流使用 GitHub 托管 runner（需要 Node 24 Action 运行支持）；不要未经审查改成持久化共享 self-hosted runner。
本次未配置以上远端事项、未调用受保护远端下载，也没有托管 CI 运行成功的证据。

## 打包与版本契约

- `versions.json` 登记插件版本对应的最低 Obsidian 版本，不表示这个版本已经正式发布。
- CI 要求 manifest、package、npm lock、versions 一致，直接依赖精确锁定；移动端仍关闭。
- `npm run package` 保持原入口；ZIP 改用开发依赖 `fflate`，不再依赖 Windows 专有的 `tar -a` ZIP 行为。
  ZIP 只含安装目录内三个运行文件，固定时间戳、排序稳定，打包及写盘后均回读核对字节哈希。
  `fflate` 只用于开发打包，不进入插件运行依赖；相同输入的 ZIP 可重复生成相同字节。
- 用户决定插件适配层采用 MIT；根 `LICENSE` 与 package 元数据已登记。
  Atlas 专有许可及其他依赖许可独立保留；合成后的整个 `main.js` **不是全部 MIT**。
  构建 banner 同时携带插件 MIT、Atlas 许可和实际打包的第三方 notices，不增加安装文件数量。

## 当前阻塞与发行顺序

正式 Atlas Lock 仍是 0.1.6，缺少宿主 API 和节点选择/阅读分离支持。
`ci:full` 应在 `atlas-preflight` 失败，不能删除门禁或自动换成候选让正式管线显示通过。

进入社区发行还需要逐项完成：

1. Atlas 负责人收敛候选，并通过 Blog 自己定义的完整视觉与交互回归；本插件 CI 不重新定义这些用例。
2. 真实 Obsidian 固定 Vault 验收，包括点击/阅读、多面板、离线、主题、资源释放、大库性能；原生功能差距见 `native-graph-parity.md`。
3. 获批准的 Atlas Release 及再分发授权；再显式升级 Atlas Lock 与 npm lock，执行受保护完整 CI。
4. Atlas 闭源审核方案与官方审核结论；插件 MIT 不解决闭源组件审查问题。
5. 明确插件 Release 版本，生成并核验三文件资产及双版本证据；得到发布授权后才创建 Tag/Release、提交社区目录。

CI 回执始终将 Blog、真实 Obsidian、社区审核列为 `not-run`，`releaseAuthorized` 为 false。
不能仅修改这些字段充当验收；外部验收证据应绑定确切源码、Atlas 包与最终三文件摘要。

## 官方依据

2026-10-05 核验：[GitHub Actions 安全建议](https://docs.github.com/en/actions/reference/security/secure-use)
支持最小权限、完整 SHA 固定、环境审批和隔离不可信 PR；
[setup-node](https://github.com/actions/setup-node) 说明自动缓存开关。
Actions SHA 另经各自官方仓库 `git ls-remote` 核对 Tag。
[Obsidian 开发者政策](https://docs.obsidian.md/community-directory/developer-policies)
仍需在正式提交前再核验；本 CI 不代表官方接受闭源依赖。
