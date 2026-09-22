<?php
defined('ABSPATH') || exit;
get_header();
if(!function_exists('aa_settings')){echo '<section class="section-heading"><h1>Art Alexis</h1><p>Please activate the Art Alexis content plugin.</p></section>';get_footer();return;}
$s=aa_settings();
if(alexis_is_detail()){require __DIR__.'/detail.php';get_footer();return;}
if(is_404()){
    alexis_heading('404','Page not found','This page is unavailable. Explore the public collections below.');echo '<a class="all-work" href="'.esc_url(get_post_type_archive_link('aa_artwork')).'">All collections ↗</a>';
}elseif(is_front_page()){
    ?><section class="hero"><div class="hero-shell"><div class="hero-grid"><span class="hero-rails hero-rails-top" aria-hidden="true"></span><span class="hero-rails hero-rails-bottom" aria-hidden="true"></span><div class="hero-title"><h1><?php echo esc_html($s['brand']); ?></h1></div><div class="hero-empty" aria-hidden="true"></div><div class="hero-subtitle"><p><?php echo esc_html($s['subtitle']); ?></p></div><a class="hero-scroll" href="#about" aria-label="Explore the page"><?php echo alexis_icon('down'); ?></a></div></div></section>
    <section class="section home-about" id="about"><div class="content-container"><div class="section-title-container"><h2>ABOUT</h2></div><div class="about-intro-wrapper"><p><?php echo nl2br(esc_html($s['intro'])); ?></p></div><a class="all-work" href="<?php echo esc_url(alexis_about_url()); ?>">More about me <?php echo alexis_icon('arrow'); ?></a></div></section>
    <section class="section home-work" id="work"><div class="content-container"><div class="section-title-container"><h2>WORK</h2></div><?php
    $collections=aa_collections(true);foreach($collections as $i=>$c)alexis_collection_card($c,$i);if(!$collections)echo '<p class="empty-state">New collections are on their way.</p>';
    echo '<a class="all-work" href="'.esc_url(get_post_type_archive_link('aa_artwork')).'">See More Work '.alexis_icon('arrow').'</a></div></section>';
}elseif(is_page('about')){
    alexis_heading('A little about me','ABOUT');echo '<section class="split"><div class="about-left">';
    if($s['photo'])echo alexis_image($s['photo'],'aa_large',['class'=>'about-photo']);else echo '<div class="about-mark">ART &<br>STORIES.</div>';
    echo '</div><div><p class="about-intro">'.nl2br(esc_html($s['about']?:$s['intro'])).'</p><a class="text-link" href="'.esc_url(get_post_type_archive_link('aa_artwork')).'">Explore my work ↗</a></div></section>';
}elseif(is_post_type_archive('aa_artwork')){
    echo '<section class="section"><div class="content-container">';
    alexis_heading('Art & stories','WORK','Explore my art through these collections.');$collections=aa_collections();foreach($collections as $i=>$c)alexis_collection_card($c,$i);if(!$collections)echo '<p class="empty-state">New collections are on their way.</p>';
    echo '</div></section>';
}else{
    alexis_heading('Art & stories',get_the_title()?:'ALEXIS');while(have_posts()){the_post();echo '<div class="collection-summary">';the_content();echo '</div>';}
}
get_footer();
