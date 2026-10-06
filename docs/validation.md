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

## 2026-10-05：CI 脚本化与开闭源许可边界

- 新增公共源码 CI 与受保护手动构建 CI，均配置 Ubuntu / Windows、Node 24；工作流 SHA 固定、只读权限、无私有缓存、无自动发布/制品上传。远端 Environment、Secret 与分支保护未配置，未执行托管 Actions；Linux 运行仍待托管矩阵验证。
- 本机 `ci:source`：32 项插件测试和 7 项 CI 测试通过，不需要 Atlas 包；不把它记为完整类型或运行兼容检查。
- 本机正式 0.1.6 锁的 `ci:full` 按预期在宿主接口预检失败，失败阶段和原因日志被保留；没有升级锁或绕过门禁。
- 同一 `.5-selection` 签名包的隔离消费者通过完整管线：验签、宿主契约、安装、typecheck、32 + 7 项测试、构建、三文件校验、真实包 VM 与 ZIP 回读。
- 候选证据目录：`artifacts/validation/ci-candidate-d653011abb3b45f9b2846da0b1401704/`；其中首次 7 项 CI 测试曾因嵌套 Windows 测试路径过长失败，改用短的合成临时 fixture 后通过。保留失败回执，不修改原失败记录。正式构建证据继续位于产品目录，不创建新人工 Vault。
- 新增负例覆盖版本/最低宿主版本/许可漂移、公私依赖分离、宿主接口不足、哈希/签名/公钥不可信、ZIP 内容篡改、工作流隔离和失败退出回执。
- ZIP 使用固定开发依赖 fflate 替代平台特定 tar 创建行为；相同输入重复 ZIP 一致，额外由 Windows 系统 tar 读取确认只有三个安装文件。actionlint v1.7.7 检查两份工作流通过。
- 用户明确插件适配层 MIT、Atlas 闭源，已增加 LICENSE、package 许可元数据及 main.js 中插件 MIT 通知。Atlas 与第三方许可完整保留，整个组合包不被宣称为全部 MIT。
- 对比上一右侧布局候选，Atlas Worker、Wasm 和插件布局 Worker 的哈希全部相同。未修改任何 Atlas / Blog 源码、正式锁、物理参数或运行样式；未重新执行 Blog 全矩阵，也未覆盖固定测试 Vault。
- 本轮不 commit、push、发布或变更远端可见性。完整 Blog No-Go、真实 Obsidian 验收、Atlas 正式 Release 与再分发/市场审核仍为独立阻塞；详见 `ci.md`。

## 2026-10-06：生产化加固与官方 lint

- 首版范围由用户明确为 Atlas 物理/数学正确性与一致性、视觉及交互优先；保留可靠全局/局部探索、现有搜索过滤、阅读和离线能力。高级搜索、力/显示参数滑块、方向箭头与创建时间动画后续安排，不降低核心兼容要求。
- 插件层增加异步加载/卸载保护、导航失败提示、键盘菜单与公开 `file-menu` 扩展事件；卸载释放资源但不主动删除工作区标签。卸载前已请求的设置保存继续完成，卸载后不接受新保存。未修改 Atlas 算法、运行制品或默认视觉。
- 新增 6 项宿主替身测试，总计 38/38；CI 契约测试 7/7；完整类型检查通过。官方 ESLint 推荐配置为 0 error / 7 warning：6 项计时器/弹出窗口建议，1 项较新设置搜索 API 建议。保留最低 Obsidian 1.11.7，未用禁用错误规则或抬高最低版本掩盖问题；真实弹出窗口等仍待实测。
- 公共源码隔离管线通过，回执 `artifacts/validation/ci/source-MO4zRh/receipt.json`；此前一次源码 lint 因既有 `_topologyChanged` 占位参数失败，配置对齐既有未使用参数约定后通过，失败记录保留。
- 同一已验签 `.5-selection` 的完整隔离管线通过：`artifacts/validation/ci-candidate-d653011abb3b45f9b2846da0b1401704/artifacts/validation/ci/full-oTVo5c/receipt.json`。包含验签、宿主接口、lint、typecheck、38 + 7 项测试、构建、三文件/VM 校验、合成基准与 ZIP 回读。回执按文件哈希追溯，不冒称根仓库正式依赖构建；完整快照后的唯一检查配置差异是公共源码 lint 对未使用占位参数的处理。
- 50 / 500 / 4096 节点合成数据 API 的 layout 时间分别约 71 / 1247 / 15580 ms，seed 约 23 / 248 / 2641 ms；4096 节点记录 heap 162 MiB。环境 Node v24.13.1 / Windows，节点与边不截断。此项不是浏览器归静时间、GPU 帧率或真实大型 Vault 验收，不能由这些数字宣称流畅。
- 与此前右侧布局候选相比，Atlas Worker、Wasm 与插件布局 Worker 哈希全部不变。正式 Atlas 锁仍为 0.1.6，固定测试 Vault 未覆盖，未运行真实 Obsidian 验收。
- Atlas 原负责人已获准整理采样测试并执行有界完整回归，但因其线程随后收到用户“提交、推送、部署”请求而暂停。负责人确认本次尚未创建测试分支、提交采样修正或执行新全矩阵；以 Blog `origin/main` 的正式锁 `0.1.6-inspector.4` 为拟定主基线（不同于本插件锁 0.1.6）。等待任务优先级确认，完整 Blog No-Go 仍有效。
- 用户已授权仅插件仓库 commit + push，用于后续托管源码 CI 验证；不改变仓库可见性、不上传 Atlas 包、不发布 Release、不提交社区、不部署。此前“未提交”保留为当时历史事实；托管 CI 结果另行报告。

### 同日本地脚本优先入口

- 上述改动已由提交 `4fc9cdd` 保存并推送，托管源码 CI `37440708308` 的 Windows / Ubuntu 均通过；受保护完整 CI 未触发。
- 用户随后要求 CI 以本地脚本和调用文档为主。新增 `scripts/ci.bat` 与 `scripts/ci.sh`，只转发到已有 `ci.mjs`；原 npm 入口不变，没有重写构建逻辑或新增 GitHub 任务。`AGENTS.md` 固化本地优先约束，README / `ci.md` 补全前提、调用和产物位置。
- Windows `.bat source` 与 Git Bash `.sh source`（从仓库外调用）均通过：回执分别为 `artifacts/validation/ci/source-kJvr0q/receipt.json`、`source-f3TarK/receipt.json`。各自完成源码 lint、38 项插件测试与 9 项 CI 测试；不等同 Linux/macOS 原生 shell 已实测。
- 新增入口测试使用含空格路径的合成 runner，核验不同工作目录下定位、参数转发、非零退出码透传，并限制工作流只调用既有本地入口；`sh -n scripts/ci.sh` 通过，shell 脚本固定 LF。
- `.bat full` 返回 1，在 `atlas-preflight` 正确拒绝当前正式 0.1.6 缺少宿主 API；回执 `artifacts/validation/ci/full-ANsJGP/receipt.json`。不能记为完整构建通过，未修改锁、Atlas 或插件运行代码。
- 上述本地验证完成时，新增入口尚未提交、推送，未运行新托管矩阵，也未覆盖测试 Vault。用户随后授权仅插件仓库 commit + push；不扩大到依赖升级、发布或部署。

### 同日继续生产验收准备

- 本地入口由 `0564e9e` 保存并推送；GitHub 源码检查 `37444925282` 已成功，包含 Windows / Ubuntu。不能由源码矩阵推定受保护构建通过。
- Atlas 负责人确认恢复隔离双包回归并已建立测试分支；正式基线为 Blog main 锁定的 `0.1.6-inspector.4`，候选仍 `.5-selection`，结果尚待完整报告。
- 新增 `node scripts/verify-test-vault.mjs <full-ci-receipt.json>`：只读检查已保存构建证据与固定 Vault 三文件身份，不读取笔记或设置，不安装。源码/失败/不完整回执被拒绝，匹配也不代表宿主验收或发行许可。新增 3 项测试后 CI 脚本测试 12/12 通过。
- 使用先前成功完整构建 `full-oTVo5c` 的回执核验固定 Vault，三个文件均不匹配，脚本正确返回 1；这与尚未覆盖旧测试安装的状态一致，不能用该 Vault 的当前结果代表最新候选。文件未修改。
- 用户已接受受限只读源码审核路线，尚未授予访问；官方闭源个案政策与受限源码/构建核验机制已于 2026-10-06 重新查阅，依据见 `release-readiness.md`。现有 Atlas 包 LICENSE 要求另行书面再分发许可，未擅自改许可或公开包。
- Computer Use 技能要求的 `node_repl` 入口未在本会话提供，无法通过该技能直接操作真实 Obsidian；未改用替身结果冒充真实桌面、离线或资源释放验收。本轮尚无新的插件构建、安装、提交、推送或发布。

后续授权与本地构建：

- 用户单独确认 SeeTForest 授权合格 Atlas 运行制品随本插件免费分发并供用户安装运行；仅限插件内制品，不公开源码、不授予 Atlas 单独再分发权。根 `ATLAS-RUNTIME-PERMISSION.txt` 保存记录，CI 检查范围声明，构建保留完整文本；原 Atlas LICENSE 不变。
- 新隔离消费者 `artifacts/validation/release-check-6f4ac592/` 使用当前插件源码和同一已验签 `.5-selection`，仅在副本使用候选的两份依赖锁，不升级正式工作区。完整回执为 `artifacts/validation/ci/full-95sHLy/receipt.json`（相对于该消费者）。
- 本地 full 全阶段通过：签名及宿主接口预检、安装、完整 lint / typecheck、38 项插件测试、12 项 CI 测试、构建、制品检查、VM 离线替身、合成基准与 ZIP。lint 0 error / 7 warning，仍需真实弹出窗口等验收。
- 独立确认授权文本已进入 `main.js`，Atlas Worker、Wasm 与插件布局 Worker 哈希与先前候选相同；构建来源除隔离的两份依赖锁外与当前源码哈希一致。隔离目录没有插件 Git，回执 commit 为 null，不能将父仓库提交冒充构建来源或宣称干净正式发行。
- 原负责人在正式基线对照中发现 `.5-selection` 缺少 Blog main 已使用的 `KnowledgeAtlasProps.inspectorLayout`，3 项类型错误；正式 `0.1.6-inspector.4` 相同宿主通过。该项是真实接口不兼容，不是截图采样误差；插件构建通过不解除此 No-Go，正式锁与固定 Vault 均未修改。

### 同日：Inspector 整合候选的插件独立验收

- 原负责人将正式 Inspector 与原生宿主分支整合，保留双方祖先链与公开接口，签名候选为
  `0.1.7-obsidian.6-inspector`，代码源 `7837dc66dd116f7abc78e7c4da53c435738e0365`。
  包 SHA-256 `7c8d81ee61d7cbb2135cc7c0ca61c1104d74e64b36727a90aefbc31a6303d6fe`。
- 在产品目录 `artifacts/validation/inspector-candidate-20261006/` 建立隔离消费者，复用既有可信公钥；
  独立核验签名、公钥指纹、保护清单、所有归档成员哈希和宿主选择/阅读契约。未使用 Atlas 源码构建插件。
- 完整本地管线成功，回执位于该消费者的 `artifacts/validation/ci/full-mshQFI/receipt.json`：
  38/38 插件测试、12/12 CI 测试、完整 lint / typecheck、构建、三文件制品校验、VM 离线替身、
  合成基准和 ZIP 回读通过。lint 为 0 error / 7 warning，未自动修复或屏蔽建议。
- 核验构建快照与当前根源码：除隔离的 `vendor/atlas.lock.json` 和 `package-lock.json` 外全部摘要一致；
  npm lock 只有 Atlas 包条目变化，未顺带升级公开依赖。源为 `0564e9e` 后的未提交本地工作区，
  隔离回执 commit 为 null、逐文件哈希已保存，不冒称干净正式提交。
- 插件 0.1.0 测试 ZIP 位于该回执相邻 `workspace/outputs/seetheforest-atlas-obsidian-0.1.0.zip`，
  SHA-256 `41621348d48f23b99e39f0ee52dd041ff26a7dc19ddba702be15bbdbb36ff8a0`。
  内嵌 Atlas Worker/Wasm 逐字节来自本次签名包，授权和第三方通知完整保留；不宣称与旧 `.5` 全包相同。
- 合成 50 / 500 / 4096 节点的 layout 时间为 69 / 1188 / 13942 ms，seed 为 23 / 233 / 2751 ms；
  Node v24.13.1 / Windows，4096 节点记录 heap 124 MiB。不是 GPU 帧率、真实 Vault 或交互归静时间。
  本轮与 Atlas 负责人串行协调 CPU/GPU 窗口，构建结束后才由其开始专项，避免并发测量干扰。
- 原负责人 `.6` 双包矩阵：候选 19/19 场景、106/106 行为、新鲜八态视觉 8/8、原生宿主浏览器
  25/25 通过；完整验收仍 No-Go。剩余稳定性动作覆盖正式 179/180、候选 177/180，装配两包位置残差
  约 18.26328 且未成功结束，以及候选 22234 ms 长拖回稳。旧 raw 截图失败保留，不能用新配对结果抹去。
  上游正在做固定刺激/命令 trace、真实命中动作和装配状态专项；此处不替 Blog 重新定义用例或放宽阈值。
- 正式 Atlas 锁仍 0.1.6；未覆盖固定 Vault，真实 Obsidian、官方审核和发行仍未完成；本轮未提交、推送或发布。

### 同日：固定初态 `.8-initial` 的插件独立验收

- Atlas 原负责人在其线程确认用户改定生成契约：每次观看生成使用该图首次物理就绪时的未旋转初态，
  成功后从初始方向继续旋转；不映射回点击时视角。取消/错误保留点击前原图。
  这是上游明确授权的生成行为调整，不描述为零行为变化；物理积分、材料与完成阈值不变。
- 新包 `0.1.7-obsidian.8-initial` 源码为干净提交 `b8e8179ee2cc2c345adba59318655c3b7b7903fe`，
  SHA-256 `eeca188807e54b5fdd574aaa62769eab54ace8bd702b892c291d43a089b25bd7`。
  插件隔离消费者位于 `artifacts/validation/initial-candidate-20261006/`；旧 `.6` 消费者及证据保留。
- 复用已信任的公钥独立核验签名、保护清单、成员哈希和宿主 API 后，执行既有完整本地管线。
  回执为该消费者 `artifacts/validation/ci/full-PMTEcL/receipt.json`：全部阶段通过，38 项插件测试、
  12 项 CI 测试、类型检查、构建、三文件校验、离线 VM 替身、合成 CPU 基准和 ZIP 回读通过。
  lint 0 error / 7 warning；没有因此宣称真实 Obsidian 或浏览器 GPU 验收通过。
- 51 个构建输入摘要对比根源码，仅隔离的 Atlas/npm 锁不同；未修改插件运行源码。
  内嵌 Wasm 与 `.6` 相同，SHA-256 `72edde8afc10ce52ada67f1d7de13f6937653b7cd29411c7fb5d1e2cdc599982`；
  此事实不表示其余 JS、Worker 或运行行为全部未变。
- 插件 0.1.0 ZIP 位于回执相邻 `workspace/outputs/seetheforest-atlas-obsidian-0.1.0.zip`，
  SHA-256 `491bb6f07becff1e3ba165ae5c58c138c611baca46d722bb3c3983f15337b397`。仅供隔离测试，不是正式 Release。
- 合成 50 / 500 / 4096 节点 layout 为 66 / 1237 / 13990 ms，seed 为 23 / 260 / 2500 ms，
  4096 节点 heap 94 MiB；Node v24.13.1 / Windows。不是交互归静时间，也不能凭顺序运行宣称性能提升。
- 已阅读上游 `docs/host-integration-diagnostics.md` 和 `outputs/assembly-initial-reference-review/handoff/report.json`：
  桌面/移动各两个实际旋转相位的固定初态生成、取消、Reduced Motion、键盘、完成后拖动和故障恢复专项通过。
  `.8` 的独立 Blog 573 页构建及 closure/public 检查通过；154 项 Blog 单测是在 `.7` 准备阶段执行，
  不能记成 `.8` 已重跑。同样不能把 `.6` 完整矩阵当作 `.8` 完整兼容结论。
- 已请原负责人给出最终包剩余既有门禁覆盖和有界验收计划。本线程不另定 Blog 用例，不放宽归静目标。
  正式依赖锁、固定 Vault 保持不变；未提交、推送、发布或部署，真实 Obsidian 与社区审核仍待完成。

### 同日：用户授权的最终 `.8` 有界 Blog 回归

- 用户明确同意最终 A/B/C/D 串行回归；原负责人执行，本线程只读核验报告，不另定义 Blog 门禁。
  证据为 Atlas `outputs/validation/final-initial-compatibility-20261006/`；`config.json` / `identity.json`
  固定 `.8`、正式 `.4`、Blog `520d7e6`、公开 Notes `018ca791` 与图哈希，`attempts.json` 保留每次执行。
- 18 项门禁中 17 项 passed、1 项 failed。A：最终 `.8` 宿主 boundaries/lint/typecheck/154 测试，
  15 项直接受保护入口 API 对照通过。该结果补足上一节 `.7` 准备阶段不能代替 `.8` 的覆盖缺口。
- B：25 页面及阅读/搜索 UI 恢复、导航、形态通过。唯一 B-search 在评分前因 fixture 无效退出：
  `tests/search/real-cases.json` 的《股票与公司运作机制》不在锁定 558 篇 ContentManifest 中。
  两包 manifest SHA-256 均为 `c2157a1fcbe6a8bfdf9ade09a31498cc5e02691f81cd64c4d060f783031d24db`；
  用例来源 Blog `2af23e0`，历史文档 `97be35e` 已记录同一缺口。未读私库，未猜测原文章迁移原因。
  `B-search-classification.json` 保留溯源；Top-5 评分未执行，不能以 UI 搜索通过替代。
- C 全部通过：initial-load、25 项 host activation、Worker 136 帧（RMS/max 误差 0）、可见运行时、
  runtime visual、稳定性 180 选择 / 36 真实命中拖动 / 6 导航。负责人报告可见拖动回稳 10.327 秒、
  193 节点传播、约束误差 0；idle/recovery p95 均 16.8 ms，retained heap 9.482 MiB。
- D-quality 单次 19/19 场景完成，106/106 行为、8/8 既有历史 raw 截图通过；本线程读取报告确认
  `completed: true` / `passed: true`，106/106 与 8/8。旧 `.6` 的失败证据未改写，不把本次通过回填旧轮次。
  同期双包八态配对 `completed/passed: true`，负责人确认 8/8 可比；7 态像素差 0，active-drag
  差异 0.0009686%，原预算 3.5%，未改阈值/参考图。
- 本轮 11 条 Atlas 回稳观察最长 16.767 秒；15.529 / 16.603 / 16.767 秒超过 15 秒观察线，
  不宣称严格 15 秒全达标，不证明旧 22.5 秒输入已消失，不据此声称普通物理性能优化。
  平均 58.96 FPS / p95 16.8 ms 仅是本次实测；不外推所有环境。
- 身份预检曾误用 `_assets` 路径，按实际桥接 `assets` 修正只读定位后通过；`preflight-failure.json`
  保留，未改产品或产品门禁。独立失败的搜索项未重跑；负责人正拟具体最小 fixture 修订，等待用户审核。
- 本轮未修改物理实现、完成阈值、参考图或正式依赖。仍未更新测试 Vault，未做真实 Obsidian、官方审核或发布；
  17/18 通过不能写成全部兼容验收结束。

### 同日：获批单条搜索用例修订与单次评分

- 用户在本线程明确回复“同意”，批准仅替换第 13 条两个字段，并单独执行一次新版搜索评分。
  原负责人在隔离 Blog `fixed-initial/tests/search/real-cases.json` 中将查询 `股票 公司运作机制`
  改为 `金融 杠杆 折现值`，预期文章 `股票与公司运作机制` 改为 `学科09：金融学重要模型`。
  其余 20 条、总数 21、搜索算法、评分器和 Top-5 ≥90% 门槛保持不变；没有试排名再改题。
- 2026-10-06 21:16:28–21:16:31（Asia/Shanghai）仅执行一次，21/21、命中率 100% 通过。
  前 20 条期望结果 rank 1，第 21 条 HTTP/HTTPS 为 rank 4。只修已证明无效的输入，不缩分母或移除困难用例。
- 独立证据为 Blog `outputs/validation/atlas-host-inspector-20261006/search-fixture-revision/`，
  含 `receipt.json`、原/新 fixture、`fixture.diff`、`search-quality.json` 与日志。
  原 fixture SHA-256 `31990fd611dcbc0451c71f260d3ce71981c308b3481d0db69cdd80f70f0999c2`；
  新 fixture SHA-256 `c2003ea70beacfb68e59864e780c53c62b32e1754e39d5eb5f3809099875e4c8`。
- 本线程读取回执、精确 diff 并独立重算摘要：新旧均 21 条且只变第 13 条；回执列出的所有不变输入摘要
  均仍匹配，包括 manifest、search-index、graph、Atlas `.8` 包、锁、评分器、搜索源码及原矩阵证据。
  候选仍为 `.8-initial` / `b8e8179`，没有用新制品替代原先通过门禁的包。
- 身份准备因误引用不存在的 `outputs/graph.json` 停止，随后按实际 `apps/web/dist/content/graph.json`
  核验同一预期哈希；发生在评分前且记录于回执，不计为一次评分，也没有借机修改图或内容。
- 原矩阵 `attempts.json`、summary、B-search 失败日志继续保持原样；本轮以独立获批 fixture 的通过结果
  闭合搜索输入阻塞，不回填成“原矩阵一次 18/18”。固定候选的本轮自动门禁覆盖已闭合。
- 严格 15 秒归静仍非全达标，旧 22.5 秒输入未重放且未豁免，不能宣称所有体验问题消失。
  修改仅位于隔离副本，未进入 Blog 主分支；本轮无 commit、push、正式依赖升级、Vault 覆盖、发布或部署。
  真实 Obsidian 与官方审核仍未完成，自动门禁结果不是正式发行许可。

### 同日：获准保存源码并更新固定测试 Vault

- 用户明确要求提交、推送、覆盖测试 Vault，并再次确认 `AtlasPlugin-Test` 已关闭。本次仅保存插件仓库，
  不提交 Atlas/Blog 分支、升级正式依赖或发布制品；前述“未提交/未安装”保留为各轮历史状态。
- 提交前本地 `ci:source` 通过，回执 `artifacts/validation/ci/source-TScjcO/receipt.json`；
  完整 CI 已通过的 `.8` 构建输入与当前代码、测试、许可文本摘要一致，只有隔离副本的两个依赖锁不同。
  再次验签、核对保护清单及三文件内容完整性通过，没有重新签名或改变已测制品。
- 固定 Vault 仅覆盖 `main.js`、`manifest.json`、`styles.css`，安装插件 0.1.0 + Atlas
  `0.1.7-obsidian.8-initial`。旧三文件在 `artifacts/validation/test-vault-install-20261006/previous-runtime/`
  完整备份并核对摘要，旁边 `receipt.json` 保存来源与安装前后哈希。必要时关闭 Vault 后可恢复旧三文件。
- 笔记、data.json、工作区等其余 12 个文件前后 SHA-256 均一致，未改启用状态或其他插件。
  `node scripts/verify-test-vault.mjs artifacts/validation/initial-candidate-20261006/artifacts/validation/ci/full-PMTEcL/receipt.json`
  返回成功，确认固定 Vault 三文件与已验收候选逐字节一致。
- 此次只完成安装与身份检查，真实 Obsidian 的鼠标入口、选择/阅读、多面板、弹出窗口、离线和资源释放
  仍待人工执行；未宣称宿主验收或社区发行成功。候选包、Vault 和本地证据均不进入 Git。

### 同日：用户确认当前测试版本验收通过

- 用户在固定 Vault 安装后明确反馈：“已验收，这个版本没问题”。验收对象为插件 0.1.0 +
  Atlas `0.1.7-obsidian.8-initial`，对应 `test-vault-install-20261006/receipt.json` 的三文件身份。
  这是用户对当前版本的人工验收结论，不是 Agent 新执行的 Obsidian 自动测试。
- 未提供逐条操作记录、不同操作系统或额外压力场景数据，因此不补写虚构的资源曲线、截图或逐项实测结果，
  不据此解禁移动端，也不改变此前已记录的归静观察。
- 用户随后授权已验收 Atlas 正式化及插件依赖升级：只纳入已验收整合代码，生成闭源签名正式发行，
  更新插件 Atlas/npm 锁，重新构建验证并保存推送。插件社区 Release/目录提交及 Blog/官网自动升级不在本轮范围。

### 同日：正式 Atlas 0.1.7 依赖升级与完整插件 CI

- 用户明确批准现有私有 Atlas 仓库承载正式 Release；构建发现 Wasm 本机路径泄漏后，又批准原负责人
  最小修复 Rust 构建路径映射和 Wasm 泄漏检查，不改物理、数学或交互实现。失败同名包保留，不用于消费。
- 正式来源：[Atlas v0.1.7](https://github.com/SeeTForest/seetheforest-atlas/releases/tag/v0.1.7)，
  源码 `adb7ad0ac9a5e86ffa0009eebc171531fd9a8249`；本线程从 Release 独立下载三资产，
  使用既有 SPKI 信任根验签、检查保护清单、全部成员摘要和宿主接口后升级插件 Atlas/npm 两锁。
  归档 SHA-256：`d17a55b01ac54edb8c346c69c822dfe1b28aa69eb785c3fcde864ce55b8247aa`。
  插件仍为 0.1.0，`package.json` 的 `file:vendor/atlas.tgz` 不变，npm 锁只改变 Atlas 版本和 integrity。
- 正式包不是 `.8` 的单纯改名。上游 `path-fix/equivalence-signed.json` 记录：运行源码 src/rust 不变，
  新旧优化 Wasm 在缓存/非缓存、1/2/4 substeps、拖动释放、边激活与 anchor 回放共 3600 帧、
  1080000 数值逐项完全一致；不同长度构建目录与主目录的原始 Wasm 字节一致，旧泄漏样本被新门禁拒绝。
  本线程读取该证据，未冒称自行重跑全部轨迹或完整浏览器矩阵；既有长拖观察不因路径修复而解除。
- 本地完整管线 `node scripts/ci.mjs full` 通过，回执 `artifacts/validation/ci/full-IQWS3z/receipt.json`：
  验签/宿主预检、锁定安装、lint、typecheck、38 项插件测试、12 项 CI 测试、build、verify:package、
  verify:installed-runtime、50/500/4096 合成 benchmark、ZIP 打包与回读均通过；lint 0 error / 7 warning。
  此轮来源记录为 `ecc026d` 加当前两锁及文档改动，receipt 明确 dirty，不倒改成干净提交。
- 独立成员及最终插件对照记录在 `artifacts/validation/formal-atlas-20261006/comparison.json`。
  Worker、index.js、CSS、三份类型、README、LICENSE 完全一致；solid.js 仅 Wasm 引用改变。
  新 Wasm 93040 bytes，SHA-256 `3a3559c3cab27e5bbda14c6a4d97fa121b2f4bb8601690563f9a3b2f3152bc54`；
  已知本机绝对路径扫描通过，不把单项扫描当作普遍保密证明。
- 插件 manifest/styles 与用户已验收候选字节一致；内嵌物理 Worker、布局 Worker 和许可文本一致。
  main.js 从 975762 变为 975614 bytes。仅替换 Wasm 后直接字符串对照仍有压缩标识符差异；
  用相同输入做不压缩标识符的内存诊断构建，再仅替换 Wasm 载荷和引用后完全一致。
  诊断没有修改正式构建、受保护输入或已安装文件，不把两个不同 main.js 宣称为逐字节相同。
- 正式插件三文件 SHA-256：
  - main.js：`6450f13dcbfa90cce7dca217fadffab0015dd06d59ea28fb16dafbf851ee4344`
  - manifest.json：`994c156450e78343feb19a06e0833197bc4056eef261b72f70be8ec33691ea84`
  - styles.css：`5f8d3fd903d65dcd5c99205669f8d74574c350a17bb3943fc495976195647013`
  - ZIP：`156de3b10c54877c1c11c4539e7d8fd1eff71b593837fac8a2833f0ca36640e3`
- 本轮未覆盖固定 Vault；它仍安装用户验收的 `.8-initial`。正式包应在关闭 Vault/禁用插件并获准更新后
  做真实 Obsidian 复验，不能修改自动回执的 `realObsidian: not-run` 来冒充完成。
  未发布插件 Release、提交社区、公开仓库、配置凭据、发布 npm 或更新 Blog/官网依赖与部署。

### 同日：干净提交复现与正式包安装固定 Vault

- 插件 `b83e1eecd9cb2e0cac25e61b6aa39641a0c55c83` 已推送 main；随后在干净状态重新执行完整 CI，
  `artifacts/validation/ci/full-12ftNh/receipt.json` 的 `source.dirty: false`，全部 13 阶段通过。
  三文件、内嵌资源、许可清单及 ZIP 与上轮 `full-IQWS3z` 完全一致；没有重写前一轮 dirty 回执。
  [该提交的 Windows / Ubuntu 源码 CI](https://github.com/SeeTForest/seetheforest-obsidian-plugin/actions/runs/37478749390)
  均通过；不是受保护托管完整构建或社区审核。
- 用户随后明确“已经关闭固定 Vault，请执行安装正式包以及后续步骤”。重新核对正式归档的既有信任根、
  签名、逐成员摘要、宿主接口及完整 CI 输出，然后只替换固定 Vault 的三个插件运行文件。
- 安装插件 0.1.0 + Atlas 0.1.7，来自上述干净提交。`verify-test-vault.mjs` 返回 `matches: true`；
  三文件摘要与上一节完全一致，Vault 其余 12 文件前后摘要一致，未改笔记、data.json、启用或工作区设置。
- 安装回执：`artifacts/validation/formal-atlas-20261006/vault-install/receipt.json`；
  旧三文件备份：同目录 `previous-runtime/`。只有关闭 Vault/禁用插件后才能恢复，不能回滚整个 Vault。
  安装脚本拒绝重复覆盖这份备份，不删除历史证据。
- 本次完成的是安装与字节核验，真实 Obsidian 新包复验仍为 `not-run`，待用户反馈。
  未公开仓库、配置官方读取权限、发布插件 Release 或提交社区目录；官方步骤另见 `release-readiness.md`。

## 2026-10-07：用户确认正式包复验通过

- 用户明确反馈：“正式包复验通过”。对象为固定 `AtlasPlugin-Test` 中插件 0.1.0 + Atlas 0.1.7，
  插件构建源码 `b83e1eecd9cb2e0cac25e61b6aa39641a0c55c83`，正式 Atlas 归档 SHA-256
  `d17a55b01ac54edb8c346c69c822dfe1b28aa69eb785c3fcde864ce55b8247aa`。
- 同日重新运行 `node scripts/verify-test-vault.mjs artifacts/validation/ci/full-12ftNh/receipt.json`，
  三文件均 `matches: true`，摘要与上节一致；没有再次覆盖文件或改变 Vault 内容。
- 当前正式包的本机人工验收据此记为“用户确认通过”；未提供逐项截图、计时、资源趋势或其他平台数据，
  不补写测量结果、不外推全平台、不解禁移动端，也不宣称原长拖边界已消失。
- 自动 CI 和字节比较回执仍保留其自身的 `realObsidian: not-run` / `realObsidianAcceptance: not-run`：
  这些脚本没有执行真人操作。人工反馈在本节单独记录，不倒改历史回执。
- 本轮仅更新验收与发行状态文档；未提交推送、公开仓库、授予源码访问、发布插件或提交社区。

### 同日：MIT 适配层与专有 Atlas 边界对齐

- 用户确认“插件适配层 MIT，Atlas 为专有闭源依赖；Atlas 随包离线运行，无运行时下载或遥测”，
  要求代码、工程配置、文档一致。核对现有 LICENSE、package/npm 锁、签名包许可、许可 banner、
  runtime-assets 与 atlas-adapter 后，保留已正确的许可证及运行实现，不为文案对齐重写 Atlas 或插件运行代码。
- 在既有本地 CI contract 增加 Atlas npm 元数据专有许可及 `private: true` 防误发 npm 约束，补充负例；
  该字段不决定 GitHub 可见性。包检查不再跳过内嵌 Wasm 的已知私有路径扫描，增加 Base64 载荷泄漏负例。
- VM 离线验证增加 XHR、WebSocket、EventSource、sendBeacon、Obsidian request/requestUrl 拦截，
  访问即计数，吞掉异常也不能通过；模块加载、初始化、布局、取消、卸载的本次访问尝试数为 0。
  该验证不挂载 DOM/GPU，不将它描述为对所有潜在网络路径的形式化证明。
- 本地 source CI `artifacts/validation/ci/source-K1fQhV/receipt.json` 与 full CI
  `artifacts/validation/ci/full-Ye1hpZ/receipt.json` 均通过。38 项插件测试、12 项 CI 测试通过，
  新负例添加在既有测试内；lint 0 error / 7 warning；typecheck/build/三文件/离线 VM/benchmark/ZIP 均通过。
- 新完整构建的 packageIntegrity 与 ZIP 和已验收 `full-12ftNh` 完全一致，三个运行文件均逐字节相同。
  本次不改运行源码、依赖版本、许可证载荷或构建算法，因此用户已验收的安装制品身份未变；无需重复安装。
- README、AGENTS、架构、CI 和发行清单统一许可与离线边界，并区分维护时依赖下载、npm private 标志、
  GitHub 可见性及社区目录审核。官方要求闭源披露与个案判断，不预设固定独立前置审批或必须公开整个 Atlas。
  首次提交字段与英文披露草稿已准备但未发送；历史记录不倒改。
- 对本地可达 Git 历史的 10 次提交、135 个 blob 做了有限的路径/制品文件名、私钥标记和 GitHub Token
  模式扫描，未命中。该扫描不是完整源码/隐私审查，也不是公开批准；仓库仍为 Private。
- 本轮改动尚未 commit/push；未公开仓库、授予官方源码读取权限、发布插件或提交社区，未覆盖测试 Vault。
