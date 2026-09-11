# Docker 本地测试

工程根目录运行：

```powershell
node tools/docker-env.mjs
docker compose run --rm --no-deps --user 0:0 --entrypoint sh cli /aa-prepare.sh
docker compose up -d
docker compose run --rm --entrypoint sh cli /aa-bootstrap.sh
```

使用 wordpress:cli-php8.3 的 PHP 开发服务器（4 workers）和 MySQL8。首次手动运行准备命令从官方源下载核心，不依赖个人 work/runtime。准备和安装命令执行后自动移除工具容器；常驻只有wordpress/db，无prepare容器。此配置不是生产部署；生产见 vps-deployment.md。

前台 http://127.0.0.1:9401/，后台 http://127.0.0.1:9401/wp-admin/。

后台账号：admin（管理员）、alexis（作品编辑）。随机密码分别保存在 work/docker.env 的 AA_ADMIN_PASSWORD 和 AA_EDITOR_PASSWORD；不要公开此文件。初始化不重置账号、不自动导入私有图片，已有作品保留。若中文语言包下载失败，站点仍可运行，稍后重试即可。

数据库及上传文件保存在本项目独立命名卷。源插件/主题以只读方式挂载，修改前端源文件后运行 npm run build。此测试环境与原 9400 Playground 独立，未迁移原环境的测试作品或后续编辑。

停止：`docker compose stop`。再次启动：`docker compose up -d`。不使用删除卷的命令，不执行 down -v；停止不会清空数据。

只监听本机，不作为生产部署配置。上传上限15MB，PHP内存256MB，MySQL8。上线前仍需主机、安全、备份和真机验收。

## 本次验证（2026-09-11）

WordPress 7.1 / PHP 8.3.30 / MySQL 8，数据库 healthy。Compose 配置检查通过；浏览器测试确认 4 个分类及图片、4 件初始作品、手机无横向溢出、编辑登录成功、插件管理访问返回403。重启本项目 WordPress 和数据库后重复测试，全部通过，内容和账号保留。Docker 登录信息另存 work/docker-login.json。
