# 本地数据、缓存与运行边界

## 数据流

```text
当前 Vault 的 getFiles / getFileCache / resolvedLinks / unresolvedLinks
  → MetadataCache 事实快照（可取消）
  → 本地身份映射 + ContentGraph
  → 明示搜索/过滤/局部深度（不限制节点上限）
  → Worker 中调用已验签 Atlas 的布局与种子 API
  → 原生 ItemView 内 Solid KnowledgeAtlas
  → 每实例独立的 Atlas Worker / Wasm / Pixi WebGL
  → 宿主 openFile / openLinkText
```

## 与 Blog 编译器的边界

已读 `packages/content-compiler/src/compile-content.ts` 的 `compileGraphContent`。
它复用文件系统扫描、网站身份、链接解析和发布过滤，依赖 Node `path`，并保留
`publish:false` / `graph:false` 排除规则。该规则适合网站发布，不适合当前 Vault 的本地图。
因此不导入这条发布链，也不另写 Markdown 解析器。插件直接采用 Obsidian 的解析结果，
只把已确定的文件关系转换为 Atlas 的自包含结构契约。

Markdown/Wiki 相对链接、别名、同名文件、中文、标题/块锚点、嵌入的目标身份由
MetadataCache 确定。原始缓存链接仅用于标记 wiki/markdown；同一方向的混合语法关系合并时
选择 markdown 标记，出现次数另外保留，不能据此还原原始语法或声称独立证据次数。
Graph 是文件级视图：标题/块锚点落到所属笔记，点击打开笔记，不伪造章节节点。
标签归属边是用户启用的显示关系，不冒充笔记间语义引用。

原始 `type:moc` 与明确 `domain` 可使用。没有 domain 时采用实际一级目录或“未分类”；
不根据美观猜测学科，不用高入链数推断 MOC。用户颜色组只设置显示颜色，不篡改领域或连线。
当前尚未解析见林 Topic Map 路线；本任务的核心图谱使用 Obsidian 实际链接，路线能力不作虚假声明。

## 身份和缓存

路径映射到随机稳定 ID，保存到插件自己的 data.json，不向笔记写 frontmatter。
rename 事件迁移文件/文件夹路径，保留 ID；删除清除映射，新建同路径产生新身份。
离线改名未经过 Obsidian 事件时，仅靠路径无法证明同一笔记，会产生新 ID；不凭内容相似强行合并。

未解析目标保留 source + link 上下文，避免不同目录的相对目标被错误合并。
这比原生图的显示可能更保守，尚待实际对照；点击交给原生解析与创建流程，不批量创建。

监听 create/modify/delete/rename、metadata changed/resolved。200 ms 合并事件；旧快照取消后不得发布。
元数据缺失时不呈现不完整图，等待后续 resolved 事件并保留原图或加载提示。
正文仅在搜索、排除或颜色查询需要时通过 cachedRead 读取；不写到缓存文件或日志。
是否需要正文由全部已打开面板的查询及插件级排除/颜色条件共同决定，不只看最后操作的面板。
每面板的查询、过滤、局部深度/方向/跟随与中心路径写入 Obsidian 工作区状态；状态白名单不含
正文、完整图或插件级排除/颜色配置。旧工作区缺少选项时复制原插件设置；控件随恢复状态同步。
面板查询变化立即取消它的旧布局准备，再请求合并索引任务；不重置其他面板的筛选。
相同可见结构的内容事件不会重新布局。拓扑/分类/筛选变化会准备新布局；当前未实现持久平衡缓存。

布局在独立线程中调用 Atlas 原 API，完成后一次性替换图与种子。过期线程终止，防止乱序覆盖。
关闭视图释放 Solid、GPU 与实例物理线程；禁用插件先关闭所有视图，再撤销共享只读资源 Blob URL。
重开重新构建，不依赖重启应用。

## 资源、样式和签名

运行资源全部随 `main.js` 内嵌；Atlas JS Worker/Wasm 仍是验签包的原字节，布局 Worker 使用原数据 API 构建。
从 Base64 还原字节并创建 Blob URL 交给实例参数，不要求社区安装器下载额外资源目录。
没有 iframe、外部网页、远程 CDN、全局 Worker 覆盖、全局 fetch 补丁或 Electron 协议劫持。
Native host 参数显式接管 URL、history 与存储；默认 Blog 分支保持现状。

`styles.css` 的主题 Token 是 Blog 现有黑曜石宿主契约的局部作用域快照；
不复制闭源绘制和物理。Atlas 样式来自验证后的发行包。宿主尺寸使用工作区面板，
不以整页高度撑开 Obsidian。具体布局仍需实装截图验收。

归档 SHA-256、公钥指纹、Ed25519、干净源码标记、逐文件哈希、保护声明均须通过。
构建还检查本地安装包字节与已验签包一致、公开宿主接口版本、输出白名单和源码/私人路径泄漏。
不接受 workspace、源码目录、无签名候选或手改压缩 JS。

社区安装仅需 main.js / manifest.json / styles.css，许可证在 main.js 可读注释中，构建完整性清单在 outputs/。
三文件与字节一致性检查见 community-package.md；模拟宿主测试不代替真实 Obsidian 验收。

## 尚需实测

Electron CSP、Blob Worker/Wasm、离线、独立窗口、多图面板、主题切换、暂停/关闭清理、
GPU context lost、真实 4k+ Vault、移动 WebView 与原生解析对照均不能由单元测试替代。
搜索语法和原生显示/力参数的完整兼容差距详见 native-graph-parity.md。
