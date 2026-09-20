# GoDaddy 托管 WordPress 部署

与 ../deploy/ 的 VPS 方案并存，共用 wordpress/ 代码。线上不安装 Docker/Nginx/Node，不覆盖 wp-config.php、MU 插件、drop-in 或平台用户。

当前为暂存试装候选包，不是生产验收完成版。检查结果及未完成项见 VERIFICATION.md。

ZIP 路径问题已修复：请使用最新生成的包，不再使用旧目录 `074e886b-5e14-464e-99a8-17bc5442c882` / `833a94d3-f53a-4141-8eb6-8ec0cc007d70`。如果旧插件安装成功，也应通过上传修正版更新同名插件，不要删除其数据或新建另一套目录。平台若提示替换，先核对确为 Art Alexis 插件。

## 本地准备

在项目根目录运行（Windows PowerShell）：

```powershell
powershell -NoProfile -File deploy-managed/package.ps1
```

默认只生成纯代码包。需要现有四张初始素材时：

若 Windows 提示脚本执行被禁用，可在检查脚本后将命令改为 `powershell -NoProfile -ExecutionPolicy Bypass -File ...`；只影响该次进程，不修改系统执行策略。

```powershell
powershell -NoProfile -File deploy-managed/package.ps1 -IncludeInitialArtwork
```

输出在 deploy-managed/dist/时间/，整个输出目录被 Git 忽略：

- art-alexis-plugin.zip：作品管理插件，不含作品图片。
- art-alexis-theme.zip：主题及已构建本地字体/JS/CSS，不含作品图片。
- initial-artwork.zip（可选）：四张原始作品，仅初始导入，不是最新网站数据备份。
- manifest.json：文件大小和 SHA256。

## 暂存站安装

1. 确认顶部显示 staging site，记录真实暂存 URL；先创建可恢复备份。没有备份功能则导出数据库并下载相关文件，保存在私有位置。
2. 插件 → 上传 art-alexis-plugin.zip → 安装并启用。
3. 外观 → 上传 art-alexis-theme.zip → 安装并启用。
4. 设置 → 固定链接：文章名，保存。设置 → 阅读：检查首页显示方式；主题首页依赖 front-page.php。测试期保持不允许搜索引擎索引；这不等于访问控制，私密测试还应使用平台访问保护（若提供）。
5. 后台网站内容检查品牌、介绍、About、联系邮箱；创建 slug 为 about 的 About 页面（若不存在）。通过用户页面创建作品编辑账号，选择“作品编辑”角色；不要重设或替换平台管理员。

## 四张初始作品（不是完整迁移）

最简单的可审核方式：将 initial-artwork.zip 解压在自己电脑上，通过后台建立下表分类，再逐一上传图片，每类一个 Untitled 作品，设置作品封面和分类封面、勾选首页展示。

| 分类 | slug / 图片文件名（.jpg） | 年龄 |
| --- | --- | --- |
| Early Explorations | early-explorations | Age 6–12 |
| Finding My Style | finding-my-style | Ages 13–14 |
| Creative Experiments | creative-experiments | 空 |
| Current Works | current-works | 空 |

如果 SSH 环境确认有 WP-CLI，可以将解压后的四张图片放在站点公开目录之外，并在正确暂存 WordPress 根目录执行以下命令。先将路径、账号替换成真实值，不要使用生产目录：

```bash
wp option get home
wp --user=实际管理员登录名 art-alexis import /私有绝对路径/initial-artwork
wp rewrite flush
```

这是现有插件的显式初始导入命令，不需要新上传可执行 PHP 文件。按 slug 复用已有分类/作品，已有作品封面不覆盖。仅用于已确认空白的作品库；如已有内容请停止，先审核冲突。它不迁移本地最新编辑、用户、站点设置或额外作品。导入后清平台缓存并检查四类四作品、排序和封面。

## 如果要迁移本地最新完整内容

此轮没有导出最新本地数据库（准备开始时 Docker 未运行）。不要用 initial-artwork.zip 代替最新备份。

先启动本地 Docker 并核对作品数据，再导出完整私有备份留底。现有 deploy/import-content.sh、restore.sh 仅用于 VPS，不能在托管环境运行。也不要把 database.sql 直接导入客户数据库。

托管内容迁移须单独处理：分类/作品/媒体 ID 映射、_aa_collection、_aa_gallery、_thumbnail_id，以及 aa_settings.photo、About/品牌/联系内容、图片 URL 与序列化数据。普通 WXR 导入不能假定会重映射这些自定义关联。目标管理员、数据库连接、平台选项、域名和插件状态保持不变。数据有新增时需另做内容级迁移并验证，不在此包中承诺一键整站恢复。

## 验收与正式上线

- 桌面及真实手机：首页、分类、作品详情、返回列表、灯箱、减少动态效果。
- 后台：编辑角色权限、JPEG/PNG/WebP 上传、缩略图生成、上传失败提示。
- 无痕窗口：隐藏作品/分类后直接 URL 不再显示；未发布预览不泄漏；刷新后没有旧列表。验证平台缓存/CDN是否尊重 no-store，必要时要求平台配置排除，不能只测登录状态。
- 检查平台 Coming Soon/Launch 状态是否阻挡预览；测试中不发布生产。
- 检查密码找回邮件、HTTPS、媒体同源/无混合内容、存储余量、PHP 错误日志。
- 生产发布前确认平台“同步网站”具体覆盖哪些文件/表，并再次备份生产。测试通过且得到客户确认后再同步，重新核对域名、登录、作品、缓存和索引设置。
- 出错则停止发布，恢复暂存备份；不得将暂存失败数据推到生产。

备份/图片/ZIP不提交 Git；平台备份以外保留一份离线副本。暂存站可能占用同一套餐空间，应实际核对，不假定额外免费20GB。
