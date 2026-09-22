# 后台分类筛选修复

Full Test Flow：线上反馈后台查询错误。范围仅作品列表筛选与插件补丁，不修改内容、前端路由或线上。

疑点：筛选GET参数aa_collection与注册文章类型的公开query_var同名；WordPress可能在pre_get_posts前将其解释成分类slug查询。

顺序：通过真实wp_edit_posts_query复现并打印最终查询条件；新增不冲突的aa_filter_collection参数并组合meta_query；校验非法参数；回归全部分类、全部作品、搜索、排序、日期、分页及其他列表隔离；PHP检查后打包插件。

自评审：不能通过关闭CPT query_var修复，那会影响前端。不要直接覆盖其他插件的meta_query。旧筛选网址需回到干净作品列表重新选择，避免保留冲突GET参数。修复不涉及DB迁移，回滚仅恢复原插件文件。真实线上环境无法自动验收，交付后用户先暂存更新。
