# 验证记录与交付闸门

## 当前测试位置与历史路径迁移（2026-10-05）

唯一活动测试 Vault 为本仓库 `test-vaults/AtlasPlugin-Test/`，从原
Ops `outputs/obsidian-validation-20261005/AtlasPlugin-Test/` 原样迁移。后续原地迭代，不重新建库。
插件构建候选按批次保存在本仓库 `artifacts/validation/`；这是制品隔离，不是 Vault 隔离重建。

下文及原始回执的 Ops `outputs/obsidian-candidate-20260929/`、`outputs/obsidian-candidate-gates-20260929/`、
`outputs/obsidian-community-package-20260930/`、`outputs/obsidian-validation-20261005/` 均已迁入
本仓库 `artifacts/validation/<原目录名>/`。历史路径仅表示当时位置；失败证据不重写、不删除。
前三个旧消费者的 `node_modules/` 清理，源码、锁文件、签名包和制品保留；最新消费者依赖保留。
本次迁移不新增真实 Obsidian 验收通过结论，也不更改 Atlas 或 Blog。

## 验收对象说明

2026-10-05 补充：本文的“插件”指 `seetheforest-obsidian-plugin` 构建的 **See the Forest Atlas**，
安装 ID 为 `seetheforest-atlas`，不是 Atlas 仓库直接导出的制品。下文按日期保留历史验证事实，
其中的构建成功、失败或授权均只适用于记录所指的版本和当时范围，不自动延续为当前发布授权。

验收记录需分别列明插件版本与源码身份、内含 Atlas 版本与归档哈希、实际安装制品哈希；
具体记录位置见 [社区安装制品契约](community-package.md)。插件版本 `0.1.0` 与候选组件版本
`0.1.7-obsidian.4-gates` 是两个独立版本，不能互相代替。
Atlas 组件测试、固定 Blog 兼容回归、插件构建检查和真实 Obsidian 验收分别报告；任何一项通过不替代其他项。
本次仅澄清命名和追溯规则，不新增安装成功、真实 Obsidian 验收或正式发布结论。

## 2026-09-28：初始记录

日期：2026-09-28。状态：开发候选；没有安装包或安装成功声明。

## 已核验

- 插件在独立空 Git 仓库内建立；未重新初始化 Git，未登记 Ops 子模块，未修改 Homepage/数字小妖。
- 基线 Atlas 源码 dc8d0a3cd3af67faed90cdc42bfb460a87aa8c49。
- 已独立校验 Atlas 0.1.6，归档 SHA-256：
  `10be507aebcdd845d3bd753e63c2ba74c65f6e560ae09a94b6317fc61961c0d3`。
  公钥指纹、Ed25519 签名、保护声明及文件哈希通过；验签回执位于 outputs/atlas-verification.json。
- Plugin TypeScript 检查通过；11 项自动测试通过。
- Atlas 当前候选：237 项测试通过；类型检查、lint、格式检查、Rust 构建及私有边界检查通过。
- Atlas 15 组旧接口数据回归与已验签 0.1.6 逐值一致，包含坐标和布局种子。
- Atlas 开发制品保护检查通过：12 文件、3 JS、无源码/Source Map/私有路径，Wasm ABI 和独立消费构建通过。
  这是未签名开发检查产物，没有装入 Blog 或插件，不可作为交付包。
- Atlas 既有 10k 有界投影基准通过；这不是 10k 全节点交互测试。
- 本机 Obsidian 安装器 ProductVersion 为 1.11.7.0，尚未在本次任务中启动、安装或改动用户 Vault。

## 合成规模测量

Node 24、已验签 Atlas 0.1.6 数据 API、稀疏合成链、8 个目录；单次观测而非统计基准。

| 节点/边       | 数据整理 | 完整布局  | 种子准备 | 观测堆占用 |
| ------------- | -------- | --------- | -------- | ---------- |
| 50 / 49       | 1 ms     | 65 ms     | 20 ms    | 10 MiB     |
| 500 / 499     | 2 ms     | 1,272 ms  | 236 ms   | 37 MiB     |
| 4,096 / 4,095 | 12 ms    | 12,925 ms | 2,388 ms | 127 MiB    |

原始回执 outputs/synthetic-performance.json。堆占用是当前进程观测，不是资源释放后的稳定驻留值。
结果要求把完整布局移出主线程，并展示真实等待状态；候选已采用独立布局 Worker 和取消机制。
未测真实 Vault、GPU、帧率、拖动延迟与 Electron 内存；不能据此声称“4k 流畅”。

## 当前阻塞

`npm run build` 在独立验签后拒绝 0.1.6：该版本缺少宿主 API v1。
用户已授权本轮 commit/push；源码保存不代表 Atlas 或插件已经发行。
正式 Atlas 签名要求干净提交；使用签名私钥与发布仍需相应授权，目前尚未执行。
没有绕过验签、手改压缩包或源码直连。Blog 两份依赖锁仍未改变。

## 取得合格签名制品后的必做验证

1. 新制品签名/哈希/公开 API 通过，更新本插件锁与 npm lock；正式构建、制品白名单和 ZIP 摘要。
2. 独立测试 Vault 包含中文、Wiki/Markdown、同名、别名、锚点/块、嵌入、标签、附件、未解析、publish:false。
3. 实际 Obsidian 安装：全局/局部、点击、拖动不误开、缩放、返回、菜单、颜色、增删改名、禁用/重开。
4. Blog 不传 host 的同内容/同视口视觉与交互回归，默认/hover/selected/拖动/生成/Reduced Motion/移动。
5. 多面板和窗口、缩放、主题切换、离线、Worker/GPU 销毁；恢复错误时不显示伪造部分图。
6. 真实大图只读验证、帧率/交互/内存；截图不得包含未获传播授权的私有笔记。
7. 完成功能对照表剩余项；移动 API 和真机通过后才移除桌面限制。

预期隔离测试安装目录：`outputs/obsidian-test-vault/.obsidian/plugins/seetheforest-atlas/`。
此目录是后续验证目标，目前没有安装结果、截图或录屏；不把准备路径写成已安装证据。

## 2026-09-28 后续：每面板状态与工作区恢复

本节记录插件后续增量，不把前述 Atlas 开发检查升级为兼容验收通过。

- 搜索、标签/附件/未解析/孤立节点开关、局部深度、方向、跟随分别保存在每个面板的工作区状态中。
- 旧工作区继承插件默认值的独立副本；点击标签只改变当前面板，恢复状态时同步控件。
- 正文读取需求合并全部面板及全局排除/颜色条件；清空所有相关条件后，下一次索引不再请求正文。
- 查询变化取消该面板未完成的布局准备；工作区状态白名单不包含正文、完整图或全局设置。
- `npm run typecheck` 通过；`npm test` 共 19 项通过（此前 11 项，加状态单元测试 5 项、真实视图控制器的宿主替身测试 3 项）。
- 宿主替身测试使用真实插件入口和视图逻辑，但替换 Obsidian、Vault 读取及 Atlas Runtime；不验证真实 DOM 布局、GPU、Electron、物理或视觉效果，不等于 Obsidian 实装验收。
- `npm run build` 已执行，仍因锁定的已签名 Atlas 0.1.6 缺少 native host API v1 而拒绝构建；未绕过闸门。
- `npm run verify:package` 已执行，因无构建制品、缺少 `dist/seetheforest-atlas/integrity.json` 而失败；不能计为通过。
- 本轮未修改 Atlas、Blog、官网源码或依赖锁，未生成安装包，未安装插件、改动用户笔记或执行 commit/push/发布。

下一闸门仍为取得具备宿主 API、签名核验通过且完成 Blog 兼容验收的 Atlas 制品，再进行隔离安装和真实 Obsidian 验证。

## 2026-09-29：同一签名候选的隔离插件构建

本轮明确授权本地签名候选与两个隔离消费者验证，不授权正式发布或正式依赖升级。
复用已存在的 clean-source 签名包，未重新读取私钥或重新签名：

- Atlas source `9ebe5bed6b26723f49c8be17447b569e1cedcb45`；版本 `0.1.7-obsidian.3-settling`。
- 归档 SHA-256 `e45ec833e1169cdd810d3516b332beb6e3f2751251ad318af9afa983c452b1ba`。
- 独立验签、公钥指纹、干净来源声明、保护清单及文件哈希通过。
- 插件副本位于 Ops `outputs/obsidian-candidate-20260929/consumer/`；源码包含本工作区尚未提交的面板状态改动。
- 隔离副本类型检查、22 项测试、build、verify:package 均通过，已生成仅供本地验证的 ZIP。
- emitted layout Worker 在 Node VM 中离线处理 3 节点 / 3 边并生成 3 个种子；Wasm 编译及缓存物理导出存在性检查通过。这不是实际浏览器 Worker、Electron CSP、GPU 或离线 Obsidian 验收。
- 已将同字节运行文件放入合成 `test-vault/.obsidian/plugins/seetheforest-atlas/`，没有启动该 Vault、启用插件或操作用户笔记库。

实际发现并处理：

1. 普通 `npm install` 沿用了 0.1.6 的本地归档锁，构建在逐文件校验阶段正确拒绝；隔离副本显式安装新 tarball 更新 lock 后解除。正式锁未动。
2. `@pixi/colord@2.9.6` npm 包省略许可证全文。插件 notices 脚本增加仅限此精确版本与 MIT 声明的上游原文补充；未知版本/许可继续失败，不修改第三方或 Atlas 包。新增 3 项对应测试。
   核验来源：[npm 精确版本元数据](https://registry.npmjs.org/@pixi%2Fcolord/2.9.6) 的 gitHead，及
   [该提交的许可证](https://raw.githubusercontent.com/pixijs/colord/5344fbf77b736f81cd33c21050021bc09bc9dd1d/LICENSE.md)，核验日期 2026-09-29。
3. Node VM 检查初始未提供浏览器 Worker 具备的 timer globals，出现布局错误；补全测试环境的标准 timer globals 后通过，未修改布局 Worker 或 Atlas 算法。

真实实装阻塞：已阅读 computer-use 技能，但本会话工具目录没有必需的 `node_repl`，无法初始化其 Windows 界面控制入口。
未绕过工具限制操作正在运行的用户 Obsidian；加载、点击打开、多面板实机、离线实机、关闭/禁用释放均仍待验证。
Blog 侧由原 Atlas/Blog 负责人对同一包独立回归，不能用插件静态构建替代其验收。
完整本地回执、首次失败日志和制品身份见 Ops `outputs/obsidian-candidate-20260929/`。

同日 Blog 新回执 `outputs/atlas-blog-regression-20260929/quality-all/graph-quality-report.json`：
19 场景全部尝试，17 个执行到末尾，行为 82/97、视觉 8/8，整体 `passed:false`。
强拖动和 Fractional DPR 场景均存在 15 秒未归静，移动面板遮挡、接触能量、局部传播等仍未通过；
不是只有 Obsidian 桌面工具缺失这一项阻塞，正式候选升级仍为 No-Go。

## 2026-09-30：门禁收敛候选与提交前复核

保留上节旧候选失败历史，以下仅适用于新签名候选：

- Atlas `0.1.7-obsidian.4-gates`，干净来源 `280b91c881833652220c935154e5aa607ef8f2ea`；归档 SHA-256 `a1a2d974b2a240d0be0be3c40bb72f9d1e51135b9a05adc27583e63643c02109`。
- 同包插件独立验签、保护清单/哈希、typecheck、22 项测试、build、verify:package 全通过；隔离证据位于 Ops `outputs/obsidian-candidate-gates-20260929/`。
- 相比上一候选，Atlas JavaScript、Worker、Wasm 哈希未变，仅包元数据与移动面板 CSS 改变。测试采样维护另保存于 `f155fb8`，不改变候选运行代码。
- Blog 原负责人完成全矩阵，主线程独立核验：19/19 场景、106/106 行为、8/8 视觉，页面/异步/清理错误为空。证据为 Ops `outputs/atlas-gate-convergence-20260929/quality-final/graph-quality-report.json`。
- 验收限定于固定 Blog `fb017aa4b6343772d133cb3ce628b26f749b4466` 的既有隔离适配副本及公开 Notes `018ca791e57f38fbce91a2d069cfa2f7624df5fd`（558 节点 / 846 边）；不覆盖当前 Blog 工作树全部变更。
- 15 秒体验目标仍有 16368 / 17231 ms 超标，手机局部 3101 ms 超过旧 3100 ms。旧绝对接触能量门槛改为符合现行软接触模型的几何、能量与真实归静检查；没有修改物理参数或提前停止来刷绿。
- 新制品 layout Worker 在禁用网络的 Node VM 完成合成 3 节点 / 3 边布局，Wasm 可编译；此检查仍不等于真实 Electron / Worker / Obsidian 离线验收。
- 提交前重新运行插件工作区 typecheck、22 项测试和 diff 检查通过。正式锁仍为 0.1.6，构建通过的事实只针对上述隔离候选，不绕过正式锁的宿主 API 闸门。
- 用户本轮仅授权 commit + push；不发布 npm、不升级正式消费者、不部署。真实 Obsidian UI、市场分发许可和发行验收仍待完成。

## 2026-09-30 后续：社区安装三文件适配

用户要求继续研发，本轮仅修改插件打包与资源加载，不改 Atlas / Blog，不正式升级依赖、不提交、不推送或发布。

- 官方安装规则重新核验：运行安装文件为 main.js / manifest.json / styles.css，不能依赖 ZIP 附加 assets 目录。
- 三种资源随 main.js 内嵌，Atlas Worker/Wasm 和插件布局 Worker 与上一已验候选逐字节相同；本地 Blob URL 代替读取插件目录，不访问网络。
- Atlas/第三方许可证全文随 main.js 的可读注释交付，三文件白名单、字节哈希和通知完整性检查通过。
- 当前插件工作区：typecheck、27 项测试、diff 检查通过；`npm run build` 仍明确拒绝正式锁 0.1.6 缺少宿主 API，未绕过。
- 新隔离 consumer 使用同一签名 0.1.7-obsidian.4-gates：独立验签、27 项测试、构建、verify:package、verify:installed-runtime、package 均通过。
- 实际构建出的 main.js 在 Node VM 的最小 Obsidian 宿主替身中加载，不给 manifest.dir，禁止网络与 Vault adapter 读取；确认三个资源字节正确、Wasm 可编译、三节点布局可计算、取消终止布局任务、重复加载不增加 URL、两实例独立、重复卸载后 Blob URL 为零。
- VM 验证初期缺少浏览器 window/document 导致模块初始化失败；补充测试环境的标准全局及 Solid 事件注册桩后通过，没有改写 Atlas 以适配测试。测试未挂载 DOM、没有浏览器 Worker 或 GPU，不能称为真实 Obsidian 验收。
- 运行文件大小：main.js 964420 字节，manifest.json 261 字节，styles.css 55150 字节。ZIP 提取后恰好三个文件且与被测文件哈希一致。
- 本地测试 ZIP SHA-256：`4eaab185c44d49ad2d0b0404fc43fc34a04a41a875e82778c7d7d120845e790a`。版本号仍是开发候选 0.1.0，不是正式发行。
- 回执：Ops `outputs/obsidian-community-package-20260930/` 中 checks.json、identity.json、consumer/outputs/installed-runtime-check.json。

本轮重新读取 computer-use 技能并检查工具目录，仍无其要求的 node_repl，未执行 Windows 界面控制。
真实 Obsidian、浏览器 CSP、GPU、原生功能差距、移动端、插件 LICENSE 与闭源审核依然是独立待办。
三文件适配只是解除技术分发格式缺口，不是市场准入通过。当前详情见 community-package.md。

## 2026-10-05：节点选择与显式阅读分离

- 修复目标：单击节点或对节点按 Enter/空格只选中并显示卡片；“阅读原文”、右键打开、文本后备笔记按钮才打开原生笔记。拖动抑制沿用 Atlas，阅读标签复用且星图保留。
- 插件显式设置 `host.nodeActivation: "select"`；上游省略该参数仍保持旧原生宿主打开行为，Blog 无 host 路径不变。构建拒绝缺少此参数的签名包，不静默安装仍会抢跳转的旧版本。
- Atlas 本地提交 `9e17d347b8ec59f166338f507f0274376a66cfa4`；签名版本 `0.1.7-obsidian.5-selection`；归档 SHA-256 `faa718230ac055a6479cc826a7f0a7bc93536cc12fa8a5e5e7e16ff8f1d7077e`。
- 插件来源：`edf7dffe6ad4afc88d0dc0719f144ff9556ee041` 加本轮未提交修改，包括 Ribbon 提示明确化、选择模式接入、门禁、测试和文档。逐文件来源摘要见回执，不将候选误标为干净插件提交。
- 隔离目录 `artifacts/validation/select-before-read-20261005/`：独立验签、候选锁定、安装、typecheck、30 项测试、build、verify:package、verify:installed-runtime、package 共 9 步通过。正式插件及 Blog/官网锁不变。
- 新增测试覆盖鼠标 Ribbon、适配器选择模式与显式打开回调、原生阅读文件定位/标签复用/修饰键；宿主替身不是真实 Obsidian UI。既有三文件离线 VM 检查继续通过。
- Atlas Worker/Wasm 与插件布局 Worker 对比上一候选字节一致；不以改变物理计算或渲染样式处理导航问题。
- 本地插件 0.1.0 ZIP：`consumer/outputs/seetheforest-atlas-obsidian-0.1.0.zip`；SHA-256 `f4eac80d4b1ff74a044069085321c8b883a24c8d5d2cde0757da2f3da4de71ae`。这是测试候选，不是社区发行。
- 构建时尚未更新固定测试 Vault；用户已确认关闭。安装、Blog 全矩阵及真实 Obsidian 结果须分别追加，不能预先计为通过。

本轮 Blog 首次全矩阵（原负责人执行，本线程读取 JSON 核对）：

- 固定 Blog `fb017aa4b6343772d133cb3ce628b26f749b4466`、公开 Notes `018ca791e57f38fbce91a2d069cfa2f7624df5fd`，558 节点 / 846 边；沿用既有 8 张截图，不更新基线或阈值。
- 19 个场景完成，行为 104/106，视觉 8/8，整体 `passed: false`。证据位于 Atlas 工程 `outputs/validation/node-activation/quality/graph-quality-report.json`。
- `ambient-idle-does-not-restart-mechanical-integration`：steps 3729 → 3729，但 ticks 4282 → 4282，未观察到动态计数继续推进。
- `atlas-worker-rest-stability-7`：归静后的观察窗口内 steps 490 → 493。不能只根据物理制品未变化就宣布此项通过；根因由上游做同环境基线对照。
- 原负责人另报告 4 次归静超过 15 秒体验目标，最长约 23.9 秒。它们并非本次硬门禁失败项，但不应隐去。
- 完整兼容门槛未通过前，保留原固定 Vault 运行文件；不推送、发布或升级正式锁。后续结果另行追加，保留本次失败证据。

同日后续收敛（仍为 No-Go）：

- 上一 `.4-gates` 同环境完整对照为 19/19 场景完成、105/106 行为、8/8 视觉；同样失败于静息 tick 检查。源码规定静息动态延迟 1800ms，而旧用例约在 1470ms 内要求 tick 增长，存在测试时序冲突。
- 原 Atlas/Blog 负责人仅修改忽略目录中的测试采样：有界等待真实 ambient 阶段，从首次 rest 起持续观察 Worker 提交/确认步数，并等待对应 DOM 绘制发布。保留全部物理不变量、截图基线和阈值，不改产品 runtime 或签名包；原始测试、精确 diff、身份和 7 项控制测试见 Atlas `outputs/validation/node-activation/sampling-evidence/`。
- 修正采样后的矩阵见同目录 `quality-sampling-2/graph-quality-report.json`：18/19 场景完成，行为 104/105、视觉 3/8，`completed: false`、`passed: false`。前一次预览未就绪的启动失败单独保存在 `quality-sampling-1/`。
- 本轮 ambient 通过，10 次归静观察没有发现 rest 后新增 Worker 积分；其中一次 DOM 从 621 补发至 625，而首次 rest 的 Worker 已确认 625。此证据说明确有延迟发布问题，但不能据此将首次失败改写为通过。
- 当前剩余：`inspectDirectManipulationCameraLock` 等待相机运动窗口超时 30000ms；hover-focus、selected-ordinary、selected-moc、active-drag、released-rest 五张截图超出原阈值。页面、异步与清理错误为空；截图差异根因尚未确认，不能拼接前轮视觉通过与本轮行为通过作为完整验收。
- 固定测试 Vault 未更新，新 ZIP 保留但不用于替换现有测试版本。需先收敛相机/截图专项诊断；如果需要改变产品默认行为或验收标准，另行取得用户明确决定。
- 上游最终交接为 Atlas `outputs/validation/node-activation/sampling-evidence/REVIEW.md`；观察器控制测试后续补至 8/8 通过。已结束本轮验证，未重复完整重跑寻找通过；下一最小范围是相机动作窗口与截图动态相位的只读时序诊断。

## 2026-10-05：插件控制栏与笔记列表布局

- 仅调整插件 `src/main.ts` 与局部作用域 `styles.css`：顶部搜索、左侧可折叠控制栏、右侧星图；窄面板使用容器查询上下排列，控制栏独立滚动。未修改 Atlas 主题 token、源码、签名制品、物理参数、正式依赖锁或 Blog。
- 过滤分为显示内容与局部探索；全局图隐藏局部选项，但不重置保存值。笔记列表改为语义 ul/li、标题与路径两行、左对齐、长文本换行、同名路径辨识、空结果提示；保留打开/右键/键盘语义。
- 工作区及隔离消费者 typecheck、32 项测试通过。隔离候选仍消费同一已签名 `.5-selection`；9 步验签/构建/制品/VM/打包流程全部通过，Worker、Wasm、布局 Worker 原字节未变。
- 回执与包：`artifacts/validation/ui-layout-20261005/identity.json`、`checks.json`、`consumer/outputs/`。该包包括上一轮尚未安装的选择/阅读分离改动，不能绕开其 Blog No-Go。
- `check-layout.mjs` 通过本机 Chromium 运行真实插件 bundle 与签名 Atlas，使用合成笔记及 Obsidian DOM/API 替身。1440×900 全局、1024×768 局部、390×844 窄面板、1024×768 浅色主题四组均无页面异常或横向溢出，局部选项显隐正确，星图区高度不少于 340px，列表左对齐。
- 四张截图已人工检查：`wide.png`、`local.png`、`narrow.png`、`light.png`；`layout-check.json` 保存尺寸结果。替身控件/宿主 CSS 不等同真实 Obsidian，截图不构成真实实装、完整无障碍或移动端兼容验收。
- 固定 `test-vaults/AtlasPlugin-Test/` 未修改；本轮无 commit、push、发布。上一节 Blog 相机/交互截图未过项继续保留。
- 正式工作区也执行了 build 与 verify:package：前者按预期被 0.1.6 缺宿主 API 拦截，后者因没有 package-integrity.json 失败；不能记为通过。上文构建成功仅针对已验签 `.5-selection` 的隔离消费者。

### 同日调整：控制栏置于右侧

按用户要求将宽面板改为左侧星图、右侧 260px 控制栏；窄面板仍为上方控制、下方星图。仅修改宿主 CSS Grid 区域及文档，构建后的 main.js、manifest.json 和 Atlas 依赖哈希与上一布局候选完全一致。
`artifacts/validation/ui-right-sidebar-20261005/` 保存独立制品及截图；隔离 typecheck、32 项测试、构建/制品/VM 检查通过。四组浏览器检查通过，新增宽屏控制栏位于星图右侧的几何断言，窄屏仍无横向溢出。
已查看宽屏截图；浏览器宿主替身不等于真实 Obsidian 实装。固定 Vault 未更新，Blog No-Go 不变，无提交、推送或发布。

### 同日源码保存授权

用户随后明确要求 commit + push。本次仅保存插件仓库上述源码、测试与文档；提交前再次运行 typecheck、32 项测试与 diff 检查通过。Atlas 本地候选提交、正式依赖锁、测试 Vault、发布与部署均不在此次推送范围，Blog No-Go 继续有效；前文“未提交”指对应候选构建时的历史状态。
