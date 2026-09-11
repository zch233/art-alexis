<?php
// Local development only; this file is never packaged in the plugin or theme.
if(!defined('ABSPATH'))exit;
$checks=[];
function aa_test($name,$ok){global $checks;$checks[]=['name'=>$name,'passed'=>(bool)$ok];}
wp_set_current_user(1);
aa_test('content types registered',post_type_exists('aa_artwork')&&post_type_exists('aa_collection'));
$seed=aa_import_initial('/seed-images');$again=aa_import_initial('/seed-images');
aa_test('initial import idempotent',!is_wp_error($seed)&&$seed===$again&&count($seed)===4);
$c=wp_insert_post(['post_type'=>'aa_collection','post_title'=>'QA collection','post_status'=>'publish','meta_input'=>['_aa_home'=>'0','_aa_hidden'=>'0']]);
$works=[];for($i=0;$i<14;$i++)$works[]=wp_insert_post(['post_type'=>'aa_artwork','post_title'=>'QA '.$i,'post_status'=>'publish','menu_order'=>$i,'meta_input'=>['_aa_collection'=>$c]]);
$draft=wp_insert_post(['post_type'=>'aa_artwork','post_title'=>'QA draft','post_status'=>'draft','meta_input'=>['_aa_collection'=>$c]]);
wp_set_current_user(0);
aa_test('12-item pagination',count(aa_artworks($c,1)->posts)===12 && count(aa_artworks($c,2)->posts)===2);
aa_test('single relation and ordering',wp_list_pluck(aa_artworks($c,1)->posts,'ID')===array_slice($works,0,12));
aa_test('draft not public',!aa_artwork_public($draft));
update_post_meta($c,'_aa_hidden','1');
aa_test('hidden series blocks works',!aa_artwork_public($works[0])&&aa_artworks($c,1)->post_count===0);
$direct=new WP_Query(['p'=>$works[0],'post_type'=>'aa_artwork']);aa_test('hidden direct query excluded',$direct->post_count===0);
update_post_meta($c,'_aa_hidden','0');aa_test('restore visibility preserves child publication',aa_artwork_public($works[0]));
wp_set_current_user(1);wp_trash_post($c);wp_set_current_user(0);aa_test('trashed collection blocks children',!aa_artwork_public($works[0]));
wp_set_current_user(1);wp_untrash_post($c);wp_update_post(['ID'=>$c,'post_status'=>'publish']);aa_test('restored collection keeps relation',(int)aa_meta($works[0],'collection')===$c);
$image=(int)get_post_thumbnail_id($seed[0]);
aa_test('image has at least cover and gallery references',count(aa_image_references($image))>=2);
aa_test('referenced media deletion blocked',wp_delete_attachment($image,true)===false && get_post_type($image)==='attachment');
aa_test('nonempty classification hard delete blocked',wp_delete_post($c,true)===false);
$editor=get_user_by('login','alexis');wp_set_current_user($editor->ID);
aa_test('editor has content access only',current_user_can('aa_manage_content')&&current_user_can('edit_post',$works[0])&&!current_user_can('manage_options')&&!current_user_can('install_plugins'));
wp_trash_post($works[0]);aa_test('editor can trash artwork',get_post_status($works[0])==='trash');aa_test('editor cannot permanently delete artwork',wp_delete_post($works[0],true)===false);
aa_test('editor cannot permanently delete media',!current_user_can('delete_post',$image));
wp_set_current_user(1);wp_untrash_post($works[0]);wp_update_post(['ID'=>$works[0],'post_status'=>'publish']);
aa_test('recovered artwork retains classification',(int)aa_meta($works[0],'collection')===$c);
// Keep isolated QA data in a hidden series for later browser tests; never delete originals.
update_post_meta($c,'_aa_hidden','1');
update_option('aa_qa_fixture',['collection'=>$c,'works'=>$works,'draft'=>$draft],false);
wp_set_current_user(0);aa_test('anonymous cannot edit',!current_user_can('aa_manage_content'));
echo wp_json_encode(['checks'=>$checks,'passed'=>!in_array(false,array_column($checks,'passed'),true),'fixture'=>$c],JSON_PRETTY_PRINT);
