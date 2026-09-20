# 验证记录 — 2026-09-17

## ZIP 路径修复（取代下方早期 ZIP 检查结论）

用户暂存站主题安装失败：缺少 style.css。复查确认旧 Compress-Archive 包含反斜杠路径；旧检查先做路径归一化，漏检跨平台错误。此前声称 ZIP 通过仅是逻辑清单检查，不足以证明可安装。

修复：插件/主题改用 ZipArchive 创建标准 `/` 路径；验证器不再归一化，遇到反斜杠直接失败。构建在输出交付路径前自动执行 ZIP 清单及 PHP 8.2 ZipArchive 解压检查。

已验证：旧包在 PowerShell 和 PHP 两个检查中均按预期失败；新插件8文件、新主题14文件原始路径通过；PHP Unix 风格文件系统解压后逐文件 SHA256、style.css/index.php/插件入口、WordPress 标头均通过；图片仍独立打包。Windows PowerShell 5 的 Compression 程序集加载差异也已修正。

安装包需使用本次重新生成的版本，原 dist/074e886b-5e14-464e-99a8-17bc5442c882 和 dist/833a94d3-f53a-4141-8eb6-8ec0cc007d70 保留作复现，不再部署。未删除文件或变更 VPS 代码。

限制：未远程操作客户站点，需再次上传新包确认 GoDaddy 安装。运行期/CDN 验收仍未完成。修复仅改变归档路径，没有业务逻辑或性能改动。

已通过：
- `node tools/check-php.mjs 8.2`：10 个 PHP 文件语法通过。
- `node tools/check-php.mjs 8.3`：10 个 PHP 文件语法通过，原 VPS 版本回归。
- `package.ps1 -IncludeInitialArtwork`：插件、主题和四张初始素材分别打包。
- `verify-package.ps1`：安装包根目录、入口文件、敏感文件排除、四张图清单和 SHA256 通过。
- `node tools/repository-audit.mjs`：无原图/密码候选，隔离纯代码 release 构建通过。
- `git check-ignore deploy-managed/dist/probe.json`：输出目录被忽略。
- `git diff --check`：通过。deploy/ 原 VPS 配置无改动。

未完成，不能视为运行兼容性通过：
- `node deploy-managed/check-runtime.mjs` 尝试 PHP 8.2 + WordPress 7.0.4 隔离环境；远端下载中断，Node 报 UND_ERR_SOCKET / other side closed。首轮单 worker 未完成，已改成 6 workers 并加 180 秒超时。没有得到集成测试结果。
- Docker Desktop 当时未启动，未导出本地最新数据。
- 未访问客户主机，未上传 ZIP；缓存/CDN、SSH WP-CLI 可用性、媒体生成及移动端真实环境需暂存站验收。

发布判定：可交付“暂存试装候选包”，不是已验收的生产发布包。没有添加托管专有业务逻辑，没有替换账号，没有实施整库迁移。

预提交自评审：独立目录满足双部署需求；同源构建防止两套业务代码分叉；图片与代码分包且生成目录全部忽略。迁移风险通过明确区分初始素材与完整数据解决，尚缺最新数据内容级迁移和真实主机集成验证。出现安装失败、PHP 致命错误、作品隐藏失效或预览泄漏应停止发布并恢复暂存备份。
