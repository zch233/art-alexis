# Nginx 与首次内容迁移验证

2026-09-11。本轮本地实现，未操作VPS/DNS，未提交或推送新增改动。

- 主题/插件扫描：无硬编码正式IP或域名；本地测试脚本有明确测试地址。站点URL由WordPress数据库生成，迁移脚本使用WP-CLI替换旧URL。
- Nginx HTTP配置原样nginx -t通过；HTTPS配置使用本地自签名测试证书验证。Windows验证时临时Nginx容器共享测试后端网络，仅调整测试监听端口；正式配置是宿主机Nginx。
- 从原9401导出当前数据库及媒体到私有local-content备份；不含wp-config或代码。原站短暂停写后已恢复，回归4分类/4作品/图片/编辑权限通过。
- 内容导入实跑到全新隔离项目，4件作品和图片恢复；旧URL替换，新站连接密码由新配置生成。
- 权限复核发现旧账号密码应使用wp_update_user而非直接wp_insert_user更新，修复后重新完整导入：管理员与编辑新密码有效，旧管理员降为subscriber，旧密码拒绝，原站账号未变。
- HTTP浏览器7项通过；本地TLS浏览器8项通过：页面、图片、正确目标URL/协议、私有路径拦截、上传脚本拒绝、代理协议头覆盖、旧密码拒绝、新账号登录/权限、Secure Cookie。
- 重复导入现有项目被拒绝，未覆盖数据。
- Nginx渲染拒绝包含分号的域名和非法后端端口；Shell/PHP语法检查和无图源码构建通过。
- 当前备份：deploy/backups/art-alexis-content-20260911.zip。解压后以local-content目录作为import-content.sh参数，文件内含敏感用户密码哈希，应单独私密传输，绝不上传GitHub。

没有签发真实Let's Encrypt证书，没有验证公网DNS、VPS防火墙、实际证书续期或真实手机设备。原站继续运行；临时验证容器移除但数据卷和备份保留。正式部署以nginx-vps.md为准。
