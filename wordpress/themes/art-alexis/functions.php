<?php
defined('ABSPATH') || exit;
add_action('after_setup_theme',function(){add_theme_support('title-tag');add_theme_support('post-thumbnails');add_theme_support('html5',['gallery','caption','style','script']);foreach(['small'=>480,'medium'=>768,'large'=>1280,'full'=>1920] as $name=>$width)add_image_size('aa_'.$name,$width,0,false);});
add_filter('big_image_size_threshold','__return_false');
add_filter('intermediate_image_sizes_advanced',fn($sizes)=>array_intersect_key($sizes,array_flip(['thumbnail','aa_small','aa_medium','aa_large','aa_full'])));
add_action('wp_enqueue_scripts',function(){
    $url=get_template_directory_uri();$dir=get_template_directory();
    wp_enqueue_style('aa-site',$url.'/assets/site.css',[],(string)filemtime($dir.'/assets/site.css'));
    wp_enqueue_script('aa-site',$url.'/assets/site.js',[],(string)filemtime($dir.'/assets/site.js'),['in_footer'=>true,'strategy'=>'defer']);
    wp_localize_script('aa-site','AA',['api'=>esc_url_raw(rest_url('art-alexis/v1/collection/'))]);
    wp_dequeue_style('wp-block-library');
});
add_filter('language_attributes',fn()=> 'lang="en"');
add_filter('document_title_parts',function($parts){if(function_exists('aa_settings'))$parts['site']=aa_settings()['brand'];if(is_front_page()){$parts['title']='Art & Stories';unset($parts['tagline']);}return $parts;});
function alexis_about_url(){ $page=get_page_by_path('about');return $page?get_permalink($page):home_url('/about/'); }
function alexis_image($id,$size='aa_large',$attrs=[]){
    if(!$id)return '<div class="image-placeholder">Image coming soon</div>';
    return wp_get_attachment_image($id,$size,false,array_merge(['sizes'=>'(max-width: 767px) 100vw, 50vw'],$attrs));
}
function alexis_heading($label,$title,$description=''){
    echo '<section class="section-heading"><p class="eyebrow">'.esc_html($label).'</p><h1>'.esc_html($title).'</h1>';
    if($description!=='')echo '<div class="subrow"><p>'.nl2br(esc_html($description)).'</p></div>';echo '</section>';
}
function alexis_collection_card($c,$i){
    $count=aa_artworks($c->ID,1,1)->found_posts;
    echo '<a class="collection-card" href="'.esc_url(get_permalink($c)).'"><div class="crop">'.alexis_image(get_post_thumbnail_id($c),'aa_large',['style'=>'object-position:'.aa_focus($c->ID),'loading'=>$i===0?'eager':'lazy']).'</div><div class="collection-label"><span class="number">'.esc_html(sprintf('%02d / COLLECTION',$i+1)).'</span><h2>'.esc_html($c->post_title).'</h2><div class="bottom"><p>'.esc_html(aa_meta($c->ID,'age','Art & stories')).' · '.(int)$count.' '.($count===1?'artwork':'artworks').'</p><span class="arrow" aria-hidden="true">↗</span></div></div></a>';
}
function alexis_art_card($p){
    echo '<a class="art-card" data-id="'.(int)$p->ID.'" href="'.esc_url(get_permalink($p)).'"><div class="crop">'.alexis_image(get_post_thumbnail_id($p),'aa_medium',['style'=>'object-position:'.aa_focus($p->ID)]).'</div><div class="art-label"><div><h2>'.esc_html($p->post_title).'</h2></div><span class="arrow" aria-hidden="true">↗</span></div></a>';
}
add_action('wp_head',function(){
    if(!function_exists('aa_settings'))return;
    $s=aa_settings();$id=get_queried_object_id();$url=is_front_page()?home_url('/'):get_permalink($id);if(is_post_type_archive('aa_artwork'))$url=get_post_type_archive_link('aa_artwork');
    $description=aa_meta($id,'summary',$s['intro']);if(is_page('about'))$description=$s['about']?:$s['intro'];
    $description=wp_trim_words(wp_strip_all_tags($description),35,'…');
    echo '<meta name="description" content="'.esc_attr($description).'"><meta name="theme-color" content="#190e30">';
    if(!is_404()&&!is_preview())echo '<link rel="canonical" href="'.esc_url($url).'"><meta property="og:url" content="'.esc_url($url).'">';
    echo '<meta property="og:title" content="'.esc_attr(wp_get_document_title()).'"><meta property="og:description" content="'.esc_attr($description).'"><meta property="og:type" content="website"><meta property="og:locale" content="en_US"><meta name="twitter:card" content="summary_large_image">';
    $cover=get_post_thumbnail_id($id);if(!$cover){$collections=aa_collections();if($collections)$cover=get_post_thumbnail_id($collections[0]);}
    if($cover)echo '<meta property="og:image" content="'.esc_url(wp_get_attachment_image_url($cover,'aa_full')).'">';
    echo '<link rel="icon" href="'.esc_url(get_template_directory_uri().'/assets/favicon.svg').'">';
});
remove_action('wp_head','rel_canonical');
