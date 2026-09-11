# 安装与运维

更新：用户已确认独立VPS，正式部署以 vps-deployment.md 为准。下文是早期托管主机/含种子图ZIP的历史说明，不适用于新的无图代码发布包。

## 交付结构
art-alexis-plugin.zip 为作品管理插件；art-alexis-theme.zip 为主题。两个都要启用。不要覆盖 WordPress 核心。

## GoDaddy 上线前核对
选择支持自行上传主题/插件的 WordPress 主机或 PHP 主机。确认 PHP 8.1+（建议受支持的8.3/8.4）、WordPress受支持最新补丁、数据库、GD/Imagick、JPEG/PNG/WebP读写、持久磁盘空间、HTTPS。上传文件与数据库必须备份到独立位置。
将 PHP upload_max_filesize 至少设为15M、post_max_size至少20M；memory_limit建议256M起，按实际大图调整。CDN不是必需；图片直连主机，速度受访客距离、网络和主机带宽影响。

## 安装
1. 安装标准 WordPress，后台站点语言选择简体中文。主题前台固定英文。
2. 上传并启用作品管理插件，再上传启用主题。设置固定链接为“文章名”。
3. 新建已发布页面，标题About、slug为about。内容由“网站内容”面板填写。
4. 在“网站内容”填写正式联系邮箱和文字。没有邮箱时不向访客显示占位邮件链接。
5. 创建客户账号，角色为“作品编辑”；管理员使用独立账号。
6. 初始数据导入：管理员在“网站内容”底部点击“导入初始作品”；也可运行 `wp art-alexis import /absolute/path/to/reference/assets --user=管理员ID`。会补建About页面。导入可重复执行，不重复创建既有slug作品，不覆盖客户已修改的封面和内容。
7. 检查4个分类及4件Untitled。所有正式标题和缺失资料由客户补充。
8. 开启公开索引前，核对可见性、About、邮箱、媒体、HTTPS和分享图片。

## 缓存与隐藏
当前前台与列表接口发送no-store，防止已经隐藏的内容继续由页面缓存公开。图片和带版本的CSS/JS可以使用浏览器缓存。GoDaddy如自带页面缓存，首次上线将作品/分类路由排除缓存，或先接入保存、隐藏和回收事件的可靠清缓存机制。不能未经验证就强开全页缓存。
本版本默认不把作品/分类加入WP核心sitemap，避免隐藏内容泄漏。公开作品仍有标准URL、title、description、canonical和分享标签；如需要作品sitemap，后续必须复用公开过滤规则。

## 图片
原图保留，本地生成thumbnail及480/768/1280/1920宽的变体。15MB和4000万像素上限仍可能超出廉价主机图片解码能力，需实测。WebP输入支持；不会假称自动把全部JPEG转换WebP。
运营账号不能永久删除图片；管理员也不能删除仍被作品、分类或About引用的图片，包括回收站内引用。
隐藏页面不保护已知原图直链；若未来有私密作品，需要额外授权下载方案。

## 运维
建议每日数据库备份、每日媒体增量备份，保留周期与客户约定；定期恢复演练。上线后检查磁盘、上传失败率、PHP日志；升级核心或组件先在测试环境验证。当前不自动配置或购买备份服务。

## 本地开发
`npm ci` → `npm run build` → `npm run dev:wp`。
本地Playground运行PHP+SQLite用于功能验证，生产仍使用标准WordPress数据库。仅绑定本机测试，工作数据库位于work/runtime；登录资料位于work/local-access.json，不打包、不提交。
生产不得部署work、tools、node_modules、reference或本地登录资料。
