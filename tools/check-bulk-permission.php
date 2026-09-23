<?php
define('WP_ADMIN',true);
require '/var/www/html/wp-load.php';
$user=get_user_by('login','alexis');wp_set_current_user($user->ID);
add_filter('user_has_cap',function($caps){$caps['publish_aa_items']=false;return $caps;});
$_POST=['publish'=>'1'];
$result=aa_bulk_item();
if(!is_wp_error($result)||$result->get_error_message()!=='没有发布作品权限')throw new Exception('Publication permission check failed');
echo "PASS publication denied without publish capability; no persistent role changes\n";
