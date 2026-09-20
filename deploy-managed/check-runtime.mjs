// Isolated local compatibility check, never connect to the customer's site.
import {runCLI} from '@wp-playground/cli';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const dest=resolve('work/managed-check-'+Date.now());
await mkdir(dest,{recursive:true});
const deadline=setTimeout(()=>{console.error('Compatibility runtime timed out; result is NOT a pass.');process.exit(1);},180000);
const cli=await runCLI({command:'server',port:19408,php:'8.2',wp:'7.0.4',workers:6,
 'define-bool':{DISABLE_WP_CRON:true},
 mount:[{hostPath:resolve('wordpress/plugins/art-alexis'),vfsPath:'/wordpress/wp-content/plugins/art-alexis'},
 {hostPath:resolve('wordpress/themes/art-alexis'),vfsPath:'/wordpress/wp-content/themes/art-alexis'},
 {hostPath:resolve('wordpress/plugins/art-alexis/seed'),vfsPath:'/seed-images'},
 {hostPath:resolve('tools'),vfsPath:'/aa-tools'}],
 blueprint:{steps:[{step:'activatePlugin',pluginPath:'art-alexis/art-alexis.php'},
 {step:'activateTheme',themeFolderName:'art-alexis'},
 {step:'runPHP',code:"<?php require '/wordpress/wp-load.php'; wp_set_current_user(1); aa_roles(); $id=wp_create_user('alexis',wp_generate_password(32),'qa@example.invalid'); if(is_wp_error($id))throw new Exception($id->get_error_message()); (new WP_User($id))->set_role('aa_editor');"}]}});
try{
 const result=await cli.playground.run({code:"<?php require '/wordpress/wp-load.php'; require '/aa-tools/integration.php';"});
 await writeFile(dest+'/integration.json',result.text);
 const parsed=JSON.parse(result.text);if(!parsed.passed)throw new Error('Integration checks failed: '+result.text);
 const response=await cli.playground.request({url:'/'});
 if(response.httpStatusCode!==200)throw new Error('Homepage failed: '+response.httpStatusCode);
 const versions=await cli.playground.run({code:"<?php require '/wordpress/wp-load.php'; echo json_encode(['php'=>PHP_VERSION,'wordpress'=>get_bloginfo('version')]);"});
 console.log(JSON.stringify({passed:true,versions:JSON.parse(versions.text),checks:parsed.checks.length,home:200,artifacts:dest}));
 clearTimeout(deadline);process.exit(0);
}catch(error){console.error(error);process.exit(1);}
