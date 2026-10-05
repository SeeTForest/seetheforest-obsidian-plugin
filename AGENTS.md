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
- `outputs/`、`vendor/`、`node_modules/` 不入 Git。制品白名单不得包含测试库、笔记、源码地图、内部文档或机器路径。
- 交付前运行 `npm run typecheck`、`npm test`、`npm run build`、`npm run verify:package`；真实 Obsidian 验证与单元测试分别报告。
- 保留其他仓库与用户修改。移动端未验证不得宣称兼容；功能对照中的差距不得称为全部完成。
