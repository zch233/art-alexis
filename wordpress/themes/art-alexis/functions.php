<?php
defined('ABSPATH') || exit;
add_action('after_setup_theme',function(){add_theme_support('title-tag');add_theme_support('post-thumbnails');add_theme_support('html5',['gallery','caption','style','script']);foreach(['small'=>480,'medium'=>768,'large'=>1280,'full'=>1920] as $name=>$width)add_image_size('aa_'.$name,$width,0,false);});
add_filter('big_image_size_threshold','__return_false');
add_action('wp_head',function(){
    if(!is_front_page())return;
    // Progressive enhancement: no hidden content without JS; fail open if the bundle fails.
    echo '<script>if(matchMedia("(prefers-reduced-motion: no-preference)").matches){document.documentElement.classList.add("aa-motion-ready");setTimeout(function(){document.documentElement.classList.remove("aa-motion-ready")},4000)}</script>';
},2);
// Request the display font before the stylesheet finishes downloading.
add_action('wp_head',function(){
    echo '<link rel="preload" href="'.esc_url(get_template_directory_uri().'/assets/gasoek.woff2?v=1.2.1').'" as="font" type="font/woff2" crossorigin>';
},1);
add_filter('intermediate_image_sizes_advanced',fn($sizes)=>array_intersect_key($sizes,array_flip(['thumbnail','aa_small','aa_medium','aa_large','aa_full'])));
add_action('wp_enqueue_scripts',function(){
    $url=get_template_directory_uri();$dir=get_template_directory();
    wp_enqueue_style('aa-site',$url.'/assets/site.css',[],substr(hash_file('sha256',$dir.'/assets/site.css'),0,12));
    wp_enqueue_script('aa-site',$url.'/assets/site.js',[],substr(hash_file('sha256',$dir.'/assets/site.js'),0,12),['in_footer'=>true,'strategy'=>'defer']);
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
    echo '<a class="collection-card" href="'.esc_url(get_permalink($c)).'"><div class="crop">'.alexis_image(get_post_thumbnail_id($c),'aa_full',['style'=>'object-position:'.aa_focus($c->ID),'sizes'=>'(max-width: 479px) calc(100vw - 20px), (max-width: 1420px) calc(100vw - 40px), 1380px','loading'=>'lazy']).'</div><div class="collection-label"><div class="work-card-text-wrapper"><h2>'.esc_html($c->post_title).'</h2><p>'.esc_html(aa_meta($c->ID,'age')).'</p></div><span class="work-card-icon-wrapper">'.alexis_icon('arrow').'</span></div></a>';
}
function alexis_is_detail(){return !is_404() && is_singular(['aa_collection','aa_artwork']) && function_exists('aa_settings');}
add_filter('body_class',function($classes){if(alexis_is_detail())$classes[]='detail-page';return $classes;});
// Reuse the export's simple line geometry without external icon requests.
function alexis_icon($name){
    $paths=['close'=>'M5 5 19 19M19 5 5 19','arrow'=>'M2 22 22 2M2 2h20v20','down'=>'M12 4v15M5 12l7 7 7-7','menu'=>'M5 7h14M5 12h14M5 17h14'];
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'.($name==='close'?'1.6':'2').'" aria-hidden="true" focusable="false"><path d="'.$paths[$name].'"/></svg>';
}
function alexis_detail_gallery($p,$grid=false,$collection=false){
    static $first_image=true,$sequence=0;
    $rendered=0;
    $gallery=(array)aa_meta($p->ID,'gallery',[]);
    if(!$gallery && get_post_thumbnail_id($p))$gallery=[['id'=>get_post_thumbnail_id($p),'alt'=>$p->post_title,'caption'=>'']];
    foreach($gallery as $i=>$item){
        $id=absint($item['id']??0);$full=wp_get_attachment_image_src($id,'full');if(!$full)continue;
        $alt=($item['alt']??'')?:get_post_meta($id,'_wp_attachment_image_alt',true)?:$p->post_title;
        $caption=($item['caption']??'')?:($grid?aa_meta($p->ID,'summary'):'');
        echo '<figure class="detail-shot'.($grid?' cw-card':'').'" data-id="'.(int)$p->ID.'" data-image-id="'.$id.'">';
        $collection_title=$collection?get_the_title(get_queried_object_id()):$p->post_title;
        $image_title=$grid?$p->post_title:$collection_title;
        echo '<a class="detail-shot-frame image-button" href="'.esc_url($full[0]).'" data-pswp-width="'.(int)$full[1].'" data-pswp-height="'.(int)$full[2].'" data-grid="'.($grid?'1':'0').'" data-title="'.esc_attr($image_title).'" data-description="'.esc_attr($caption).'" data-caption="'.esc_attr($image_title).'" aria-label="'.esc_attr('View '.$p->post_title.' image '.($i+1).' enlarged').'">';
        echo alexis_image($id,'aa_large',['alt'=>$alt,'sizes'=>$grid?'(max-width: 600px) calc(100vw - 48px), (max-width: 880px) calc((100vw - 92px) / 2), 394px':'(max-width: 880px) calc(100vw - 48px), 832px','loading'=>$first_image?'eager':'lazy','fetchpriority'=>$first_image?'high':'auto']);
        $first_image=false;$rendered++;
        echo '<span class="detail-shot-hint">'.($grid?'View':'View original').'</span></a><figcaption>';
        $sequence++;
        $label=esc_html($image_title.(!$grid?' — '.str_pad((string)$sequence,2,'0',STR_PAD_LEFT):''));
        if($grid)echo '<h2 class="cw-card-title">';
        if($collection)echo '<a class="art-card" href="'.esc_url(get_permalink($p)).'" aria-label="'.esc_attr('Artwork details: '.$p->post_title).'">'.$label.'</a>';else echo $label;
        if($grid)echo '</h2>';
        if($caption)echo '<p class="cw-card-desc">'.esc_html($caption).'</p>';
        echo '</figcaption></figure>';
    }
    if(!$rendered)echo '<figure class="detail-shot" data-id="'.(int)$p->ID.'"><div class="image-placeholder">Image coming soon</div><figcaption><a class="art-card" href="'.esc_url(get_permalink($p)).'">'.esc_html($p->post_title).'</a></figcaption></figure>';
}
function alexis_recommendations($current=0){
    $collections=aa_collections();if(!$collections)return;
    echo '<section class="detail-recommend"><div class="recommend-head"><h2 class="recommend-title">More Work</h2><span class="recommend-sub">Selected collections</span></div><div class="recommend-grid">';
    foreach($collections as $c){echo '<a class="recommend-card'.($current===$c->ID?' is-current':'').'" href="'.esc_url(get_permalink($c)).'"'.($current===$c->ID?' aria-current="page"':'').'><div class="recommend-thumb">'.alexis_image(get_post_thumbnail_id($c),'aa_medium',['style'=>'object-position:'.aa_focus($c->ID),'sizes'=>'(max-width: 600px) calc(100vw - 78px), (max-width: 991px) 45vw, 300px','loading'=>'lazy']).'</div><div class="recommend-card-body"><div><h3>'.esc_html($c->post_title).'</h3><p>'.esc_html(aa_meta($c->ID,'detail_meta',aa_meta($c->ID,'age'))).'</p></div><span class="recommend-arrow">'.alexis_icon('arrow').'</span></div></a>';}
    echo '</div></section>';
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
