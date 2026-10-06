# 插件本地验证脚本与按需 CI

更新：2026-10-06。本地脚本为主，GitHub Actions 为可选调用层。验证只针对本插件，不发布、不更新正式 Atlas Lock、不覆盖测试 Vault。

## 本地优先：如何调用

检查、构建、打包、验签及失败退出逻辑都在仓库 `scripts/` 中。`ci.bat` / `ci.sh` 只转发参数和退出码到
现有跨平台 `ci.mjs`，不另写一套 shell/Python 实现。Node 本来就是插件的必要构建工具，无需额外安装 Python。
不需要 GitHub 账号、Actions runner 或云端 Secret 才能运行本地验证。

前提：Node.js **24**（含 npm）在 PATH 中；首次安装公共依赖需要访问 npm 注册表；完整验证额外需要系统 `tar`
以及已批准、与锁一致的 `vendor/atlas.tgz`、`atlas.sig`、`atlas-public.pem`。只验证签名，不读取私钥。
无需先执行根目录 `npm install` / `npm ci`：脚本在独立副本内安装依赖，源码检查不需要 Atlas 包。

在插件仓库根目录运行，二选一：

```bat
rem Windows cmd；PowerShell 中可用 .\scripts\ci.bat source
scripts\ci.bat source
rem 准备好受保护输入后运行完整管线
scripts\ci.bat full
```

```sh
# Linux / macOS / Git Bash；不需要 chmod 或管理员权限
sh scripts/ci.sh source
sh scripts/ci.sh full
```

原有 `npm run ci:source` / `npm run ci:full`，以及 `node scripts/ci.mjs source|full`（选择一个模式）均调用同一实现。
入口可从其他工作目录使用绝对路径调用，包含空格的路径需要加引号；输出始终归属脚本所在插件仓库，不归属当前终端目录。
`.sh` 固定 LF 换行，`.bat` 固定 CRLF。模式缺失、不合法或额外参数会失败，不隐式运行全量构建。

获准准备 Atlas 本地输入时使用既有 `npm run prepare:atlas -- <tgz> <sig> <pem>`；更换版本仍需独立的依赖升级授权，
脚本不自行更改正式锁。日常验证不需要下载器 `fetch:atlas`，更不需要签名权限。

成功退出码为 `0`，失败为非零。终端最后输出 `receipt.json` 的相对位置；在其同目录查看失败阶段的 `.log`
和 `.error.log`。完整构建成功后的安装三文件位于 `workspace/dist/`，ZIP 和完整性清单位于 `workspace/outputs/`。
不得把失败/未完成的回执当成发行批准，也不要把含闭源上下文的详细日志上传到公共 issue。

职责分工：`ci.mjs` 编排与回执，`ci-contract.mjs` 版本/依赖契约，`atlas-verification.mjs` 验签与接口门禁，
`build.mjs` 构建，`verify-*.mjs` 制品检查，`package*.mjs` 打包，`benchmark.ts` 合成基准。
新增重复性工作先进入相应本地脚本和测试，GitHub 只调用它。

真实宿主验收前，使用 `node scripts/verify-test-vault.mjs <full-ci-receipt.json>` 只读比较固定
`test-vaults/AtlasPlugin-Test` 已安装的三个运行文件与成功完整 CI 的字节；不用停止 Obsidian 即可检查，
但更新插件仍必须关闭 Vault 或禁用插件。匹配返回 0，不匹配/缺文件/证据不完整返回非零。
该脚本先核对回执与保留构建目录、制品清单，再比较三个安装文件，不读笔记或 `data.json`、不安装、不联网。
本地回执不是签名证明，匹配只说明安装身份一致；不会授予发布权限或把真实 Obsidian 验收标为通过。

2026-10-06 增量：源码 CI 增加官方 Obsidian 非类型 lint；完整 CI 增加完整推荐类型 lint 和经签名核验的
50 / 500 / 4096 节点合成基准。lint 的 warning 不冒充零警告，性能基准不冒充真实 Obsidian/GPU 验收。
新步骤与结果同样写入阶段回执；配置为 `eslint.source.config.mjs`、`eslint.config.mjs`。

## 两条管线

| 入口 | 输入与权限 | 执行范围 | 不代表什么 |
| --- | --- | --- | --- |
| `scripts\ci.bat source` / `sh scripts/ci.sh source` / `npm run ci:source` | Node.js 24、公共 npm 依赖；不需要 Atlas 或密钥 | 版本/许可/依赖契约、非类型 lint、现有插件单测、CI 与打包负例 | 不做完整类型检查、实际 Atlas 构建或视觉验收 |
| `scripts\ci.bat full` / `sh scripts/ci.sh full` / `npm run ci:full` | 同上，加当前 Lock 对应的已签名 Atlas 三个输入文件、系统 tar | 验签与宿主接口预检、锁定安装、完整 lint / 类型检查、全部测试、构建、三文件与内嵌资源检查、实际包 VM 检查、合成基准、ZIP 回读 | 不是真实 Obsidian、GPU、Blog 视觉回归或发行批准 |

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

## 按需使用 GitHub Actions

保留现有两个薄工作流，不增加新任务：源码矩阵用于本机难以同时覆盖的 Windows / Ubuntu 与 PR 检查；
受保护完整构建仅供未来需要独立远端复核时手动使用，当前不要求开启。通常先完成本地 source / full，
需要跨平台或评审证据才借助托管任务；本地 full 不以配置 GitHub Environment 为前提。
YAML 只保留事件、runner、Node 环境、权限、审批边界和脚本调用；不内嵌测试、打包、验签算法或多行 shell 流程。

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
| Variable | `ATLAS_RELEASE_REPOSITORY` | 已批准的发行仓库 `owner/repo`；本次选定 `SeeTForest/seetheforest-atlas` 私有源码仓库，不是独立制品库 |
| Variable | `ATLAS_RELEASE_TAG` | 精确 Release Tag；不自动使用 latest |
| Secret | `ATLAS_RELEASE_READ_TOKEN` | 仅对应发行仓库 Contents 只读权限的短期凭据；不是签名私钥。若发行库也是源码库，该权限仍可能读取源码 |

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

2026-10-06 用户批准使用现有私有 Atlas 仓库承载正式 Release，不公开仓库、不发布 npm。
这不等于批准创建读取凭据或给官方审核器访问：同仓库的 Contents 读取权限不能宣称是“仅制品、不含源码”。
如后续需要不接触源码的自动下载，应另行决定独立制品仓库或交付机制；当前本地构建不依赖该扩展。

工作流使用 GitHub 托管 runner（需要 Node 24 Action 运行支持）；不要未经审查改成持久化共享 self-hosted runner。
2026-10-06，插件提交 `4fc9cdd` 的[托管源码矩阵](https://github.com/SeeTForest/seetheforest-obsidian-plugin/actions/runs/37440708308)
已在 Windows / Ubuntu 通过。这是此前版本的源码验证证据，不含本次新增入口，不等于完整受保护构建。
尚未配置上述受保护远端事项或调用受保护远端下载；本次也不修改远端配置。

## 打包与版本契约

- `versions.json` 登记插件版本对应的最低 Obsidian 版本，不表示这个版本已经正式发布。
- CI 要求 manifest、package、npm lock、versions 一致，直接依赖精确锁定；移动端仍关闭。
- `npm run package` 保持原入口；ZIP 改用开发依赖 `fflate`，不再依赖 Windows 专有的 `tar -a` ZIP 行为。
  ZIP 只含安装目录内三个运行文件，固定时间戳、排序稳定，打包及写盘后均回读核对字节哈希。
  `fflate` 只用于开发打包，不进入插件运行依赖；相同输入的 ZIP 可重复生成相同字节。
- 用户决定插件适配层采用 MIT；根 `LICENSE` 与 package 元数据已登记。
  Atlas 专有许可及其他依赖许可独立保留；合成后的整个 `main.js` **不是全部 MIT**。
  构建 banner 同时携带插件 MIT、Atlas 许可和实际打包的第三方 notices，不增加安装文件数量。

## 当前正式依赖与发行顺序

2026-10-06 已获准升级两份锁到正式 Atlas `0.1.7`，含宿主 API 与选择/阅读分离支持。
来源为私有仓库 `SeeTForest/seetheforest-atlas` 的 `v0.1.7`，源码 `adb7ad0ac9a5e86ffa0009eebc171531fd9a8249`。
归档 SHA-256 固定为 `d17a55b01ac54edb8c346c69c822dfe1b28aa69eb785c3fcde864ce55b8247aa`；
可信公钥指纹仍由源码锁固定，不从下载到的公钥自行建立信任。不要使用此前同名的路径泄漏失败包。

已有获授权 GitHub 读取身份的维护者可本地执行（下载目录须为空或尚不存在，不覆盖历史资产）：

```text
gh release download v0.1.7 --repo SeeTForest/seetheforest-atlas --pattern seetheforest-atlas-0.1.7.tgz --pattern seetheforest-atlas-0.1.7.tgz.sig --pattern atlas-signing-public.pem --dir artifacts/validation/atlas-0.1.7-download
npm run prepare:atlas -- artifacts/validation/atlas-0.1.7-download/seetheforest-atlas-0.1.7.tgz artifacts/validation/atlas-0.1.7-download/seetheforest-atlas-0.1.7.tgz.sig artifacts/validation/atlas-0.1.7-download/atlas-signing-public.pem
npm run ci:full
```

普通复现不更改依赖锁；只有另获版本升级授权时才更新 Atlas/npm 两锁。本地管线不要求配置 GitHub CI Secret。

进入社区发行还需要逐项完成：

1. 保留 Atlas/Blog 原负责人定义的 `.8` 回归及正式化等价证据；本插件 CI 不重新定义这些用例，路径修复后的包不冒称重跑完整浏览器矩阵。
2. 固定 Vault 的 `.8` 已获用户验收；最终正式包仍应做真实 Obsidian 复验，覆盖更新、离线及资源释放。原生功能差距见 `native-graph-parity.md`。
3. 正式签名 Release、插件内分发授权和两锁升级已落实；最终构建运行本地完整 CI，证据见 `validation.md`。
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
