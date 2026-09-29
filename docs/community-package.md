# 社区安装制品契约

核验日期：2026-09-30。实现是本地开发候选，不是发布授权或市场审核结论。

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
