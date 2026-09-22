<?php
defined('ABSPATH') || exit;
$p=get_queried_object();$is_collection=is_singular('aa_collection');
$c=$is_collection?$p:get_post((int)aa_meta($p->ID,'collection',0));
$return=$is_collection?home_url('/') : ($c?get_permalink($c):get_post_type_archive_link('aa_artwork'));
$meta=$is_collection?aa_meta($p->ID,'detail_meta',aa_meta($p->ID,'age')):($c?$c->post_title:'');
// Per-collection options; legacy fallback keeps old installations unchanged.
$display=function_exists('aa_collection_display')&&$c?aa_collection_display($c->ID):['layout'=>$c&&$c->post_name==='current-works'?'double':'single','navigation'=>$c&&$c->post_name==='current-works'?'on':'off'];
$grid=$is_collection && apply_filters('art_alexis_collection_grid',$display['layout']==='double',$p);
?>
<header class="detail-header"><div class="detail-header-inner"><div class="detail-title-block"><h1 class="detail-title"><?php echo esc_html($p->post_title); ?></h1><p class="detail-meta" <?php if($meta==='')echo 'aria-hidden="true"'; ?>><?php echo esc_html($meta); ?></p></div><a class="detail-close" <?php echo $is_collection?'data-back-home':'data-back-collection'; ?> href="<?php echo esc_url($return); ?>" aria-label="<?php echo $is_collection?'Close and return to home':'Close and return to collection'; ?>"><?php echo alexis_icon('close'); ?></a></div></header>
<section class="detail-body"><div class="detail-gallery-wrap">
<?php if(!$is_collection && aa_meta($p->ID,'summary'))echo '<p class="collection-summary">'.nl2br(esc_html(aa_meta($p->ID,'summary'))).'</p>'; ?>
<div id="art-gallery" data-navigation="<?php echo !$is_collection||$display['navigation']==='on'?'on':'off'; ?>">
<?php if($is_collection){
    $page=max(1,absint($_GET['works_page']??1));$q=aa_artworks($p->ID,$page);
    echo '<div class="detail-gallery'.($grid?' cw-grid':'').'" id="work-grid" data-page="'.$page.'" data-pages="'.(int)$q->max_num_pages.'">';
    foreach($q->posts as $art)alexis_detail_gallery($art,$grid,true);
    echo '</div><p id="list-status" class="end-list" role="status">'.($q->found_posts?'':'New artworks are on their way.').'</p>';
    if($page<$q->max_num_pages){echo '<a id="load-more" class="all-work" href="'.esc_url(add_query_arg('works_page',$page+1,get_permalink($p))).'">Load more artworks ↓</a>';}
}else{
    echo '<div class="detail-gallery">';alexis_detail_gallery($p);echo '</div>';
} ?>
</div></div></section>
<?php
if(!$is_collection && $c){
    $siblings=aa_artworks($c->ID,1,-1)->posts;$ids=wp_list_pluck($siblings,'ID');$pos=array_search($p->ID,$ids,true);
    echo '<nav class="detail-return" aria-label="Artwork navigation"><a data-back-collection href="'.esc_url(get_permalink($c)).'">← Back to '.esc_html($c->post_title).'</a><div class="sibling-links">';
    if($pos!==false && $pos>0)echo '<a href="'.esc_url(get_permalink($ids[$pos-1])).'">← Previous artwork</a>';
    if($pos!==false && isset($ids[$pos+1]))echo '<a href="'.esc_url(get_permalink($ids[$pos+1])).'">Next artwork →</a>';
    echo '</div></nav>';
}
alexis_recommendations($is_collection?$p->ID:0);
