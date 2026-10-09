# 从开发候选到社区可安装版本

更新：2026-10-10。当前结论：**0.1.0 已在 GitHub 发行且用户已提交社区条目；0.1.1 修复已进入 main，本地验证通过，官方复审及正式发行仍待完成**。
本文件汇总状态与剩余执行项，验收来源及制品身份见 `validation.md`。

本次处理范围：固定签名 Atlas 构建输入随插件仓库提供（用户批准无源码的构建包公开）；
标准 MIT 与独立许可范围声明；英文 README；浏览器定时器；兼容 1.11.7 的 1.13+ 设置搜索；
修复 Seroval 传递依赖。Atlas 0.1.7 及其保护包字节不变，Blog/官网不动。
本地验证不替代 Review branch / Request review，也不授权自动发布或覆盖测试 Vault。

## 剩余工作及顺序

| 阶段 | 当前事实 | 放行需要 |
| --- | --- | --- |
| 插件质量与 CI | 正式 Atlas `0.1.7` 的完整本地 CI 已通过：38 + 12 项测试、类型检查、三文件/VM/ZIP；lint 0 error / 7 warning；回执 `full-IQWS3z` | 本地完整管线已完成；仅在需要托管受保护复核时另行审批远端配置，不把 GitHub 环境作为本地构建前提 |
| Atlas/Blog 兼容 | 最终 `.8` 原矩阵 17 项通过；剩余搜索项经用户批准仅修第 13 例后，独立单次评分 21/21、100% 通过；19 场景、106 行为、历史 raw 8/8 与同期配对 8/8 通过 | 已闭合本轮自动门禁覆盖，但旧矩阵仍保留 17/18；长拖超过 15 秒及旧 22.5 秒观察继续披露，不把自动门禁通过当作全部体验已达标或正式发行授权 |
| 正式依赖 | Atlas 私有 `v0.1.7` 已发布，来源 `adb7ad0`；插件 Atlas/npm 两锁已升级，可信签名根不变 | 依赖正式化已落实；最终插件 CI 与差异证据见 `validation.md`，不自动升级 Blog/官网 |
| 首版功能范围 | 用户授权以 Atlas 物理/数学一致性及视觉交互核心优先，其他功能由工程判断安排 | 首版交付可靠全局/局部探索、现有搜索过滤、阅读与离线；高级搜索、力/显示滑块、箭头、创建时间动画留作后续，不假称已支持 |
| 真实宿主验收 | 2026-10-07 用户明确“正式包复验通过”：插件 0.1.0 + Atlas 0.1.7；同日三文件仍匹配干净提交 b83e1ee 的构建 | 当前固定 Vault 的用户复验已闭合；不补写未提供的测量数据，不外推其他平台或解禁移动端 |
| 闭源依赖披露与社区个案判断 | 插件适配层 MIT，Atlas 专有闭源，合格运行制品可随插件免费分发；受限只读审核路线可接受，但尚未授予访问 | 按正常社区提交流程披露，请官方确认需要的材料及构建核验方式；不预设独立前置审批或必须交付整个 Atlas 仓库 |
| 社区发行 | 2026-10-07 用户已授权插件 0.1.0 Release 与社区提交；插件仓库经历史检查已 Public，Atlas 仍 Private | 发布经核验的三个安装资产；社区表单需账号登录、GitHub 连接及用户确认维护承诺，不将 GitHub 发布当作目录审核通过 |

2026-10-06 用户已授权 Atlas 原负责人：把采样修正纳入版本管理、定稿动态截图方法后进行一次有界完整回归。
该授权不包含修改 runtime、物理参数、历史参考图、推送、发布或部署。本线程不替上游重新定义测试。
负责人随后确认，其线程收到新的部署请求后曾暂停隔离回归。用户再次要求完成后续任务后，负责人已恢复隔离测试，
在 `codex/atlas-regression-sampling-20261006` 分支固定采样方法。`.5-selection` 的首次对照暴露了真实
Inspector 接口缺口，后由 `codex/atlas-host-inspector-integration-20261006` 整合分支解决；
签名 `.6-inspector` 的代码源为 `7837dc66dd116f7abc78e7c4da53c435738e0365`，尚未提升 Atlas main。
同日完成的有界矩阵使用 Blog `520d7e6`、同一公开图 558 节点 / 846 边，对照正式 `0.1.6-inspector.4`。
`.6` 候选当时通过 19/19 场景、106/106 行为、新鲜八态双包视觉 8/8，原生宿主浏览器专项另为 25/25；
这不是 Obsidian 实测，也不是后续 `.8` 的完整回归结果。

当时 No-Go 的具体原因：稳定性动作覆盖正式 179/180、候选 177/180，存在测试未取得可见命中点而跳过动作；
装配正式 12000 步 error、候选采样结束 11232 步仍 playing，两者位置残差均约 18.26328；候选长拖后
回稳 22234 ms，正式对应观察 14718 ms，但当时没有充分命令 trace 证明两次刺激相同，不能断言优化改变物理。
旧 raw 截图正式 2/8、候选 5/8 的失败保留，新鲜双包八态对照单独报告，不覆盖历史参考图。
用户明确批准的默认手机 Inspector 普通流布局例外保留，其他默认体验与物理数学不变。
后续通过固定刺激专项补足动作证据、定位装配模型；不得盲目重复全矩阵。
权威证据由原负责人维护于 Atlas `outputs/validation/host-inspector-integration-20261006/`，
本线程不另创 Blog 门禁，也不把既有正式版本失败当作候选自动放行的理由。

最新专项收敛（原负责人报告及 `docs/host-integration-diagnostics.md`）：

- 修正测试坐标读取与按下之间的时间差，确认真实命中后，两包均通过 180 次选择 / 36 次拖动 / 6 次导航。
  历史未命中失败保留，不把未施加动作计为通过。
- 两份长拖命令 trace 交叉输入正式 direct / 候选 cached 核心，各 3 次逐命令结果逐位一致。
  慢输入在正式核心也需 1349 步归静；证据不支持这些输入上核心回退，也不代表长拖体验目标已达成。
- 装配问题由真实旋转相位改变出生规划触发。负责人记录用户在其线程改定契约：每张图使用首次物理就绪、
  未旋转时的固定初态；每次独立真实生成复用它，成功后从初始方向恢复旋转，取消/错误保留点击前图。
  这是明确改变生成行为的产品契约，不再执行先前提出的“映射回当前视角”方案；不能描述为所有体验完全未变。
- `.8-initial` 源 `b8e8179ee2cc2c345adba59318655c3b7b7903fe`，Wasm 与 `.6` 哈希相同。
  1440/390 两个视口、各两个环境旋转相位的生成均 complete，初始化命令深相等；取消、Reduced Motion、
  键盘、完成后拖动及故意阻断演示 Wasm 的错误恢复专项通过。生成首轮约 29–30 秒，不是拖动后归静时间。
  仍仅为固定初态生成专项通过，正式依赖和真实 Obsidian/社区发行门槛不变。

用户随后在插件线程明确同意针对最终 `.8` 执行一次串行、有界回归。已交由 Atlas/Blog 原负责人按
A（最终宿主静态检查、154 测试、身份及受保护 API）→ B（页面与消费端闭环）→ C（宿主、Worker、
可见运行时及稳定性）→ D（19 场景质量和同期八态配对）执行。新轮次须固定配置和制品哈希，
不得复用现已指向 `.8` 包目录的旧 `.6` 配置；已通过的 `.8` 生成专项不重复。
这是执行授权，不是通过结果，也不是接受 22.5 秒长拖、修改阈值/参考图、推送、发布或正式升级的授权。
失败保留并分类；实现或标准如需改变，先报告请求决定。

该轮已完成，证据为 Atlas `outputs/validation/final-initial-compatibility-20261006/`。本线程独立读取
`attempts.json`、`B-search-classification.json`、quality 和 paired 报告，核对 18 项中 17 通过；
最终 `.8` 的静态检查、154 测试和受保护 API、页面/阅读/导航/形态、全部 C 项、D 质量与配对均通过。
B-search 的 21 例历史集合要求《股票与公司运作机制》，锁定公开快照不存在该文章；两包 manifest
哈希完全相同，Blog 既有文档已记录此缺口。评分尚未执行，不是 Top-5 达标，也不是本次 Atlas 索引遗漏证据。
具体修订提案尚待原负责人形成及用户审核；不得删例、缩分母、降低原 90% Top-5 阈值或重写旧失败。
本轮最长回稳 16.767 秒，15.529 / 16.603 / 16.767 秒三条超过原 15 秒观察线；旧 22.5 秒完整输入
未被本轮消除。负责人关于此前 15–18 秒接受范围的说明不等于可宣称严格 15 秒全部达标。
固定 Vault、正式版本与社区发行门槛仍未解除。

随后用户明确批准精确修订，仅将第 13 条改为查询 `金融 杠杆 折现值`、预期文章
`学科09：金融学重要模型`，其余 20 条与总数 21 不变。负责人仅在隔离 Blog 副本修改并运行一次，
2026-10-06 21:16（Asia/Shanghai）结果 21/21、100%，达到原 Top-5 ≥90% 阈值。
本线程独立核对 receipt、两行 diff、新旧 fixture 哈希及全部不变输入，确认只变第 13 例，
Atlas 包、公开内容、索引、算法、评分器、锁和旧矩阵证据均未变。
独立证据为 Blog `outputs/validation/atlas-host-inspector-20261006/search-fixture-revision/`；
原 B-search 失败不改写，以这份新版 fixture 通过证据闭合搜索阻塞。上述“尚待审核”保留为先前状态。
此次仅完成隔离验证，测试修订未纳入 Blog 主分支；后续正式回归若要复用，须另行保存获准的 fixture 修订。
未因此提交、推送、发布、升级依赖或安装插件，真实 Obsidian 验收仍待完成。

同日用户明确：物理、数学计算正确性与一致性，以及视觉、交互体验是 Atlas 核心价值；其他功能由本线程判断。
据此采用上表首版范围，不为功能对齐复制原生 Graph 的另一套力模型，不因首版缩减外围功能放宽核心验收。

## 已固化的日常命令

```text
npm run ci:source
npm run prepare:atlas -- <已批准的归档> <签名> <可信公钥>
npm run ci:full
```

源码 CI 不含 Atlas，也不宣称完整类型验收；完整 CI 的本地签名包要与本仓库的精确锁一致。
`lint:source` 使用官方插件的非类型规则；`lint` 使用完整推荐配置中的类型规则，仅扫描插件源码，不扫描闭源压缩制品。
lint 的 warning 与 error 分开报告，不以关闭官方错误规则换取通过。现存计时器弹出窗口建议及 1.13 设置搜索建议
需要结合真实宿主验收，不能将最低版本 1.11.7 的现有设置页盲目改成较新 API。
官方检查只是本地预检查，不等于平台审核结论。

`npm run benchmark` 是同一已验签 Atlas 的合成 50 / 500 / 4096 节点数据 API 基准，完整 CI 会记录它。
不截断节点，要求图与布局种子数量守恒；输出实际版本而非硬编码 0.1.6。
它不是 GPU 帧率、大型真实 Vault 或“不卡顿”的证明，当前不凭空设置机器相关的硬毫秒门槛。

## 固定 Vault 的人工验收

位置始终为本仓库 `test-vaults/AtlasPlugin-Test/`。需在兼容门槛通过且用户确认该 Vault 关闭/插件禁用后，
才替换经核验的 `main.js`、`manifest.json`、`styles.css`。保留全部笔记、data.json、工作区与启用设置。
每次验收记录插件源码/三文件 SHA-256、Atlas 版本/包摘要、Obsidian/Electron/操作系统版本及显示缩放。

| 项目 | 用户操作 | 预期和记录 |
| --- | --- | --- |
| 鼠标入口 | 点击 Ribbon 的 Atlas 图标 | 无需 Ctrl+P；全局星图可打开；命令仍可选 |
| 选择与阅读 | 单击节点，再点击“阅读原文” | 前者只显示卡片，后者打开正确笔记；星图仍在；拖动不会误打开 |
| 同名与异常 | 分别打开同名不同路径笔记；移走目标后重试 | 打开准确文件；失败有可理解提示，不无限旋转、不抛未处理拒绝 |
| 列表键盘 | Tab 到笔记，Enter 阅读，Shift+F10/菜单键打开菜单 | 菜单靠近焦点、可操作；标签/未解析节点措辞准确；未解析创建必须确认 |
| 多面板 | 两个不同局部中心、不同搜索条件 | 筛选独立，正文搜索互不清空，显式阅读不夺走星图 |
| 弹出窗口 | 将星图移到独立窗口，再打开菜单、关闭窗口 | 坐标、键盘、计时器和资源释放正常；未实测不得宣称兼容 |
| 工作区恢复 | 调整面板位置、重开、禁用再启用插件 | 原位置与筛选按宿主契约恢复，插件不主动清除用户标签 |
| 离线 | 断网后重新启用插件，打开多个图 | 无 CDN、下载或遥测依赖；离线 Worker/Wasm 可用 |
| 生命周期 | 连续打开/关闭/重启插件；布局中关闭 | 不晚到挂载、不遗留图线程或 WebGL；观察多轮资源趋势，不只看一次 GC |
| 外观与可访问性 | 深/浅色、窄面板、系统 Reduced Motion、键盘/读屏 | 控制栏可读、无遮挡；真实星图语义与文本后备可用；留截图 |
| 真实大库 | 授权的本地测试内容，记录节点/边/正文规模 | 不丢节点；测初次可用、筛选延迟、拖动响应与资源；不上传笔记/标题/路径 |
| 干净安装与升级 | 批准后用发行三文件安装，再升级相同 ID | 社区安装不依赖额外 assets；设置和身份记录不被覆盖；记录恢复旧包办法 |

结果存本产品 `artifacts/validation/`，标记 pass / fail / not-run；未执行不能勾选通过。
移动端继续关闭，桌面系统上的结果不能当作 iOS/Android 结果。

## 官方审核与发布

2026-10-07 口径校正：社区审核是官方目录的准入要求，闭源代码须披露并个案判断；
公开说明未定义统一、独立的“闭源前置审批”，也未统一要求所有闭源依赖交出全部源码。
因此将原先笼统的“闭源审核阻塞”收敛为正常提交中的披露与官方待确认事项，不增加自设审批门槛。
插件适配层的 MIT 与 Atlas 专有许可分别适用；前者不能覆盖随包执行的后者。

2026-10-06 安装正式包后再次只读核对官方下列四份说明：开发者政策、插件提交要求、提交插件、管理条目。
当时插件仓库仍为 Private 且没有 Release。2026-10-07 用户条件授权并完成历史检查后，插件仓库已改为 Public；
Atlas 仓库继续 Private，没有授予新增源码访问。随后用户授权发布插件 0.1.0 的三个安装文件并推进社区提交。
后续拟用插件 Tag **`0.1.0`**（必须与 manifest 完全一致，不使用 Atlas 的 `v0.1.7`），
发布三个独立资产 `main.js` / `manifest.json` / `styles.css`，ZIP 仅作便利下载。
已验证资产来自 `artifacts/validation/ci/full-12ftNh/workspace/dist/seetheforest-atlas/`；
Atlas 包和插件安装文件是两层不同的制品，不能把私有 Atlas Release 当成用户可安装的插件 Release。

公开发行仓库已确定为现有 `SeeTForest/seetheforest-obsidian-plugin`，不另建发行库。
Atlas 源码仓库保持 Private；官方 App 的具体可读仓库及依赖构建输入交付须另行确认。
目前的预沟通草稿未发送，不把用户接受审核路线等同于已授权第三方访问整个源码仓库。

按 2026-10-06 官方文档，社区目录支持审核源代码与构建一致性，也提供已有条目的 Review branch 预检查。
私有源码可通过官方 GitHub App 的受限读取路线接受审核，但此能力不等于自动批准闭源第三方依赖。
本插件的 `file:vendor/atlas.tgz` 是不入 Git 的构建输入：提交时须向官方说明，并确认如何取得和验证该依赖以及复现构建，
不能期待公开源码仓库克隆后无需额外输入就能安装，也不能把私有读取 Token 写进仓库供审核器使用。

2026-10-06 用户已接受向官方提供受限、只读源码审核的路线；这不是已授予访问，也不是对整个 Atlas 仓库、
所有历史或其他产品授权读取。实际安装 GitHub App、指定可读仓库、上传材料前，仍需确认精确范围。
Atlas 基线与 `.5-selection` 内 LICENSE 均默认不授予复制/分发权，要求另行书面协议。
用户已于 2026-10-06 单独确认插件内免费分发及安装运行授权，记录于根 `ATLAS-RUNTIME-PERMISSION.txt`，
仅覆盖通过验收的运行制品，不公开 Atlas 源码、不授予 Atlas 单独再分发权；后续构建随 `main.js` 保留全文。
这是权利方的插件内分发许可，不是官方审核结果或发布操作授权。

### 官方预沟通材料（草稿，尚未发送）

对外仅使用产品工程信息和合成截图，不包含笔记、签名私钥、机器路径、内部服务或未获准的源码。
可向官方说明并确认以下内容，之后再确定审核输入方案：

> See the Forest Atlas is an Obsidian plugin built by `seetheforest-obsidian-plugin`.
> The integration layer uses MIT; its Atlas rendering and layout dependency remains proprietary.
> The three-file plugin bundles its Worker and Wasm resources for offline use, with license notices retained.
> It has no telemetry, accounts, remote runtime downloads or self-updates.
>
> The rights holder has authorized distribution of the accepted Atlas runtime inside this plugin.
> As part of the normal community submission, please confirm what evidence you need for this closed-source
> dependency and how your build verifier should receive its pinned, signed build input.
> If source access is necessary, we can discuss restricted read-only access with an explicitly approved scope.
> We do not assume that a separate approval process or access to the entire Atlas repository is required.
> JavaScript minification and bundled Wasm are disclosed; no credentials will be placed in the repository.

官方受限源码审核机制并不自动说明能跨仓库读取某个私有依赖，不能自行设计绕过扫描的安装步骤。
依赖交付方式依官方反馈确定；当前先准备与已验收源码、制品对应的披露、许可和构建说明，不擅自提供源码权限。

### 首次提交字段（本地草稿，未发送）

| 字段 | 拟提交内容 |
| --- | --- |
| 名称 / ID | See the Forest Atlas / `seetheforest-atlas` |
| 插件版本 / Tag | `0.1.0` / `0.1.0` |
| 简介 | Explore your local notes as an interactive knowledge constellation. |
| 适用范围 | Desktop only；最低 Obsidian 1.11.7；移动端未验证 |
| 许可 | 原创插件适配层 MIT；Atlas 专有闭源依赖；第三方许可证分别保留 |
| 网络与隐私 | 已安装插件无运行时下载、遥测、账号或云上传；笔记不上传；不自动改写笔记，明确阅读未解析链接时仍需用户确认创建 |
| 分发形式 | 三个独立安装资产，Worker/Wasm 内嵌；不向用户发放独立 Atlas tgz |
| 费用 | 首版本插件免费，无支付或账号要求 |
| 发行仓库 / 提交身份 | `https://github.com/SeeTForest/seetheforest-obsidian-plugin` 已 Public；社区 Owner 须由登录用户选择本人或其所属组织 |

官方所需截图只能使用合成或明确获准公开的数据。用户本机验收不等于全平台压力测试，已知长拖限制须保留。

获得明确授权后按顺序执行：

1. 审阅并保存源码；核验拟公开 Git 历史、README、MIT、闭源披露、隐私与未支持项；公开仓库是单独动作。
2. 先用本地脚本完成最终完整管线并保存精确源码与签名依赖证据；需要托管复核时，再经批准配置 CI Environment、只读制品凭据及分支保护。源码跨平台检查复用相同脚本。
3. 准备 README 中的闭源披露、合法分发依据与构建说明，将依赖交付方式列为社区提交中的待确认事项；可预沟通但不将其设为额外强制前置审批。若官方需要访问，只授予用户批准的范围，绝不公开私钥。
4. 发布同一已验收源码的插件 Tag/Release，上传 `main.js`、`manifest.json`、`styles.css` 三个独立资产。
   ZIP 只是手动安装便利物，不能代替这三个社区安装资产；附版本说明、双版本追溯与已知限制。
5. 按官方社区目录表单提交，由实际账号/组织认领；随正常审核处理 Atlas 闭源依赖的个案判断和构建核验反馈，截图只能用合成或明确公开内容。
6. 处理官方审核反馈；获准后从社区目录实际下载安装并验证更新。审核耗时和通过与否不能预先承诺。

## 官方依据

- [提交插件](https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin)
- [开发者政策：闭源披露、版权、遥测与自更新](https://docs.obsidian.md/community-directory/developer-policies)
- [插件提交要求](https://docs.obsidian.md/community-directory/submission-requirements-for-plugins)
- [管理条目、构建核验、私有源码审核](https://docs.obsidian.md/community-directory/manage-entry)
- [社区 FAQ 与本地官方 lint](https://docs.obsidian.md/community-directory/faq)
- [官方 ESLint 插件](https://github.com/obsidianmd/eslint-plugin)

这些文档描述平台流程；对本项目的审核结论仍待实际申请，不能由本地测试推定。
