<?php
defined('ABSPATH') || exit;
add_action('admin_menu',function(){
    add_submenu_page('edit.php?post_type=aa_artwork','批量新增作品','批量新增','edit_aa_items','aa-bulk','aa_bulk_page');
});
add_action('admin_enqueue_scripts',function(){
    $screen=get_current_screen();
    if(!$screen||((($_GET['page']??'')!=='aa-bulk')&& !($screen->base==='edit'&&$screen->post_type==='aa_artwork')))return;
    wp_enqueue_script('aa-bulk',AA_URL.'assets/bulk.js',[],'1.3.1',true);
    wp_enqueue_style('aa-bulk',AA_URL.'assets/bulk.css',[],'1.3.0');
    wp_localize_script('aa-bulk','AABulk',['url'=>admin_url('edit.php?post_type=aa_artwork&page=aa-bulk'),'ajax'=>admin_url('admin-ajax.php'),'nonce'=>wp_create_nonce('aa_bulk')]);
});
function aa_bulk_page(){
    if(!current_user_can('aa_manage_content')||!current_user_can('edit_aa_items')||!current_user_can('upload_files'))wp_die('没有批量新增权限');
    echo '<div class="wrap"><h1>批量新增作品</h1><p>每张图片创建一件作品，默认保存草稿，也可选择上传成功后直接发布。</p><p id="aa-bulk-help">每批最多20张，每张最多15MB。支持真实 JPG、PNG、静态 WebP。请保持页面打开；刷新后先检查作品列表，避免重新选择图片造成重复。</p><form id="aa-bulk-form"><p><label><input id="aa-bulk-publish" type="checkbox" aria-describedby="aa-bulk-publish-help" '.disabled(current_user_can('publish_aa_items'),false,false).'> 创建后直接发布</label></p><p id="aa-bulk-publish-help">未勾选时仅保存草稿。勾选后，图片上传成功即发布；隐藏或未发布的分类仍不会对外展示。'.(!current_user_can('publish_aa_items')?'当前账号无发布权限。':'').'</p><p><label for="aa-bulk-category">所属分类（必选）</label><br><select id="aa-bulk-category" required><option value="">请选择分类</option>';
    foreach(get_posts(['post_type'=>'aa_collection','post_status'=>['publish','draft','private','pending','future'],'numberposts'=>-1,'orderby'=>['menu_order'=>'ASC','ID'=>'ASC']]) as $c){
        if(current_user_can('edit_post',$c->ID))echo '<option value="'.(int)$c->ID.'">'.esc_html($c->post_title).'</option>';
    }
    echo '</select></p><p><label for="aa-bulk-files">选择作品图片（可多选）</label><br><input id="aa-bulk-files" type="file" accept="image/jpeg,image/png,image/webp" multiple required aria-describedby="aa-bulk-help aa-bulk-status"></p><ol id="aa-bulk-items"></ol><p id="aa-bulk-status" role="status" aria-live="polite"></p><button class="button button-primary" type="submit">创建草稿作品</button> <a class="button" href="'.esc_url(admin_url('edit.php?post_type=aa_artwork&post_status=draft')).'">查看草稿</a></form><noscript><p>批量新增需要启用 JavaScript，也可以返回列表使用单件新增。</p></noscript></div>';
}
function aa_bulk_finish($id,$publish){
    if(!aa_valid_image((int)get_post_thumbnail_id($id)))return new WP_Error('image','作品图片未保存，暂不能完成');
    if($publish&&!get_post_meta($id,'_aa_bulk_complete',true)&&get_post_status($id)==='draft'){
        $result=wp_update_post(['ID'=>$id,'post_status'=>'publish'],true);
        if(is_wp_error($result))return $result;
        if(get_post_status($id)!=='publish')return new WP_Error('publish','图片已保存，但发布失败，请重试或手动检查草稿');
    }
    update_post_meta($id,'_aa_bulk_complete','1');
    return ['id'=>$id,'edit'=>get_edit_post_link($id,'raw'),'status'=>get_post_status($id)];
}
function aa_bulk_item(){
    if(!current_user_can('aa_manage_content')||!current_user_can('upload_files')||!current_user_can('edit_aa_items'))return new WP_Error('permission','没有批量新增权限');
    $mode=$_POST['publish']??'0';
    if(!in_array($mode,['0','1'],true))return new WP_Error('mode','发布选项无效');
    $publish=$mode==='1';
    if($publish&&!current_user_can('publish_aa_items'))return new WP_Error('permission','没有发布作品权限');
    $key=wp_unslash($_POST['key']??'');
    if(!is_string($key)||!preg_match('/^[a-f0-9-]{36}$/D',$key))return new WP_Error('key','请求编号无效，请重新打开批量页');
    if(!is_scalar($_POST['collection']??null)||!is_string($_POST['title']??null))return new WP_Error('input','分类或标题格式无效');
    $cid=absint($_POST['collection']??0);
    if(get_post_type($cid)!=='aa_collection'||!in_array(get_post_status($cid),['publish','draft','private','pending','future'],true)||!current_user_can('edit_post',$cid))return new WP_Error('category','请选择有权限的有效分类');
    $title=sanitize_text_field(wp_unslash($_POST['title']??''));
    if($title==='')return new WP_Error('title','请填写作品标题');
    global $wpdb;
    $token=get_current_user_id().':'.$key;$lock='aa_bulk_'.md5($wpdb->prefix.$token);
    if((string)$wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 0)',$lock))!=='1')return new WP_Error('busy','该项正在处理或暂时无法锁定，请稍后重试');
    try{
        $ids=get_posts(['post_type'=>'aa_artwork','post_status'=>array_keys(get_post_stati()),'numberposts'=>1,'fields'=>'ids','meta_key'=>'_aa_bulk_key','meta_value'=>$token]);
        $id=$ids?(int)$ids[0]:0;
        if($id){
            if(!current_user_can('edit_post',$id)||get_post_status($id)==='trash')return new WP_Error('state','此项作品已移入回收站或无法编辑，请检查作品列表');
            if((int)aa_meta($id,'collection')!==$cid)return new WP_Error('conflict','此请求已用于其他分类，请检查作品列表');
            if(aa_meta($id,'bulk_publish','0')!==$mode)return new WP_Error('conflict','此项的发布选项已锁定，请按原选项重试');
            if(get_post_thumbnail_id($id))return aa_bulk_finish($id,$publish);
        }
        if(empty($_FILES['file']))return new WP_Error('file','未选择图片');
        $file=aa_check_upload($_FILES['file']);
        if(!empty($file['error']))return new WP_Error('file',is_string($file['error'])?$file['error']:'上传失败，请检查文件大小');
        if(!$id){
            $id=wp_insert_post(['post_type'=>'aa_artwork','post_status'=>'draft','post_title'=>$title,'post_author'=>get_current_user_id(),'meta_input'=>['_aa_collection'=>$cid,'_aa_bulk_key'=>$token,'_aa_bulk_publish'=>$mode,'_aa_gallery'=>[]]],true);
            if(is_wp_error($id))return $id;
        }
        // Recover an attachment if the earlier request completed its upload but lost the response.
        $attachments=get_posts(['post_type'=>'attachment','post_status'=>'inherit','post_parent'=>$id,'numberposts'=>1,'fields'=>'ids']);
        $image=$attachments?(int)$attachments[0]:0;
        if(!$image){
            require_once ABSPATH.'wp-admin/includes/image.php';require_once ABSPATH.'wp-admin/includes/file.php';require_once ABSPATH.'wp-admin/includes/media.php';
            $image=media_handle_upload('file',$id);
            if(is_wp_error($image))return new WP_Error('upload',$image->get_error_message().'（已保留草稿，重试会继续该作品）');
        }
        if(!aa_valid_image($image))return new WP_Error('image','图片无效，请检查草稿和媒体库');
        set_post_thumbnail($id,$image);
        if((int)get_post_thumbnail_id($id)!==$image)return new WP_Error('save','图片已上传，保存关联失败，请重试');
        return aa_bulk_finish($id,$publish);
    }finally{$wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)',$lock));}
}
add_action('wp_ajax_aa_bulk',function(){
    check_ajax_referer('aa_bulk','nonce');
    $result=aa_bulk_item();
    if(is_wp_error($result))wp_send_json_error(['message'=>$result->get_error_message()],400);
    wp_send_json_success($result);
});
