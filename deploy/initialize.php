<?php
if (!defined('WP_CLI') || !WP_CLI) exit;
aa_roles();
if (!get_user_by('login', 'alexis')) {
    $id = wp_create_user('alexis', trim(file_get_contents('/run/secrets/editor_password')), getenv('EDITOR_EMAIL'));
    if (is_wp_error($id)) WP_CLI::error($id->get_error_message());
    (new WP_User($id))->set_role('aa_editor');
}
if (!get_page_by_path('about')) wp_insert_post(['post_type'=>'page','post_title'=>'About','post_name'=>'about','post_status'=>'publish']);
if (!get_option('aa_deployment_initialized')) {
    update_option('blog_public', '0');
    update_option('aa_deployment_initialized', '1');
}
WP_CLI::success('Content management ready; no private images imported. Existing users and content preserved.');
