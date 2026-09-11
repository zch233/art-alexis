import { runCLI } from '@wp-playground/cli';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import crypto from 'node:crypto';
await mkdir('work/runtime',{recursive:true});
await mkdir('work/private-seed',{recursive:true});
let password;
try { password=JSON.parse(await readFile('work/local-access.json','utf8')).password; } catch {}
if(!/^[A-Za-z0-9_-]{24}$/.test(password || '')) password=crypto.randomBytes(18).toString('base64url');
const cli=await runCLI({command:'server',port:9400,php:'8.3',wp:'latest',workers:6,wordpressInstallMode:'install-from-existing-files-if-needed','define-bool':{DISABLE_WP_CRON:true},
  mount:[{hostPath:resolve('wordpress/plugins/art-alexis'),vfsPath:'/wordpress/wp-content/plugins/art-alexis'},{hostPath:resolve('wordpress/themes/art-alexis'),vfsPath:'/wordpress/wp-content/themes/art-alexis'},{hostPath:resolve('work/private-seed'),vfsPath:'/seed-images'},{hostPath:resolve('tools'),vfsPath:'/aa-tools'}],
  'mount-before-install':[{hostPath:resolve('work/runtime'),vfsPath:'/wordpress'}],
  blueprint:{steps:[
    {step:'activatePlugin',pluginPath:'art-alexis/art-alexis.php'},
    {step:'activateTheme',themeFolderName:'art-alexis'},
    {step:'setSiteOptions',options:{blogname:'ALEXIS',blogdescription:'Art & Stories',blog_public:'0',permalink_structure:'/%postname%/'}},
    {step:'runPHP',code:`<?php require '/wordpress/wp-load.php'; wp_set_current_user(1); aa_roles(); wp_set_password('${password}',1); $editor=get_user_by('login','alexis'); if(!$editor){$uid=wp_create_user('alexis','${password}','alexis@localhost.test'); if(!is_wp_error($uid))(new WP_User($uid))->set_role('aa_editor');}else{wp_set_password('${password}',$editor->ID);} if(!get_page_by_path('about'))wp_insert_post(['post_type'=>'page','post_title'=>'About','post_name'=>'about','post_status'=>'publish']); flush_rewrite_rules();`}
  ]}
});
await writeFile('work/local-access.json',JSON.stringify({url:cli.serverUrl,admin:'admin',editor:'alexis',password},null,2));
if(process.env.AA_RUN_TESTS==='1') {
  const run=await cli.playground.run({code:"<?php require '/wordpress/wp-load.php'; require '/aa-tools/integration.php';"});
  await writeFile('work/integration-result.json',run.text);console.log(run.text);
}
console.log('Local WordPress ready at '+cli.serverUrl+'; access details in work/local-access.json');
