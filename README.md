# Art Alexis

阶段：WordPress 本地可操作版本完成，尚未生产部署。

VPS 交付入口：docs/nginx-vps.md。纯代码构建 `npm run build`；无图发布产物 `npm run release`；仓库候选审计 `node tools/repository-audit.mjs`。生产Docker仅常驻WordPress/MySQL，入口由宿主机Nginx负责，初始化/备份/恢复手动执行。Nginx模板在deploy/nginx，`node tools/nginx-config.mjs 域名 8080`生成可复制配置。`node tools/backup-local.mjs`导出被Git忽略的本地内容迁移包。

Docker 测试环境现已配置：地址 http://127.0.0.1:9401/，启动/停止说明见 docs/docker.md，本地测试账号见 work/docker-login.json。它与下方 9400 Playground 环境的数据独立。

- docs/requirements.md：已确认范围、建议默认值、验收场景。
- docs/page-structure.md：页面及浏览路径。
- preview/review.html：桌面/手机评审入口。
- reference/：客户原始模板副本。
- work/：本地验证工具与截图，不是生产代码。

预览可用任意本地静态服务器从工程根目录启动，打开 /preview/review.html。字体、图片、样式与脚本本地加载，无CDN依赖。

完整站点启动：`npm ci` → `npm run build` → `npm run dev:wp`，打开 http://127.0.0.1:9400 。后台 /wp-admin/；登录资料在 work/local-access.json，运行数据保存在 work/runtime，禁止公开提交或部署。

已实现作品上传、分类管理、排序、封面、草稿、私有预览、发布与隐藏、媒体引用保护、分页返回恢复、大图浏览和本地 GSAP 动效。普通启动不创建测试数据；显式设置 AA_RUN_TESTS=1 才运行服务端集成测试。

可安装代码在 wordpress/plugins/art-alexis 和 wordpress/themes/art-alexis；前端源文件在 src。只部署插件与主题，不上传整个工程。安装说明见 docs/deployment.md，验收记录见 docs/verification-wordpress.md。客户使用“作品编辑”账号，管理员独立保管。
