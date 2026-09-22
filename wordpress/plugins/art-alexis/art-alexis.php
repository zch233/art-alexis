<?php
/**
 * Plugin Name: Art Alexis — 作品管理
 * Description: 分类、作品、媒体引用保护和精简运营后台。
 * Version: 1.2.2
 * Requires at least: 6.5
 * Requires PHP: 8.1
 */
defined('ABSPATH') || exit;
define('AA_PATH', plugin_dir_path(__FILE__));
define('AA_URL', plugin_dir_url(__FILE__));
require_once AA_PATH . 'includes/model.php';
require_once AA_PATH . 'includes/admin.php';
require_once AA_PATH . 'includes/media.php';
require_once AA_PATH . 'includes/import.php';
require_once AA_PATH . 'includes/preview.php';
register_activation_hook(__FILE__, function () { aa_register(); aa_roles(); flush_rewrite_rules(); });
register_deactivation_hook(__FILE__, 'flush_rewrite_rules');
