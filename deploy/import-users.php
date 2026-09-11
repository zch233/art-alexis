<?php
if (!defined('WP_CLI') || !WP_CLI) exit;
// A migration must not email the source site's users during account rotation.
add_filter('send_password_change_email', '__return_false');
add_filter('send_email_change_email', '__return_false');
$login = getenv('ADMIN_LOGIN');
if (!$login || $login === 'alexis' || sanitize_user($login, true) !== $login) WP_CLI::error('ADMIN_LOGIN must be a valid separate administrator login.');
if (!is_email(getenv('ADMIN_EMAIL')) || !is_email(getenv('EDITOR_EMAIL'))) WP_CLI::error('Valid production emails are required.');
if (strtolower(getenv('ADMIN_EMAIL')) === strtolower(getenv('EDITOR_EMAIL'))) WP_CLI::error('Administrator and editor need distinct emails.');
foreach ([[$login,getenv('ADMIN_EMAIL')],['alexis',getenv('EDITOR_EMAIL')]] as [$name,$email]) {
    $owner = get_user_by('email', $email);
    if ($owner && $owner->user_login !== $name) wp_update_user(['ID'=>$owner->ID,'user_email'=>'migrated-'.$owner->ID.'-'.wp_generate_password(12,false,false).'@users.invalid']);
}
aa_roles();
// Imported local credentials and sessions must not remain usable on the VPS.
foreach (get_users() as $user) {
    wp_set_password(wp_generate_password(40, true, true), $user->ID);
    WP_Session_Tokens::get_instance($user->ID)->destroy_all();
    if (in_array('administrator', $user->roles, true) && $user->user_login !== $login) $user->set_role('subscriber');
}
foreach ([[$login,'administrator','admin_password',getenv('ADMIN_EMAIL')],['alexis','aa_editor','editor_password',getenv('EDITOR_EMAIL')]] as [$name,$role,$secret,$email]) {
    $user = get_user_by('login', $name);
    $password = trim(file_get_contents('/run/secrets/'.$secret));
    $data = ['user_login'=>$name,'user_pass'=>$password,'user_email'=>$email];
    if ($user) $data['ID'] = $user->ID;
    $id = $user ? wp_update_user($data) : wp_insert_user($data);
    if (is_wp_error($id)) WP_CLI::error($id->get_error_message());
    (new WP_User($id))->set_role($role);
}
update_option('admin_email', getenv('ADMIN_EMAIL'));
update_option('aa_deployment_initialized', '1');
WP_CLI::success('Imported credentials rotated; only the configured administrator retains the administrator role.');
