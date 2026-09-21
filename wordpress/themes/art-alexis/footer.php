</main><?php $s=function_exists('aa_settings')?aa_settings():['email'=>'','footer'=>'Arts by Alexis']; ?>
<footer class="<?php echo alexis_is_detail()?'detail-footer':'section site-footer'; ?>">
<?php if(!alexis_is_detail()): ?><div id="contact" class="content-container footer-container" tabindex="-1"><?php if($s['email']): ?><a class="contact" href="<?php echo esc_url('mailto:'.$s['email']); ?>"><h2>CONTACT</h2><?php echo alexis_icon('arrow'); ?></a><?php else: ?><div class="contact contact-pending"><h2>CONTACT</h2><?php echo alexis_icon('arrow'); ?></div><p class="contact-note">Contact details coming soon.</p><?php endif; ?></div><?php endif; ?>
<p class="footer-signature"><?php echo esc_html($s['footer']); ?></p></footer><?php wp_footer(); ?></body></html>
