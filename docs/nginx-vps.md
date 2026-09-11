# VPS 快速部署：Docker + 宿主机 Nginx

此说明取代早期Caddy方案。业务代码不依赖某个IP或域名。正式站点地址在 `deploy/.env` 的 SITE_URL、Nginx 的 server_name 和 WordPress 数据库；SSH只用于运维，不写入应用。

## 正确顺序

下载代码和单独的数据备份 → 安装Docker/Compose、Node22、Nginx → 构建代码及生成服务器密码 → 恢复数据库和媒体 → 配置Nginx → 在GoDaddy设置DNS → 申请免费证书并启用HTTPS。

必须先安装Docker，才能运行基于容器的恢复脚本。Nginx安装先后灵活，但恢复时不要提前启用公网网站。当前Docker仅常驻WordPress和MySQL，宿主机Nginx代理到 `127.0.0.1:8080`；数据库不发布端口。

## 1. 准备服务器

以下以Ubuntu/Debian为例；系统版本未确定，因此不自动修改服务器。按Docker官方步骤安装Docker Engine与Compose插件，准备Git、Node22/npm、Bash、flock和sha256sum。安装Nginx及Certbot可使用系统支持的软件包：

```bash
sudo apt update
sudo apt install nginx certbot
```

使用SSH密钥登录；安全组/防火墙开放必要SSH、80、443，不开放8080或3306。域名、IP无需修改主题/插件。私有GitHub仓库用只读deploy key或合适Git认证，不把token写进下载URL。

## 2. 下载和构建

```bash
git clone https://github.com/zch233/art-alexis.git
cd art-alexis
npm ci
npm run release
node tools/vps-secrets.mjs
cp deploy/.env.example deploy/.env
```

编辑 deploy/.env：

- COMPOSE_PROJECT_NAME：如 `art-alexis-live`，后续命令始终使用同一项目名。
- SITE_URL：首次HTTP阶段填 `http://你的域名`；HTTPS启用时再更新。也可以先用临时域名，迁移工具会替换旧网址。
- RELEASE_DIR：本次release输出目录的绝对路径，不是源码wordpress目录。
- BACKEND_PORT：默认8080，可改，Nginx上游端口必须一致。
- ADMIN_LOGIN、ADMIN_EMAIL、EDITOR_EMAIL：正式管理员及客户邮箱，两个邮箱不得相同。

密钥文件在deploy/secrets，父目录权限700；只在服务器本地生成，不能上传GitHub或复用本机测试密码。不要将整个本机work目录复制到服务器。

## 3. 恢复当前本地网站（推荐首次上线使用）

本机手动导出命令：`node tools/backup-local.mjs`。生成 `deploy/backups/local-content-时间/`，此目录已被Git忽略。它含数据库（包括敏感用户密码哈希）、媒体/语言包、原网址、校验文件；不含代码和wp-config。

将**整个完整目录**通过SFTP/SCP单独复制到服务器的非网站公开目录。例如 `/srv/private/art-alexis-content/`，只允许部署者读取。目录必须含COMPLETE、SHA256SUMS、database.sql、media.tar.gz等，不要只复制图片归档。

在代码根目录执行（把项目名改为.env中的同一个值）：

```bash
bash deploy/import-content.sh /srv/private/art-alexis-content art-alexis-live
```

该命令要求全新目标，无已有容器或卷；不要事先对这个项目执行up。脚本自行启动Docker服务、恢复数据、替换旧网址、激活主题/插件并生成新的站点配置，失败后保留数据，不自动覆盖重试。

**账号迁移规则：** 所有源账号旧密码和会话失效。指定ADMIN_LOGIN为管理员，alexis为作品编辑，密码分别取服务器新生成的secret；其他旧管理员降为订阅者，作品作者归属保留。若旧账号邮箱与新管理员/编辑者邮箱冲突，旧账号邮箱改为不可投递占位地址。原本机站点不受影响。恢复后应核对账号；不要对需要保留全部原有管理员权限的其他网站盲目使用此迁移工具。

如果不恢复任何数据、要空站安装，改用：

```bash
cd deploy
docker compose up -d --wait db wordpress
docker compose run --rm --no-deps --entrypoint sh cli /aa-install.sh
```

空站安装与首次内容导入二选一。旧 `restore.sh` 用于完整生产备份的隔离恢复，不适用于本次local-content格式。

## 4. 复制Nginx配置

项目提供两个模板，HTTP用于首次配置，HTTPS用于证书已存在之后。生成实际可复制文件：

```bash
node tools/nginx-config.mjs portfolio.example.com 8080
```

用你的真实域名替换例子，端口与BACKEND_PORT相同。输出在 `dist/nginx-时间/`，其中 `art-alexis-http.conf`、`art-alexis-https.conf` 是完整配置，保留了Nginx的 `$host` 等变量，不要用未限制变量范围的envsubst处理。

假设输出目录记作 NGINX_DIR，先启用HTTP：

```bash
sudo install -d -m 755 /var/www/letsencrypt
sudo test ! -e /etc/nginx/conf.d/art-alexis.conf
sudo install -m 644 "$NGINX_DIR/art-alexis-http.conf" /etc/nginx/conf.d/art-alexis.conf
sudo nginx -t
sudo systemctl reload nginx
```

NGINX_DIR应先设为实际绝对路径。若目标配置已经存在，先核对并备份，不能直接覆盖；若服务器使用sites-enabled，则只启用一次，不要在两个目录重复加载。不要删除其他站点配置。HTTP阶段不要通过不可信网络登录后台。

## 5. DNS和免费HTTPS

GoDaddy只负责你选择的DNS解析；不需要购买GoDaddy的SSL。把域名A记录指向VPS公网IPv4；没有可用IPv6不要添加错误AAAA。等待公网解析生效，确认80/443可达。

使用免费的Let's Encrypt证书，通过Certbot申请（只对已解析的实际域名执行）：

```bash
sudo certbot certonly --webroot -w /var/www/letsencrypt \
  --cert-name portfolio.example.com -d portfolio.example.com \
  --email your-email@example.com --agree-tos
```

若添加www，需要单独处理www的解析、重定向与证书域名；模板默认一个主域名。证书文件路径应与HTTPS配置中的 `/etc/letsencrypt/live/域名/` 一致。**没有证书时不能先启用HTTPS模板，否则nginx -t会失败。**

申请成功后先把现有HTTP配置备份到 `/etc/nginx/config-backups/`（不要放conf.d以免重复加载），再用HTTPS配置替换本项目的配置，执行nginx -t成功后reload。

随后在deploy目录把WordPress旧HTTP网址替换为HTTPS，先预演再执行：

```bash
docker compose run --rm --no-deps cli search-replace \
  http://portfolio.example.com https://portfolio.example.com \
  --all-tables-with-prefix --skip-columns=guid --dry-run
# 确认输出后再执行同一条命令，去掉 --dry-run。
```

同时将deploy/.env的SITE_URL改为正式HTTPS网址。全站检查跳转、图片、登录和浏览器混合内容警告。

证书需要续期；不要假定装好就永久有效。检查Certbot的系统timer/cron，并测试：

```bash
sudo certbot renew --dry-run
```

使用webroot签发时，成功续期后Nginx还需要reload。可按下节部署reload hook；自动证书续期与“网站备份手动执行”是两回事。本次未在任何真实服务器签发或安装证书。

## 6. 后续手动备份

```bash
bash deploy/backup.sh
```

该脚本短暂停写并备份数据库/站点数据，完成后恢复网站运行；不自动定时、不删除旧备份。将备份另存独立位置，并另外保护deploy/secrets、对应代码版本、Nginx配置和 `/etc/letsencrypt`。完整生产备份使用restore.sh恢复到全新隔离项目验证，不能直接覆盖线上。

证书reload hook示例文件在 `deploy/nginx/renewal-reload.sh`，部署到Certbot的renewal-hooks/deploy目录前核对本机nginx/systemctl路径并赋予执行权限。仅在续期成功时运行，先nginx -t再reload。

在代码根目录可手动安装此hook（不创建备份定时任务）：

```bash
sudo install -d -m 755 /etc/letsencrypt/renewal-hooks/deploy
sudo test ! -e /etc/letsencrypt/renewal-hooks/deploy/art-alexis-reload
sudo install -m 755 deploy/nginx/renewal-reload.sh /etc/letsencrypt/renewal-hooks/deploy/art-alexis-reload
```

如果同名hook已存在先检查，不要覆盖。另用 `systemctl list-timers --all` 检查Certbot续期是否已被安排；若未安排，按系统所用Certbot安装方式启用其续期timer/cron。不要同时重复配置多个续期任务。

## 上线前最后核对

真实SMTP找回密码、正式账号、手机真机、上传大图、作品隐藏、备份恢复、磁盘余量、端口暴露和HTTPS续期。WordPress默认仍不开放搜索引擎索引，验收后在设置→阅读解除。Nginx不缓存作品页面，避免隐藏内容被缓存继续展示。

参考：[Let's Encrypt入门](https://letsencrypt.org/getting-started/)、[Certbot文档](https://eff-certbot.readthedocs.io/en/stable/using.html)、[Nginx代理设置](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_set_header)、[Docker Ubuntu安装](https://docs.docker.com/engine/install/ubuntu/)。
