<?php
defined('ABSPATH') || exit;
function aa_valid_image($id){return $id>0 && get_post_type($id)==='attachment' && in_array(get_post_mime_type($id),['image/jpeg','image/png','image/webp'],true);}
add_filter('upload_mimes',function($mimes){if(current_user_can('aa_manage_content')&&!current_user_can('manage_options'))return ['jpg|jpeg|jpe'=>'image/jpeg','png'=>'image/png','webp'=>'image/webp'];return $mimes;});
function aa_check_upload($file){
    if(!current_user_can('aa_manage_content'))return $file;
    if(!empty($file['error']))return $file;
    if(($file['size']??0)>15*1024*1024){$file['error']='单张图片不能超过15MB。';return $file;}
    $size=@getimagesize($file['tmp_name']);
    if(!$size||!in_array($size['mime']??'',['image/jpeg','image/png','image/webp'],true)){$file['error']='仅支持真实的 JPG、PNG、静态 WebP 图片。';return $file;}
    if(max($size[0],$size[1])>12000||$size[0]*$size[1]>40000000){$file['error']='图片尺寸过大，请缩小到最长边12000px以内且总像素不超过4000万。';return $file;}
    if($size['mime']==='image/webp'){$h=fopen($file['tmp_name'],'rb');$head=$h?fread($h,32):'';if($h)fclose($h);if(substr($head,12,4)==='VP8X' && (ord($head[20]??"\0")&2))$file['error']='第一版暂不支持动态 WebP。';}
    return $file;
}
add_filter('wp_handle_upload_prefilter','aa_check_upload');add_filter('wp_handle_sideload_prefilter','aa_check_upload');
add_action('wp_ajax_aa_upload',function(){
    check_ajax_referer('aa_upload','nonce');
    if(!current_user_can('upload_files')||!current_user_can('aa_manage_content'))wp_send_json_error(['message'=>'没有上传权限'],403);
    $parent=absint($_POST['post']??0);if($parent&&!current_user_can('edit_post',$parent))wp_send_json_error(['message'=>'没有作品编辑权限'],403);
    if(empty($_FILES['file']))wp_send_json_error(['message'=>'未选择图片'],400);
    require_once ABSPATH.'wp-admin/includes/image.php';require_once ABSPATH.'wp-admin/includes/file.php';require_once ABSPATH.'wp-admin/includes/media.php';
    $id=media_handle_upload('file',$parent);
    if(is_wp_error($id))wp_send_json_error(['message'=>$id->get_error_message()],400);
    wp_send_json_success(['id'=>$id,'url'=>wp_get_attachment_image_url($id,'thumbnail'),'caption'=>'','alt'=>'']);
});
function aa_image_references($image){
    global $wpdb;$refs=[];
    $rows=$wpdb->get_results($wpdb->prepare("SELECT DISTINCT p.ID,p.post_title,p.post_type,m.meta_key,m.meta_value FROM $wpdb->posts p JOIN $wpdb->postmeta m ON m.post_id=p.ID WHERE p.post_type IN ('aa_artwork','aa_collection') AND (m.meta_key='_aa_gallery' OR (m.meta_key='_thumbnail_id' AND m.meta_value=%s))",(string)$image));
    foreach($rows as $r){$used=$r->meta_key==='_thumbnail_id';if(!$used)foreach((array)maybe_unserialize($r->meta_value) as $item)if(is_array($item)&&(int)($item['id']??0)===$image){$used=true;break;}if($used)$refs[$r->ID]=['id'=>(int)$r->ID,'title'=>$r->post_title?:'未命名','url'=>admin_url('post.php?post='.$r->ID.'&action=edit')];}
    if((int)aa_settings()['photo']===$image)$refs['about']=['id'=>0,'title'=>'About 个人照片','url'=>admin_url('admin.php?page=aa-site')];
    return array_values($refs);
}
add_filter('pre_delete_attachment',function($delete,$post){if(aa_image_references($post->ID))return false;if(current_user_can('aa_manage_content')&&!current_user_can('manage_options'))return false;return $delete;},10,2);
add_filter('pre_trash_post',function($trash,$post){return $post->post_type==='attachment' && aa_image_references($post->ID)?false:$trash;},10,2);
add_filter('attachment_fields_to_edit',function($fields,$post){
    $refs=aa_image_references($post->ID);if(!$refs)return $fields;$html='<p>此图片仍被使用，无法删除：</p><ul>';
    foreach($refs as $ref)$html.='<li><a href="'.esc_url($ref['url']).'">'.esc_html($ref['title']).'</a></li>';
    $fields['aa_refs']=['label'=>'引用位置','input'=>'html','html'=>$html.'</ul>'];return $fields;
},10,2);
