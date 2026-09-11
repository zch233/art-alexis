<?php
defined('ABSPATH') || exit;
add_filter('use_block_editor_for_post_type',fn($use,$type)=>in_array($type,['aa_artwork','aa_collection'],true)?false:$use,10,2);
add_action('add_meta_boxes',function(){foreach(['aa_artwork','aa_collection'] as $type)add_meta_box('aa-details','内容与图片','aa_edit_box',$type,'normal','high');});
function aa_field($label,$name,$value,$type='text',$extra=''){
    echo '<p><label for="'.esc_attr($name).'"><strong>'.esc_html($label).'</strong></label><br>';
    if($type==='textarea')echo '<textarea class="widefat" rows="5" id="'.esc_attr($name).'" name="'.esc_attr($name).'">'.esc_textarea($value).'</textarea>';
    else echo '<input class="regular-text" id="'.esc_attr($name).'" name="'.esc_attr($name).'" type="'.esc_attr($type).'" value="'.esc_attr($value).'" '.$extra.'>';
    echo '</p>';
}
function aa_media_picker($name,$id,$label){
    echo '<div class="aa-picker"><input type="hidden" name="'.esc_attr($name).'" value="'.absint($id).'"><div class="aa-cover">'.($id?wp_get_attachment_image($id,'thumbnail'):'').'</div><button type="button" class="button aa-select">'.esc_html($label).'</button> <button type="button" class="button aa-clear">清除</button></div>';
}
function aa_edit_box($post){
    wp_nonce_field('aa_save','aa_nonce');
    $is_art=$post->post_type==='aa_artwork';
    if($is_art){
        $current=(int)aa_meta($post->ID,'collection',0);
        $collections=get_posts(['post_type'=>'aa_collection','post_status'=>['publish','draft','private','pending','future','trash'],'numberposts'=>-1,'orderby'=>['menu_order'=>'ASC','ID'=>'ASC']]);
        echo '<p><label for="aa_collection"><strong>所属分类（必选）</strong></label><br><select required id="aa_collection" name="aa_collection"><option value="">请选择分类</option>';
        foreach($collections as $c){if($c->post_status==='trash'&&$c->ID!==$current)continue;echo '<option value="'.(int)$c->ID.'" '.selected($current,$c->ID,false).'>'.esc_html($c->post_title.($c->post_status==='trash'?'（回收站）':(aa_meta($c->ID,'hidden')==='1'?'（隐藏）':''))).'</option>';}
        echo '</select></p>';
    }else{
        echo '<p><label><input type="checkbox" name="aa_home" value="1" '.checked(aa_meta($post->ID,'home','1'),'1',false).'> 展示在首页</label></p><p><label><input type="checkbox" name="aa_hidden" value="1" '.checked(aa_meta($post->ID,'hidden'),'1',false).'> 隐藏分类及其作品网页（保留内容）</label></p>';
        aa_field('阶段标注（可选，例如 Age 6–12）','aa_age',aa_meta($post->ID,'age'));
    }
    aa_field('简介（纯文字，可换行）','aa_summary',aa_meta($post->ID,'summary'),'textarea');
    aa_field('排序（数字越小越靠前）','aa_order',$post->menu_order,'number','step="1"');
    echo '<h3>封面</h3>';aa_media_picker('aa_cover',get_post_thumbnail_id($post),'选择封面');
    echo '<p>封面焦点：调整预览中的裁切位置，不修改原图。</p>';
    aa_field('水平焦点 0–100','aa_focus_x',aa_meta($post->ID,'focus_x',50),'range','min="0" max="100"');
    aa_field('垂直焦点 0–100','aa_focus_y',aa_meta($post->ID,'focus_y',50),'range','min="0" max="100"');
    if($is_art){
        echo '<h3>作品图集</h3><p>拖动调整顺序，或使用上移/下移。支持静态 JPG、PNG、WebP，单张最多15MB，每批最多20张。</p><p><button type="button" class="button aa-gallery-select">从媒体库添加</button> <label class="button" for="aa-files">上传新图片</label><input id="aa-files" type="file" accept="image/jpeg,image/png,image/webp" multiple></p><div id="aa-upload-status" role="status" aria-live="polite"></div><ul id="aa-gallery"></ul><input type="hidden" id="aa-gallery-value" name="aa_gallery" value="'.esc_attr(wp_json_encode(aa_meta($post->ID,'gallery',[]))).'">';
    }
}
add_filter('wp_insert_post_data',function($data,$postarr){
    if(!in_array($data['post_type'],['aa_artwork','aa_collection'],true))return $data;
    if(isset($_POST['aa_nonce']) && wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['aa_nonce'])),'aa_save') && current_user_can('aa_manage_content')){
        $data['menu_order']=isset($_POST['aa_order'])?(int)$_POST['aa_order']:0;
        if($data['post_type']==='aa_artwork' && get_post_type(absint($_POST['aa_collection']??0))!=='aa_collection')$data['post_status']='draft';
    }
    return $data;
},10,2);
add_action('save_post',function($id,$post){
    if(!in_array($post->post_type,['aa_artwork','aa_collection'],true)||wp_is_post_revision($id)||wp_is_post_autosave($id))return;
    if(!isset($_POST['aa_nonce'])||!wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['aa_nonce'])),'aa_save')||!current_user_can('edit_post',$id))return;
    $source=wp_unslash($_POST);
    foreach(['summary','age'] as $key)update_post_meta($id,'_aa_'.$key,sanitize_textarea_field($source['aa_'.$key]??''));
    foreach(['focus_x','focus_y'] as $key)update_post_meta($id,'_aa_'.$key,max(0,min(100,(int)($source['aa_'.$key]??50))));
    $cover=absint($source['aa_cover']??0);if(aa_valid_image($cover))set_post_thumbnail($id,$cover);else delete_post_thumbnail($id);
    if($post->post_type==='aa_collection'){
        foreach(['hidden','home'] as $key)update_post_meta($id,'_aa_'.$key,empty($source['aa_'.$key])?'0':'1');
    }else{
        $collection=absint($source['aa_collection']??0);
        if(get_post_type($collection)==='aa_collection')update_post_meta($id,'_aa_collection',$collection);
        $raw=json_decode($source['aa_gallery']??'[]',true);$clean=[];$seen=[];
        if(is_array($raw))foreach(array_slice($raw,0,500) as $item){if(!is_array($item))continue;$image=absint($item['id']??0);if(!aa_valid_image($image)||isset($seen[$image]))continue;$seen[$image]=true;$clean[]=['id'=>$image,'caption'=>sanitize_textarea_field($item['caption']??''),'alt'=>sanitize_text_field($item['alt']??'')];}
        update_post_meta($id,'_aa_gallery',$clean);
        if(!$cover&&!empty($clean))set_post_thumbnail($id,$clean[0]['id']);
    }
},10,2);
add_action('admin_enqueue_scripts',function(){
    $screen=get_current_screen();if(!$screen || (!in_array($screen->post_type,['aa_artwork','aa_collection'],true)&&$screen->id!=='toplevel_page_aa-site'))return;
    wp_enqueue_media();wp_enqueue_script('aa-admin',AA_URL.'assets/admin.js',['jquery','jquery-ui-sortable','media-editor'],'1.0.0',true);
    wp_enqueue_style('aa-admin',AA_URL.'assets/admin.css',[],'1.0.0');
    $id=get_the_ID();$gallery=[];foreach((array)aa_meta($id,'gallery',[]) as $item){$item['url']=wp_get_attachment_image_url($item['id'],'thumbnail');$gallery[]=$item;}
    wp_localize_script('aa-admin','AAAdmin',['ajax'=>admin_url('admin-ajax.php'),'nonce'=>wp_create_nonce('aa_upload'),'post'=>absint($id),'gallery'=>$gallery]);
});
add_action('admin_menu',function(){
    add_menu_page('网站内容','网站内容','aa_manage_content','aa-site','aa_settings_page','dashicons-admin-site-alt3',30);
    if(current_user_can('aa_manage_content')&&!current_user_can('manage_options'))foreach(['index.php','edit.php','edit.php?post_type=page','edit-comments.php','tools.php','themes.php','plugins.php','options-general.php'] as $menu)remove_menu_page($menu);
});
add_filter('login_redirect',function($redirect,$requested,$user){return $user instanceof WP_User && user_can($user,'aa_manage_content')&&!user_can($user,'manage_options')?admin_url('edit.php?post_type=aa_artwork'):$redirect;},10,3);
add_filter('show_admin_bar',fn($show)=>is_admin()?$show:false);
add_action('admin_init',function(){
    if(!wp_doing_ajax() && current_user_can('aa_manage_content')&&!current_user_can('manage_options') && ($GLOBALS['pagenow']??'')==='index.php'){wp_safe_redirect(admin_url('edit.php?post_type=aa_artwork'));exit;}
});
function aa_settings_page(){
    if(!current_user_can('aa_manage_content'))wp_die('无权限');
    if(isset($_POST['aa_site_nonce'])){
        check_admin_referer('aa_site','aa_site_nonce');$raw=wp_unslash($_POST);$data=[];
        foreach(['brand','subtitle','footer'] as $key)$data[$key]=sanitize_text_field($raw[$key]??'');
        foreach(['intro','about'] as $key)$data[$key]=sanitize_textarea_field($raw[$key]??'');
        $data['email']=sanitize_email($raw['email']??'');$data['photo']=aa_valid_image(absint($raw['photo']??0))?absint($raw['photo']):0;
        update_option('aa_settings',$data,false);echo '<div class="notice notice-success"><p>网站内容已保存。</p></div>';
    }
    $s=aa_settings();echo '<div class="wrap"><h1>网站内容</h1><form method="post">';wp_nonce_field('aa_site','aa_site_nonce');
    foreach(['brand'=>'首页名称','subtitle'=>'首页副标题','footer'=>'页脚文字','email'=>'联系邮箱'] as $key=>$label)aa_field($label,$key,$s[$key],$key==='email'?'email':'text');
    aa_field('首页简介','intro',$s['intro'],'textarea');aa_field('About 页面介绍（留空使用首页简介）','about',$s['about'],'textarea');
    echo '<h2>About 个人照片（可选）</h2>';aa_media_picker('photo',$s['photo'],'选择个人照片');submit_button('保存网站内容');echo '</form>';
    if(current_user_can('manage_options') && is_file(AA_PATH.'seed/early-explorations.jpg')){echo '<hr><h2>初始作品导入</h2><p>导入客户的四个分类及四件作品，不覆盖既有作品内容。</p><form action="'.esc_url(admin_url('admin-post.php')).'" method="post"><input type="hidden" name="action" value="aa_import_seed">';wp_nonce_field('aa_import_seed');submit_button('导入初始作品','secondary');echo '</form>';}
    echo '</div>';
}
foreach(['aa_artwork','aa_collection'] as $type){
    add_filter('manage_'.$type.'_posts_columns',function($cols){$cols['aa_cover']='封面';$cols['aa_order']='排序';$cols['aa_state']='分类 / 展示';return $cols;});
    add_action('manage_'.$type.'_posts_custom_column',function($col,$id){if($col==='aa_cover')echo get_the_post_thumbnail($id,[60,60]);if($col==='aa_order')echo (int)get_post($id)->menu_order;if($col==='aa_state')echo esc_html(get_post_type($id)==='aa_artwork'?get_the_title((int)aa_meta($id,'collection',0)):(aa_meta($id,'hidden')==='1'?'隐藏':'公开').(aa_meta($id,'home')==='1'?' / 首页':''));},10,2);
}
add_filter('post_row_actions',function($actions,$post){if(in_array($post->post_type,['aa_artwork','aa_collection'],true))unset($actions['inline hide-if-no-js']);return $actions;},10,2);
add_action('restrict_manage_posts',function($type){if($type!=='aa_artwork')return;
    echo '<label class="screen-reader-text" for="aa-filter">按作品分类筛选</label><select id="aa-filter" name="aa_collection"><option value="">全部作品分类</option>';
    foreach(get_posts(['post_type'=>'aa_collection','post_status'=>['publish','draft','private','trash'],'numberposts'=>-1]) as $c)echo '<option value="'.(int)$c->ID.'" '.selected(absint($_GET['aa_collection']??0),$c->ID,false).'>'.esc_html($c->post_title.($c->post_status==='trash'?'（回收站）':'')).'</option>';echo '</select>';
});
add_action('pre_get_posts',function($q){if(is_admin()&&$q->is_main_query()&&$q->get('post_type')==='aa_artwork'&&!empty($_GET['aa_collection'])){$q->set('meta_key','_aa_collection');$q->set('meta_value',absint($_GET['aa_collection']));}});
