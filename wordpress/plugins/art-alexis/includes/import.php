<?php
defined('ABSPATH') || exit;
/** Explicit, idempotent initial import. Never called on activation. */
function aa_import_initial($directory){
    if(!current_user_can('manage_options'))return new WP_Error('forbidden','仅管理员可以导入初始作品。');
    if(!get_page_by_path('about'))wp_insert_post(['post_type'=>'page','post_title'=>'About','post_name'=>'about','post_status'=>'publish']);
    require_once ABSPATH.'wp-admin/includes/image.php';require_once ABSPATH.'wp-admin/includes/file.php';require_once ABSPATH.'wp-admin/includes/media.php';
    $items=[['early-explorations','Early Explorations','Age 6–12'],['finding-my-style','Finding My Style','Ages 13–14'],['creative-experiments','Creative Experiments',''],['current-works','Current Works','']];
    $results=[];
    foreach($items as $i=>$item){
        [$slug,$title,$age]=$item;
        $path=trailingslashit($directory).$slug.'.jpg';if(!is_file($path))return new WP_Error('missing','缺少初始图片：'.$slug);
        $c=get_page_by_path($slug,OBJECT,'aa_collection');
        $cid=$c?$c->ID:wp_insert_post(['post_type'=>'aa_collection','post_title'=>$title,'post_name'=>$slug,'post_status'=>'publish','menu_order'=>$i,'meta_input'=>['_aa_home'=>'1','_aa_hidden'=>'0','_aa_age'=>$age]],true);
        if(is_wp_error($cid))return $cid;
        $p=get_page_by_path($slug.'-untitled',OBJECT,'aa_artwork');
        if(!$p){
            $pid=wp_insert_post(['post_type'=>'aa_artwork','post_title'=>'Untitled','post_name'=>$slug.'-untitled','post_status'=>'publish','menu_order'=>0,'meta_input'=>['_aa_collection'=>$cid]],true);if(is_wp_error($pid))return $pid;
        }else $pid=$p->ID;
        if(!get_post_thumbnail_id($pid)){
            $temp=wp_tempnam($slug.'.jpg');copy($path,$temp);
            $aid=media_handle_sideload(['name'=>$slug.'.jpg','tmp_name'=>$temp],$pid);
            if(is_wp_error($aid))return $aid;
            update_post_meta($aid,'_wp_attachment_image_alt','Untitled — '.$title);
            set_post_thumbnail($pid,$aid);update_post_meta($pid,'_aa_gallery',[['id'=>$aid,'alt'=>'Untitled — '.$title,'caption'=>'']]);
            if(!get_post_thumbnail_id($cid))set_post_thumbnail($cid,$aid);
        }
        $results[]=$pid;
    }
    return $results;
}
if(defined('WP_CLI')&&WP_CLI){WP_CLI::add_command('art-alexis import',function($args){$result=aa_import_initial($args[0]??'');if(is_wp_error($result))WP_CLI::error($result->get_error_message());WP_CLI::success('初始作品导入完成：'.count($result));});}
add_action('admin_post_aa_import_seed',function(){
    if(!current_user_can('manage_options'))wp_die('无权限',403);
    check_admin_referer('aa_import_seed');$result=aa_import_initial(AA_PATH.'seed');
    if(is_wp_error($result))wp_die(esc_html($result->get_error_message()));
    wp_safe_redirect(admin_url('edit.php?post_type=aa_artwork'));exit;
});
