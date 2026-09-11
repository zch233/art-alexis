# 独立 VPS 部署与手动运维

本说明取代早期 GoDaddy 托管主机安装方案。生产仅常驻 Caddy、WordPress（Apache/PHP）、MySQL；CLI/archive 仅由手动命令短暂创建，结束自动移除。没有定时备份任务、常驻备份服务或 prepare 容器。

## 1. 代码、内容和秘密分离

- Git：主题、插件、前端源码、本地字体与许可证、配置模板、脚本和说明。
- 不提交：客户位图、reference、seed、上传目录、work、本地配置、密钥、数据库、备份和ZIP。
- `npm run build` 不读取原图；`npm run release` 创建独立的 `dist/release-时间/` 无私有图片产物及 SHA256 manifest。生产必须挂载该产物，不能挂载可能保留私有 seed 的源码目录。
- `.gitignore` 不删除本地图片，也不清除已经提交的历史。首次推送前运行 `node tools/repository-audit.mjs`；本次没有初始化主工程 Git 或推送仓库。若未来误提交原图/密码，忽略规则不够，需另行处理历史和泄露凭据。
- GitHub 不是作品备份。数据库、媒体以及服务器私有配置需独立备份。

## 2. 服务器准备（人工执行）

使用受支持的 Linux 系统，安装 Docker Engine + Compose v2、Node/npm（构建时）、Git、Bash、flock、sha256sum。使用非共享的部署账号，SSH密钥登录。云安全组仅开放必要SSH、80和443，数据库3306不公开；注意Docker端口发布与主机防火墙交互，必须从外网实测。

域名 A/AAAA 正确指向服务器后，Caddy 才能申请真实证书；没有IPv6服务就不要设置错误AAAA。生产使用真实域名，不用本地测试的HTTP地址。Caddy证书数据有独立卷。

## 3. 首次安装

在工程根目录运行：

```bash
npm ci
npm run release
node tools/vps-secrets.mjs
cp deploy/.env.example deploy/.env
```

编辑 deploy/.env：正式域名、HTTPS SITE_URL、证书邮箱、管理员/编辑者邮箱，RELEASE_DIR 填本次产物的绝对路径。配置模板没有密码。生成器只创建缺失密钥，不覆盖已有密码。

Linux 上 `deploy/secrets` 必须由部署者所有且权限700；密钥文件444用于容器内非root用户读取，不能因此把父目录开放。普通Compose文件secret不是加密密钥库，root/Docker管理员能读取，应按敏感数据保护。迁移到另一台主机时单独安全传输这些文件。

```bash
cd deploy
docker compose config --quiet
docker compose pull
docker compose up -d --wait db wordpress
docker compose run --rm --no-deps --entrypoint sh cli /aa-install.sh
docker compose up -d caddy
```

先安装再启动公网入口，避免安装页面提前暴露。若语言包下载失败，修复网络后重跑安装命令；已创建的用户与内容不会被重置。默认阻止搜索引擎索引，正式验收后才在“设置→阅读”开放。

管理员密码在 `deploy/secrets/admin-password.txt`；客户 alexis 密码在 editor-password.txt。安装后用正式密码管理器保管，启用合适的后台登录保护/2FA。**不要把本机生成的测试密码带上生产。** 修改文件不会自动修改已存在的WordPress用户或数据库密码，密码轮换必须单独操作。

当前镜像不负责发送可靠邮件；上线前配置SMTP或其他事务邮件服务并测试找回密码。网页 Contact 是 mailto，不等于服务器具备发信能力。

## 4. 图片和内容迁移

纯代码安装不自动导入四件作品。在后台创建分类/作品并上传图片，或单独迁移数据库和 uploads。不要把图片提交到GitHub，也不要把数据库SQL放到网站目录。模板原图的本地副本仍保留，只是被Git忽略。

导入已有数据库时必须先备份，替换本地URL要使用 WP-CLI search-replace（先 --dry-run），不能直接字符串替换SQL以免破坏序列化数据。迁移包含旧用户时更换密码、核对邮箱和权限。旧插件ZIP含种子图，不作为新的无图发布包使用。

uploads 保存在 site 命名卷中，数据库在 database 卷中；更新代码不覆盖媒体。上传目录禁止执行PHP等脚本。隐藏作品页面不等于加密图片，已知原图直链仍可访问。

## 5. 手动备份

没有自动定时任务。你选择时间运行：

```bash
bash deploy/backup.sh
```

脚本检查网站与数据库运行状态，获取备份锁，短暂停止WordPress，导出数据库并打包站点数据，生成校验清单后恢复网站。过程中Caddy可能返回502，应安排维护时段；不要同时执行CLI导入或更新。成功目录含 COMPLETE 标记，失败目录保留但不能用于恢复。

备份输出到 deploy/backups/独立时间目录，不覆盖或自动删除旧备份。备份包含敏感数据库与wp-config，必须私密保存；另外保留对应无图代码产物/manifest及deploy/secrets。完成后自行加密传到另一台机器或独立存储。**只放同一VPS不算灾备。** 手动备份意味着两次备份间的新作品可能在故障时丢失，请约定备份频率。

## 6. 手动恢复（只到全新隔离项目）

```bash
bash deploy/restore.sh /absolute/path/to/complete-backup alexis-restore-20260911
```

脚本校验备份，拒绝已有容器或卷的目标，只创建新的数据库和站点卷；不覆盖原站、不启动新站公网入口。项目名必须包含 `-restore-`。使用相同配套密钥及正确代码版本；准备不同的测试域名/端口，在环境变量中指定 COMPOSE_PROJECT_NAME 为新项目，启动WordPress检查。

恢复后验证作品数量、图片、登录、上传和数据库；若测试域名变化，先WP-CLI dry-run再替换URL。验收完成后再切换域名或代理流量。不要把恢复脚本改成直接覆盖线上。

## 7. 更新和回退

更新前运行手动备份。拉取经过审核的代码，npm ci + npm run release，在测试环境验证；修改 RELEASE_DIR 指向新目录后 `docker compose up -d wordpress`。旧产物保留以便回退，不自动清理。

未发生数据库变更时可把 RELEASE_DIR 切回旧版本再重建WordPress容器；发生核心/数据库升级时，先用对应备份隔离恢复，不能只退代码。WordPress核心保存在持久卷，换镜像标签不等于回退核心文件。上线记录镜像版本/digest，依赖更新先测试，不盲目追latest。

`docker compose stop` 保留全部数据。不要运行删除卷的命令，不使用 down -v。

## 8. 上线验收

HTTPS、域名跳转、中文后台、客户权限、找回密码邮件、真实大图上传、手机Safari/Android、大图手势、作品隐藏和回收站、备份恢复、外网端口、磁盘容量、日志。

当前Caddy不缓存HTML；作品页面/API的no-store保持有效。暂不启用整页缓存，避免隐藏内容仍公开。CSS/JS压缩与响应式图片不代表已做跨地区性能验收。作品/分类sitemap暂未开放，按前期约定另行补充公开过滤版本。

## 参考依据

- [WordPress官方Docker镜像：持久化、代理HTTPS与文件密钥](https://hub.docker.com/_/wordpress)
- [Caddy自动HTTPS](https://caddyserver.com/docs/automatic-https)
- [Docker Compose secrets](https://docs.docker.com/compose/how-tos/use-secrets/)
