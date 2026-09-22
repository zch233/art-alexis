# 插件1.2.1验收

本地通过WordPress真实wp_edit_posts_query复现：旧aa_collection参数令四分类查询的name成为数字ID，结果全为空。改为aa_filter_collection后四分类结果与只读meta查询一致。

真实后台编辑者浏览器测试通过：五个下拉选项（含回收站空分类）、全部重置、搜索、标题排序、日期组合、非法值安全返回空、其他文章类型列表隔离。PHP集成另测分页、数组参数和已有OR meta_query与筛选条件AND组合通过。测试只读，无数据迁移或作品修改。

PHP8.2共11文件语法通过，git diff --check通过，插件ZIP结构、哈希及PHP8.2解压检查通过。评审确认未关闭公开query_var或修改前端路由、未改变权限；修复仅在admin edit.php的aa_artwork主查询执行。

旧筛选网址仍含冲突参数，更新后必须从左侧「作品」重新进入再筛选，详见deploy-managed/UPDATE-PLUGIN-1.2.1.md。本次未直接连接或更新线上，需用户暂存验收后部署。无需换主题、恢复数据库或重导内容。
