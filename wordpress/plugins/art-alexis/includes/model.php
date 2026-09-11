<?php
defined('ABSPATH') || exit;
function aa_register() {
    foreach (['aa_collection' => ['作品分类', '分类', 'collection', false], 'aa_artwork' => ['作品', '作品', 'artwork', true]] as $type => $data) {
        register_post_type($type, [
            'labels' => ['name'=>$data[0], 'singular_name'=>$data[1], 'add_new_item'=>'新增'.$data[1], 'edit_item'=>'编辑'.$data[1], 'all_items'=>'全部'.$data[1], 'not_found'=>'暂无'.$data[1], 'not_found_in_trash'=>'回收站为空'],
            'public'=>true, 'show_in_rest'=>false, 'exclude_from_search'=>true,
            'supports'=>['title'], 'has_archive'=>$data[3] ? 'work' : false,
            'rewrite'=>['slug'=>$data[2], 'with_front'=>false], 'menu_icon'=>$data[3]?'dashicons-format-gallery':'dashicons-category',
            'capability_type'=>['aa_item','aa_items'], 'map_meta_cap'=>true,
        ]);
    }
}
add_action('init','aa_register');
add_filter('wp_untrash_post_status',function($status,$id,$previous){return in_array(get_post_type($id),['aa_artwork','aa_collection'],true)?$previous:$status;},10,3);
function aa_roles() {
    $caps=['read'=>true, 'upload_files'=>true, 'aa_manage_content'=>true];
    foreach (['edit_aa_items','edit_others_aa_items','edit_published_aa_items','edit_private_aa_items','publish_aa_items','read_private_aa_items','delete_aa_items','delete_others_aa_items','delete_published_aa_items','delete_private_aa_items'] as $cap) $caps[$cap]=true;
    add_role('aa_editor','作品编辑',$caps);
    foreach (['administrator','aa_editor'] as $role_name) { $role=get_role($role_name); if($role) foreach($caps as $cap=>$value) $role->add_cap($cap); }
}
function aa_meta($id,$key,$default='') { $v=get_post_meta($id,'_aa_'.$key,true); return $v===''?$default:$v; }
function aa_settings() {
    return wp_parse_args(get_option('aa_settings',[]),[
        'brand'=>'ALEXIS','subtitle'=>'Arts by Alexis','footer'=>'Arts by Alexis','email'=>'',
        'intro'=>"Hi, I'm Alexis! I've been writing and drawing passionately since I was young. I adore creating, as the only limitation is my own mind. Creativity makes me feel free, and I love linking my art and writing through story.",
        'about'=>'','photo'=>0,
    ]);
}
function aa_collections($home=false) {
    $args=['post_type'=>'aa_collection','post_status'=>'publish','posts_per_page'=>-1,'orderby'=>['menu_order'=>'ASC','ID'=>'ASC'], 'meta_query'=>[['relation'=>'OR',['key'=>'_aa_hidden','compare'=>'NOT EXISTS'],['key'=>'_aa_hidden','value'=>'1','compare'=>'!=']]]];
    if($home) $args['meta_query'][]=['key'=>'_aa_home','value'=>'1'];
    return get_posts($args);
}
function aa_collection_public($id) { return get_post_type($id)==='aa_collection' && get_post_status($id)==='publish' && aa_meta($id,'hidden','0')!=='1'; }
function aa_artwork_public($id) { return get_post_type($id)==='aa_artwork' && get_post_status($id)==='publish' && aa_collection_public((int)aa_meta($id,'collection',0)); }
function aa_artworks($collection,$page=1,$size=12) {
    if(!aa_collection_public($collection)) return new WP_Query(['post_type'=>'aa_artwork','post__in'=>[0]]);
    return new WP_Query(['post_type'=>'aa_artwork','post_status'=>'publish','posts_per_page'=>$size,'paged'=>max(1,$page),'orderby'=>['menu_order'=>'ASC','ID'=>'ASC'],'meta_key'=>'_aa_collection','meta_value'=>(int)$collection]);
}
// Filter every anonymous front-end query, not just the visible archive.
add_filter('posts_clauses',function($clauses,$q){
    if(is_admin() || (is_preview() && current_user_can('aa_manage_content'))) return $clauses;
    global $wpdb;
    $posts=$wpdb->posts; $meta=$wpdb->postmeta;
    $clauses['where'].=" AND ($posts.post_type != 'aa_collection' OR ($posts.post_status = 'publish' AND NOT EXISTS (SELECT 1 FROM $meta aah WHERE aah.post_id=$posts.ID AND aah.meta_key='_aa_hidden' AND aah.meta_value='1')))";
    $clauses['where'].=" AND ($posts.post_type != 'aa_artwork' OR ($posts.post_status = 'publish' AND EXISTS (SELECT 1 FROM $meta aar JOIN $posts aac ON aac.ID=aar.meta_value WHERE aar.post_id=$posts.ID AND aar.meta_key='_aa_collection' AND aac.post_type='aa_collection' AND aac.post_status='publish' AND NOT EXISTS (SELECT 1 FROM $meta aah2 WHERE aah2.post_id=aac.ID AND aah2.meta_key='_aa_hidden' AND aah2.meta_value='1'))))";
    return $clauses;
},10,2);
add_action('template_redirect',function(){
    if(is_singular(['aa_artwork','aa_collection'])) {
        $id=get_queried_object_id();
        $public=get_post_type($id)==='aa_artwork'?aa_artwork_public($id):aa_collection_public($id);
        $preview=is_preview() && current_user_can('edit_post',$id);
        if(!$public&&!$preview){global $wp_query;$wp_query->set_404();status_header(404);nocache_headers();}
        if($preview) nocache_headers();
    }
});
// No post endpoint, feed, oEmbed or sitemap can accidentally expose hidden series.
add_filter('wp_sitemaps_post_types',function($types){unset($types['aa_artwork'],$types['aa_collection']);return $types;});
add_filter('oembed_response_data',function($data,$post){return in_array($post->post_type,['aa_artwork','aa_collection'],true)?false:$data;},10,2);
add_filter('map_meta_cap',function($caps,$cap,$user_id,$args){
    if($cap==='delete_post' && !empty($args[0])) {
        $post=get_post((int)$args[0]);
        if($post && in_array($post->post_type,['aa_artwork','aa_collection'],true) && $post->post_status==='trash' && !user_can($user_id,'manage_options')) return ['do_not_allow'];
        if($post && $post->post_type==='attachment' && user_can($user_id,'aa_manage_content')) return user_can($user_id,'manage_options')?['manage_options']:['do_not_allow'];
    }
    return $caps;
},10,4);
add_filter('pre_delete_post',function($delete,$post){
    if(!in_array($post->post_type,['aa_artwork','aa_collection'],true))return $delete;
    if(!current_user_can('manage_options'))return false;
    if($post->post_type==='aa_collection'){
        global $wpdb;
        $count=$wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $wpdb->posts p JOIN $wpdb->postmeta m ON m.post_id=p.ID WHERE p.post_type='aa_artwork' AND m.meta_key='_aa_collection' AND m.meta_value=%s",(string)$post->ID));
        if($count)return false;
    }
    return $delete;
},10,2);
add_action('rest_api_init',function(){
    register_rest_route('art-alexis/v1','/collection/(?P<id>\d+)/works',[
        'methods'=>'GET','permission_callback'=>'__return_true',
        'args'=>['page'=>['default'=>1,'sanitize_callback'=>'absint','validate_callback'=>fn($p)=>is_numeric($p)&&$p>=1&&$p<=10000]],
        'callback'=>function($request){
            $id=(int)$request['id']; if(!aa_collection_public($id))return new WP_Error('not_found','Collection unavailable',['status'=>404]);
            $q=aa_artworks($id,(int)$request['page']); $items=[];
            foreach($q->posts as $post){$cover=(int)get_post_thumbnail_id($post);$items[]=['id'=>$post->ID,'title'=>get_the_title($post),'url'=>get_permalink($post),'image'=>wp_get_attachment_image_url($cover,'aa_medium')?:'','srcset'=>wp_get_attachment_image_srcset($cover,'aa_medium')?:'','alt'=>get_post_meta($cover,'_wp_attachment_image_alt',true)?:get_the_title($post),'focus'=>aa_focus($post->ID)];}
            $res=new WP_REST_Response(['items'=>$items,'page'=>(int)$request['page'],'pages'=>(int)$q->max_num_pages]);$res->header('Cache-Control','no-store');return $res;
        }
    ]);
});
function aa_focus($id){return max(0,min(100,(int)aa_meta($id,'focus_x',50))).'% '.max(0,min(100,(int)aa_meta($id,'focus_y',50))).'%';}
// Visibility changes must also purge host/plugin page caches; use dynamic origin responses until a host integration is configured.
add_action('send_headers',function(){if(!is_admin())nocache_headers();});
