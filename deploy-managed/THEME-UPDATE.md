# 主题 1.2.1 — 首页对齐与字体加载修正

> 历史说明：当前交付已升级到主题1.3.0及插件1.1.0，请以同目录UPDATE-1.3.0.md为准，不再使用下文的“本次只需主题”说明。

本次只需 art-alexis-theme-1.2.1.zip（生成目录中的 art-alexis-theme.zip 是同一个包）。替代1.2.0及更早版本。不需要重新导入已有图片、导入SQL、修改账号或更新插件。VPS与托管共用相同主题。

## 更新顺序：不删除、不停用原主题

1. 先下载备份目标站当前 wp-content/themes/art-alexis/，确认平台站点备份可用。
2. 在暂存站后台依次进入 Appearance → Themes → Add Theme → Upload Theme，选择新ZIP，Install Now 后选择 Replace installed with uploaded（用上传版本替换已安装版本）。不要上传到插件页面。
3. 如果发生下面的图片格式拦截，使用SFTP替换；不要先删除原主题来绕过。
4. 暂存检查通过，再在正式站重复相同文件更新。不要整站同步数据库，以免覆盖客户新增作品。
5. 清除GoDaddy缓存/CDN缓存，浏览器 Ctrl+F5 或无痕打开检查。后台主题详情应显示1.2.1。

WordPress官方替换按钮说明：https://developer.wordpress.org/reference/classes/theme_installer_skin/do_overwrite/
GoDaddy官方SFTP说明：https://www.godaddy.com/help/upload-files-with-sftp-on-managed-hosting-for-wordpress-8940

先在暂存站更新并备份原主题。若后台ZIP上传提示“仅支持真实JPG/PNG/WebP”，是旧作品管理插件的全局上传校验误拦截。插件1.0.1已修复：先通过SFTP备份并覆盖插件includes/media.php（完整说明见UPLOAD-FIX.md），再重试后台ZIP更新。也可直接通过SFTP更新主题文件，不要修改ZIP扩展名。

电脑解压ZIP后里面只有 art-alexis 文件夹。将其文件更新到目标 WordPress 的 wp-content/themes/art-alexis/，不要多套一层 art-alexis，不要覆盖 uploads、plugins 或 wp-config.php。

清除GoDaddy缓存/CDN缓存，用无痕窗口检查首页、分类、作品大图、About、手机菜单。检查新详情页顶部关闭、图片放大、More Work；Current Works应为桌面双栏、手机单栏，其他分类为居中单栏。更新不会设置联系邮箱或重排分类，这两项仍由后台内容控制。

此包包含detail.php、全部本地字体（5个WOFF2及TTF后备）、CSS/JS和主题PHP文件，必须完整更新，不能只复制CSS。字体没有使用外部Google字体服务。

图库和文案仍读取WordPress数据库：源包中的新增作品图片与占位SVG没有自动导入。要展示更多图片，请在对应分类下新增作品或编辑作品图集；不要直接把site-package整个目录公开上传。没有设置真实邮箱时不显示CONTACT区，不会使用示例邮箱。

暂存验证通过后，由用户确认在正式站执行相同主题文件更新，不用整站同步数据库。失败则恢复原主题文件并清缓存。

详细对比和验证限制见 docs/home-hotfix-review.md、docs/source-parity-review.md。当前线上没有被自动更新。VPS后续部署仍使用deploy/，不要把托管平台的配置或数据库凭证替换成Docker配置。
