<?php
require '/var/www/html/wp-load.php';
if(!in_array(wp_parse_url(home_url(),PHP_URL_HOST),['localhost','127.0.0.1'],true))throw new Exception('Local only');
global $wpdb;
$c=get_posts(['post_type'=>'aa_collection','numberposts'=>1,'name'=>'early-explorations'])[0];
$admin=get_users(['role'=>'administrator','number'=>1])[0];
$wpdb->query('START TRANSACTION');
try{
    wp_set_current_user($admin->ID);
    $_POST=['aa_nonce'=>wp_create_nonce('aa_save'),'aa_layout'=>'double','aa_lightbox_navigation'=>'off'];
    do_action('save_post',$c->ID,$c);
    if(aa_collection_display($c->ID)!==['layout'=>'double','navigation'=>'off'])throw new Exception('Explicit layout independent from navigation');
    $wpdb->update($wpdb->posts,['post_name'=>'qa-renamed-collection'],['ID'=>$c->ID]);clean_post_cache($c->ID);
    if(aa_collection_display($c->ID)['layout']!=='double')throw new Exception('Rename must retain settings');
    $_POST['aa_layout']='injected';$_POST['aa_lightbox_navigation']=['on'];do_action('save_post',$c->ID,$c);
    if(aa_collection_display($c->ID)!==['layout'=>'double','navigation'=>'off'])throw new Exception('Invalid values must preserve previous settings');
    $_POST=['aa_nonce'=>'invalid','aa_layout'=>'single','aa_lightbox_navigation'=>'on'];do_action('save_post',$c->ID,$c);
    if(aa_collection_display($c->ID)['layout']!=='double')throw new Exception('Nonce guard');
    wp_set_current_user(0);$_POST['aa_nonce']=wp_create_nonce('aa_save');do_action('save_post',$c->ID,$c);
    if(aa_collection_display($c->ID)['layout']!=='double')throw new Exception('Permission guard');
    echo "PASS settings save / independent options / rename / invalid values / nonce / permissions\n";
}finally{$wpdb->query('ROLLBACK');clean_post_cache($c->ID);}
