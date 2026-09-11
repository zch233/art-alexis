<?php
defined('ABSPATH') || exit;
add_action('wp_ajax_aa_preview',function(){
    check_ajax_referer('aa_save','aa_nonce');
    $raw=wp_unslash($_POST);$id=absint($raw['post_ID']??0);
    if(!in_array(get_post_type($id),['aa_artwork','aa_collection'],true)||!current_user_can('edit_post',$id))wp_send_json_error(['message'=>'无预览权限'],403);
    $meta=[];foreach(['summary','age'] as $key)$meta['_aa_'.$key]=sanitize_textarea_field($raw['aa_'.$key]??'');
    foreach(['focus_x','focus_y'] as $key)$meta['_aa_'.$key]=max(0,min(100,(int)($raw['aa_'.$key]??50)));
    $cover=absint($raw['aa_cover']??0);$meta['_thumbnail_id']=aa_valid_image($cover)?$cover:0;
    if(get_post_type($id)==='aa_artwork'){
        $cid=absint($raw['aa_collection']??0);if(get_post_type($cid)!=='aa_collection')wp_send_json_error(['message'=>'请先选择作品分类'],400);
        $meta['_aa_collection']=$cid;$gallery=json_decode($raw['aa_gallery']??'[]',true);$clean=[];$seen=[];
        if(is_array($gallery))foreach(array_slice($gallery,0,500) as $item){if(!is_array($item))continue;$image=absint($item['id']??0);if(!aa_valid_image($image)||isset($seen[$image]))continue;$seen[$image]=true;$clean[]=['id'=>$image,'caption'=>sanitize_textarea_field($item['caption']??''),'alt'=>sanitize_text_field($item['alt']??'')];}
        $meta['_aa_gallery']=$clean;if(!$cover&&!empty($clean))$meta['_thumbnail_id']=$clean[0]['id'];
    }
    $token=str_replace('-','',wp_generate_uuid4());
    set_transient('aa_preview_'.$token,['owner'=>get_current_user_id(),'id'=>$id,'title'=>sanitize_text_field($raw['post_title']??''),'meta'=>$meta],30*MINUTE_IN_SECONDS);
    wp_send_json_success(['url'=>add_query_arg(['p'=>$id,'post_type'=>get_post_type($id),'preview'=>'true','aa_preview'=>$token],home_url('/'))]);
});
function aa_preview_data(){
    static $checked=false,$data=null;
    if($checked)return $data;$checked=true;
    if(empty($_GET['aa_preview'])||!is_user_logged_in())return null;
    $token=sanitize_key(wp_unslash($_GET['aa_preview']));if(strlen($token)!==32)return null;
    $snapshot=get_transient('aa_preview_'.$token);
    if(is_array($snapshot)&&(int)$snapshot['owner']===get_current_user_id()&&current_user_can('edit_post',$snapshot['id']))$data=$snapshot;
    return $data;
}
add_filter('get_post_metadata',function($value,$id,$key){
    if(is_admin())return $value;$snapshot=aa_preview_data();
    return $snapshot&&(int)$snapshot['id']===(int)$id&&array_key_exists($key,$snapshot['meta'])?[$snapshot['meta'][$key]]:$value;
},10,3);
add_filter('the_posts',function($posts){
    if(is_admin())return $posts;$snapshot=aa_preview_data();if(!$snapshot)return $posts;
    foreach($posts as &$post)if($post->ID===$snapshot['id']){$post=clone $post;$post->post_title=$snapshot['title'];}
    return $posts;
});
add_action('template_redirect',function(){
    if(isset($_GET['aa_preview'])&&!aa_preview_data()){global $wp_query;$wp_query->set_404();status_header(404);nocache_headers();}
},1);
