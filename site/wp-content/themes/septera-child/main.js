jQuery(document).ready(function() {
	jQuery('.lp-block-title').each(function(i) {
		var link = jQuery(this).parent().siblings().attr('href');
        jQuery(this).wrap('<a class=lp-block-title id=title'+ i +' href='+ link +'>');
		jQuery('#title2 > h5').text('Latest News');
    });
	
	jQuery('.lp-block-text').each(function(j) {
		jQuery(this).attr('id', 'text'+j);
	});
	
	jQuery('#text0').text('Learn about the research we have conducted and commissioned to build evidence on policies and practices that promote safe and developmentally appropriate physical activity for children.');
	jQuery('#text1').text('With input from diverse stakeholders, we have identified important future research studies to promote and ensure healthy weight and healthy levels of physical activity for at-risk youth.');
	jQuery('#text2').text('See the latest news and events from the PARC team and the broader youth physical activity research field.');
	
});