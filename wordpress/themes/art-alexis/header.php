<!doctype html><html <?php language_attributes(); ?>><head><meta charset="<?php bloginfo('charset'); ?>"><meta name="viewport" content="width=device-width,initial-scale=1"><?php wp_head(); ?></head><body <?php body_class(); ?>><?php wp_body_open(); ?>
<a class="skip-link" href="#main">Skip to content</a>
<?php $s=function_exists('aa_settings')?aa_settings():['brand'=>'ALEXIS','email'=>'']; $contact_url=$s['email']?'mailto:'.$s['email']:home_url('/#contact'); ?>
<div class="surface-depth" aria-hidden="true"></div>
<canvas id="ambient-canvas" aria-hidden="true"></canvas>
<?php if(!alexis_is_detail()): ?>
<header class="site-header">
<div class="navbar-container">
<a class="brand" href="<?php echo esc_url(home_url('/')); ?>"><?php echo esc_html($s['brand']); ?></a>
<button type="button" class="menu" aria-label="Menu" aria-expanded="false" aria-controls="navigation"><?php echo alexis_icon('menu'); ?></button>
<nav id="navigation" aria-label="Main navigation">
<a href="<?php echo esc_url(home_url('/')); ?>" <?php if(is_front_page())echo 'aria-current="page"'; ?>>Home</a>
<a href="<?php echo esc_url(alexis_about_url()); ?>" <?php if(is_page('about'))echo 'aria-current="page"'; ?>>About</a>
<a href="<?php echo esc_url(get_post_type_archive_link('aa_artwork')); ?>" <?php if(is_post_type_archive('aa_artwork'))echo 'aria-current="page"'; ?>>Work</a>
<a class="nav-contact" href="<?php echo esc_url($contact_url); ?>">Contact</a>
</nav>
<a class="header-contact" href="<?php echo esc_url($contact_url); ?>">Contact</a>
</div>
</header>
<?php endif; ?>
<main id="main" tabindex="-1" class="<?php echo alexis_is_detail()?'detail-page-main':'page-wrapper'.(!is_front_page()?' standard-page':''); ?>">
