<?php
// Runs only via local WP-CLI, never installed in public plugin/theme.
if (!defined('WP_CLI') || !WP_CLI) exit;
wp_set_current_user(1);
aa_roles();
if (!get_user_by('login', 'alexis')) {
    $id = wp_create_user('alexis', getenv('AA_EDITOR_PASSWORD'), 'alexis@localhost.test');
    if (is_wp_error($id)) WP_CLI::error($id->get_error_message());
    (new WP_User($id))->set_role('aa_editor');
}
update_option('blog_public', '0');
update_option('permalink_structure', '/%postname%/');
if (!get_page_by_path('about')) wp_insert_post(['post_type'=>'page','post_title'=>'About','post_name'=>'about','post_status'=>'publish']);
flush_rewrite_rules();
WP_CLI::success('Initialized Art Alexis; upload artworks separately. Existing content preserved.');
