<?php
// Explicit local-only import; never packaged in public plugin/theme.
if(PHP_SAPI!=='cli')exit(1);
require '/var/www/html/wp-load.php';
if(!in_array(wp_parse_url(home_url(),PHP_URL_HOST),['127.0.0.1','localhost'],true))throw new Exception('Local sites only');
$directory=$argv[1]??'';$m=json_decode(file_get_contents($directory.'/manifest.json'),true,512,JSON_THROW_ON_ERROR);
if(($m['version']??0)!==1||count($m['collections'])!==4)throw new Exception('Unexpected manifest');
foreach($m['files'] as $f){if(basename($f['file'])!==$f['file']||hash_file('sha256',$directory.'/'.$f['file'])!==$f['sha256'])throw new Exception('Asset checksum mismatch');}
$admin=get_users(['role'=>'administrator','number'=>1])[0];wp_set_current_user($admin->ID);
require_once ABSPATH.'wp-admin/includes/image.php';require_once ABSPATH.'wp-admin/includes/file.php';require_once ABSPATH.'wp-admin/includes/media.php';
$map=get_option('aa_source_asset_map',[]);$report=[];
function source_image($key){
 global $directory,$m,$map;
 $f=$m['files'][$key];$hash=$f['sha256'];
 if(isset($map[$hash])&&get_post_type($map[$hash])==='attachment')return $map[$hash];
 $temp=wp_tempnam($f['file']);copy($directory.'/'.$f['file'],$temp);
 $id=media_handle_sideload(['name'=>$f['file'],'tmp_name'=>$temp,'size'=>filesize($temp)],0);
 if(is_wp_error($id))throw new Exception($id->get_error_message());
 update_post_meta($id,'_aa_source_sha256',$hash);update_post_meta($id,'_aa_source_placeholder',$f['placeholder']?'1':'0');
 $map[$hash]=$id;update_option('aa_source_asset_map',$map,false);return $id;
}
// Reject unexpected user-authored records before changing anything.
foreach($m['collections'] as $c){
 $existing=get_page_by_path($c['slug'],OBJECT,'aa_collection');
 if($existing){foreach(aa_artworks($existing->ID,1,-1)->posts as $p){if($p->post_name!==$c['slug'].'-untitled'&&!get_post_meta($p->ID,'_aa_source_key',true))throw new Exception('Unrecognized existing artwork: '.$p->ID.'; manual merge required');}}
}
foreach($m['collections'] as $order=>$c){
 $existing=get_page_by_path($c['slug'],OBJECT,'aa_collection');
 $cid=wp_insert_post(['ID'=>$existing?$existing->ID:0,'post_type'=>'aa_collection','post_name'=>$c['slug'],'post_title'=>$c['title'],'post_status'=>'publish','menu_order'=>$order],true);
 if(is_wp_error($cid))throw new Exception($cid->get_error_message());
 foreach(['home'=>'1','hidden'=>'0','age'=>$c['age'],'detail_meta'=>$c['meta']] as $k=>$v)update_post_meta($cid,'_aa_'.$k,$v);
 set_post_thumbnail($cid,source_image($c['cover']));
 $groups=$c['grid']?array_map(fn($item)=>[$item],$c['items']):[$c['items']];
 foreach($groups as $i=>$group){
  $slug=$i===0?$c['slug'].'-untitled':$c['slug'].'-source-'.str_pad((string)($i+1),2,'0',STR_PAD_LEFT);
  $existing=get_page_by_path($slug,OBJECT,'aa_artwork');
  $pid=wp_insert_post(['ID'=>$existing?$existing->ID:0,'post_type'=>'aa_artwork','post_name'=>$slug,'post_title'=>$c['grid']?$group[0]['title']:$c['title'],'post_status'=>'publish','menu_order'=>$i],true);
  if(is_wp_error($pid))throw new Exception($pid->get_error_message());
  $gallery=[];foreach($group as $j=>$item){$aid=source_image($item['key']);$alt=$c['grid']?$item['title']:$c['title'].' — image '.($j+1);update_post_meta($aid,'_wp_attachment_image_alt',$alt);$gallery[]=['id'=>$aid,'alt'=>$alt,'caption'=>$c['grid']?$item['caption']:''];}
  update_post_meta($pid,'_aa_collection',$cid);update_post_meta($pid,'_aa_gallery',$gallery);update_post_meta($pid,'_aa_summary',$c['grid']?$group[0]['caption']:'');update_post_meta($pid,'_aa_source_key',$slug);set_post_thumbnail($pid,$gallery[0]['id']);
 }
 $report[]=['slug'=>$c['slug'],'artworks'=>count($groups),'images'=>count($c['items'])];
}
update_option('aa_settings',array_merge(aa_settings(),$m['settings']));
echo wp_json_encode(['imported'=>$report,'assetMap'=>count($map),'settings'=>'source copy applied; existing real email preserved'],JSON_PRETTY_PRINT)."\n";
