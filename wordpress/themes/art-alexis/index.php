<?php
defined('ABSPATH') || exit;
get_header();
if(!function_exists('aa_settings')){echo '<section class="section-heading"><h1>Art Alexis</h1><p>Please activate the Art Alexis content plugin.</p></section>';get_footer();return;}
$s=aa_settings();
if(is_404()){
    alexis_heading('404','Page not found','This page is unavailable. Explore the public collections below.');echo '<a class="all-work" href="'.esc_url(get_post_type_archive_link('aa_artwork')).'">All collections ↗</a>';
}elseif(is_front_page()){
    ?><section class="hero"><canvas id="ambient-canvas" aria-hidden="true"></canvas><div class="hero-title"><h1><?php echo esc_html($s['brand']); ?></h1></div><div class="hero-aside"><p><?php echo esc_html($s['subtitle']); ?></p><a href="#about" aria-label="Explore the page">↓</a></div></section><section class="split" id="about"><div><p class="eyebrow">ART & STORIES</p><h2>ABOUT</h2></div><div><p><?php echo nl2br(esc_html($s['intro'])); ?></p><a class="text-link" href="<?php echo esc_url(alexis_about_url()); ?>">More about me ↗</a></div></section><section class="section-heading"><p class="eyebrow">Explore the collections</p><h2>WORK</h2></section><?php
    $collections=aa_collections(true);foreach($collections as $i=>$c)alexis_collection_card($c,$i);if(!$collections)echo '<p class="empty-state">New collections are on their way.</p>';
    echo '<a class="all-work" href="'.esc_url(get_post_type_archive_link('aa_artwork')).'">See more work <span aria-hidden="true">↗</span></a>';
}elseif(is_page('about')){
    alexis_heading('A little about me','ABOUT');echo '<section class="split"><div class="about-left">';
    if($s['photo'])echo alexis_image($s['photo'],'aa_large',['class'=>'about-photo']);else echo '<div class="about-mark">ART &<br>STORIES.</div>';
    echo '</div><div><p class="about-intro">'.nl2br(esc_html($s['about']?:$s['intro'])).'</p><a class="text-link" href="'.esc_url(get_post_type_archive_link('aa_artwork')).'">Explore my work ↗</a></div></section>';
}elseif(is_post_type_archive('aa_artwork')){
    alexis_heading('Art & stories','WORK','Explore my art through these collections.');$collections=aa_collections();foreach($collections as $i=>$c)alexis_collection_card($c,$i);if(!$collections)echo '<p class="empty-state">New collections are on their way.</p>';
}elseif(is_singular('aa_collection')){
    $c=get_queried_object();$page=max(1,absint($_GET['works_page']??1));$q=aa_artworks($c->ID,$page);
    alexis_heading('Collection',$c->post_title,aa_meta($c->ID,'age'));if(aa_meta($c->ID,'summary'))echo '<p class="collection-summary">'.nl2br(esc_html(aa_meta($c->ID,'summary'))).'</p>';
    echo '<section class="work-grid" id="work-grid" data-collection="'.(int)$c->ID.'" data-page="'.$page.'" data-pages="'.(int)$q->max_num_pages.'">';foreach($q->posts as $p)alexis_art_card($p);echo '</section><p id="list-status" class="end-list" role="status">'.($q->found_posts?'':'New artworks are on their way.').'</p>';
    if($page<$q->max_num_pages)echo '<a id="load-more" class="all-work" href="'.esc_url(add_query_arg('works_page',$page+1,get_permalink($c))).'">Load more artworks ↓</a>';
    echo '<a class="all-work" href="'.esc_url(get_post_type_archive_link('aa_artwork')).'">← All collections</a>';
}elseif(is_singular('aa_artwork')){
    $p=get_queried_object();$c=get_post((int)aa_meta($p->ID,'collection',0));$gallery=(array)aa_meta($p->ID,'gallery',[]);
    if(!$gallery&&get_post_thumbnail_id($p))$gallery=[['id'=>get_post_thumbnail_id($p),'caption'=>'','alt'=>$p->post_title]];
    ?><section class="detail-heading"><?php if($c): ?><a class="back" data-back-collection href="<?php echo esc_url(get_permalink($c)); ?>">← <?php echo esc_html($c->post_title); ?></a><?php endif; ?><div class="detail-info"><div><p class="eyebrow">ARTWORK</p><h1><?php echo esc_html($p->post_title); ?></h1></div><p><?php if($c)echo esc_html($c->post_title); if(aa_meta($p->ID,'summary'))echo '<br><br>'.nl2br(esc_html(aa_meta($p->ID,'summary'))); ?></p></div></section><div id="art-gallery"><?php
    foreach($gallery as $i=>$item){
        $id=absint($item['id']);$large=wp_get_attachment_image_src($id,'aa_full');$full=wp_get_attachment_image_src($id,'full');if(!$large||!$full)continue;
        $alt=($item['alt']??'')?:get_post_meta($id,'_wp_attachment_image_alt',true)?:$p->post_title;
        echo '<figure class="art-figure"><a class="image-button" href="'.esc_url($full[0]).'" data-pswp-width="'.(int)$full[1].'" data-pswp-height="'.(int)$full[2].'" aria-label="'.esc_attr('View '.$p->post_title.' image '.($i+1).' enlarged').'">'.alexis_image($id,'aa_full',['alt'=>$alt,'sizes'=>'(max-width: 767px) 100vw, 90vw','loading'=>$i===0?'eager':'lazy','fetchpriority'=>$i===0?'high':'auto']).'</a><figcaption><span>'.esc_html($item['caption']??'').'</span><span>Take a closer look ↗</span></figcaption></figure>';
    }
    echo '</div>';
    if($c){$siblings=aa_artworks($c->ID,1,-1)->posts;$ids=wp_list_pluck($siblings,'ID');$pos=array_search($p->ID,$ids,true);echo '<nav class="detail-return" aria-label="Artwork navigation"><a data-back-collection href="'.esc_url(get_permalink($c)).'">← Back to '.esc_html($c->post_title).'</a><div class="sibling-links">';if($pos!==false&&$pos>0)echo '<a href="'.esc_url(get_permalink($ids[$pos-1])).'">← Previous artwork</a>';if($pos!==false&&isset($ids[$pos+1]))echo '<a href="'.esc_url(get_permalink($ids[$pos+1])).'">Next artwork →</a>';echo '</div></nav>';}
}else{
    alexis_heading('Art & stories',get_the_title()?:'ALEXIS');while(have_posts()){the_post();echo '<div class="collection-summary">';the_content();echo '</div>';}
}
get_footer();
