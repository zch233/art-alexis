<?php
// Read-only integration probe using the WordPress admin's real query entry point.
define('WP_ADMIN',true);
require '/var/www/html/wp-load.php';
require_once ABSPATH.'wp-admin/includes/admin.php';
if(!in_array(wp_parse_url(home_url(),PHP_URL_HOST),['localhost','127.0.0.1'],true))throw new Exception('Local only');
wp_set_current_user(get_users(['role'=>'administrator','number'=>1])[0]->ID);
$GLOBALS['pagenow']='edit.php';set_current_screen('edit-aa_artwork');
$_SERVER['PHP_SELF']='/wp-admin/edit.php';$_SERVER['REQUEST_URI']='/wp-admin/edit.php';
$collections=get_posts(['post_type'=>'aa_collection','numberposts'=>-1]);
$parameter=$argv[1]??'aa_filter_collection';
$results=[];
foreach($collections as $c){
 $_GET=['post_type'=>'aa_artwork',$parameter=>(string)$c->ID];$_REQUEST=$_GET;
 wp_edit_posts_query();global $wp_query;
 $expected=get_posts(['post_type'=>'aa_artwork','post_status'=>'publish','numberposts'=>-1,'meta_key'=>'_aa_collection','meta_value'=>$c->ID,'fields'=>'ids']);
 $actual=wp_list_pluck($wp_query->posts,'ID');sort($expected);sort($actual);
 $results[]=['collection'=>$c->post_title,'expected'=>$expected,'actual'=>$actual,'type'=>$wp_query->get('post_type'),'name'=>$wp_query->get('name'),'passed'=>$expected===$actual];
}
if($parameter==='aa_filter_collection'){
 $c=get_page_by_path('current-works',OBJECT,'aa_collection');
 $expected=get_posts(['post_type'=>'aa_artwork','post_status'=>'publish','numberposts'=>-1,'meta_key'=>'_aa_collection','meta_value'=>$c->ID,'fields'=>'ids','orderby'=>'ID','order'=>'ASC']);
 add_filter('edit_aa_artwork_per_page',fn()=>2);
 $_GET=['post_type'=>'aa_artwork','aa_filter_collection'=>(string)$c->ID,'paged'=>2,'orderby'=>'ID','order'=>'ASC'];$_REQUEST=$_GET;wp_edit_posts_query();
 $results[]=['case'=>'pagination','passed'=>wp_list_pluck($wp_query->posts,'ID')===array_slice($expected,2,2)];
 $_GET=['post_type'=>'aa_artwork','aa_filter_collection'=>['bad']];$_REQUEST=$_GET;wp_edit_posts_query();
 $results[]=['case'=>'array parameter rejected','passed'=>count($wp_query->posts)===0];
 $extra=function($q){if($q->is_main_query())$q->set('meta_query',['relation'=>'OR',['key'=>'_aa_collection','value'=>-10],['key'=>'_aa_collection','value'=>-20]]);};add_action('pre_get_posts',$extra,5);
 $_GET=['post_type'=>'aa_artwork','aa_filter_collection'=>(string)$c->ID];$_REQUEST=$_GET;wp_edit_posts_query();
 $results[]=['case'=>'existing OR conditions preserved under AND','passed'=>count($wp_query->posts)===0];remove_action('pre_get_posts',$extra,5);
}
echo wp_json_encode($results,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE)."\n";
foreach($results as $r)if(!$r['passed'])exit(1);
