<?php
// Docker-only integration test: no DB writes or package installation.
define('WP_ADMIN', true);
require '/var/www/html/wp-load.php';
$admin=get_users(['role'=>'administrator','number'=>1])[0];
$editor=get_users(['role'=>'aa_editor','number'=>1])[0]??null;
if(!$editor)throw new Exception('Missing existing aa_editor test account');
$results=[];
$zip=['name'=>'theme.zip','tmp_name'=>'/tmp/aa-upload-regression.zip','size'=>100,'error'=>0];
file_put_contents($zip['tmp_name'],"PK\x03\x04not-an-image");
function setup_upload($kind='theme'){
 global $admin,$pagenow,$zip;
 wp_set_current_user($admin->ID);$pagenow='update.php';$_SERVER['REQUEST_METHOD']='POST';
 $_REQUEST=['action'=>'upload-'.$kind,'_wpnonce'=>wp_create_nonce($kind.'-upload')];
 $_FILES=[$kind.'zip'=>$zip];
}
function test_upload($name,$allowed,$file=null,$hook='wp_handle_upload_prefilter'){
 global $zip,$results;
 $result=apply_filters($hook,$file??$zip);$passed=empty($result['error'])===$allowed;
 $results[]=['name'=>$name,'passed'=>$passed];
}
setup_upload();test_upload('administrator theme package reaches core validator',true);
setup_upload('plugin');test_upload('administrator plugin package reaches core validator',true);
setup_upload();$pagenow='async-upload.php';test_upload('media ZIP remains blocked',false);
setup_upload();$_REQUEST['_wpnonce']='bad';test_upload('invalid nonce blocked',false);
setup_upload();unset($_REQUEST['_wpnonce']);test_upload('missing nonce blocked',false);
setup_upload();$_SERVER['REQUEST_METHOD']='GET';test_upload('GET blocked',false);
setup_upload();$_FILES['themezip']['tmp_name']='/tmp/another-file';test_upload('unmatched upload blocked',false);
setup_upload();test_upload('sideload not exempt',false,null,'wp_handle_sideload_prefilter');
setup_upload();wp_set_current_user($editor->ID);$_REQUEST['_wpnonce']=wp_create_nonce('theme-upload');test_upload('content editor cannot bypass with valid nonce',false);
setup_upload();test_upload('existing upload errors preserved',false,array_merge($zip,['error'=>'Earlier validation failure']));
setup_upload();test_upload('non ZIP filename not exempt',false,array_merge($zip,['name'=>'fake.jpg']));
setup_upload();$_REQUEST['action']='aa_upload';test_upload('artwork action not exempt',false);
$png=['name'=>'test.png','tmp_name'=>'/tmp/aa-upload-regression.png','size'=>68,'error'=>0];
file_put_contents($png['tmp_name'],base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='));
setup_upload();$pagenow='async-upload.php';test_upload('valid PNG accepted',true,$png);
test_upload('oversize PNG rejected',false,array_merge($png,['size'=>16*1024*1024]));
test_upload('disguised JPG rejected',false,array_merge($zip,['name'=>'fake.jpg']));
echo wp_json_encode($results,JSON_PRETTY_PRINT)."\n";
exit(in_array(false,array_column($results,'passed'),true)?1:0);
