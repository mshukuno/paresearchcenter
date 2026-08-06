//console.log("change-admin-email.js loaded");
//console.log(change_admin_email_data.nonce);

jQuery(document).ready(function() {
    var insertInputButton = "<br /><input type='submit' class='button button-primary' name='changeAdminEmailSubmit' id='changeAdminEmailSubmitButton' value='Test Email' /><br/><span style = 'font-size:75%;'>View the Change Admin Email plugin complete privacy policy <a href='#' id='privacyPolicyLink'>here</a>.</span>";
    jQuery(insertInputButton).insertAfter("#new-admin-email-description");



    jQuery("#changeAdminEmailSubmitButton").click(function(event){
        var insertThisNonce = "<input type='hidden' name='changeAdminEmailAction' value='changeEmail' /> <input type='hidden' name='change-admin-email-test-email-nonce' value='" + change_admin_email_data.nonce + "' />";
        jQuery(insertThisNonce).insertAfter("#new-admin-email-description");
        event.preventDefault();
        jQuery("#submit").click();
    });

    jQuery("#new-admin-email-description").text("This address is used for admin purposes.");

    // Create the modal HTML structure and hide it by default
    var modalHtml = `
        <div id="externalLinkModal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:1000; background-color:white; padding:20px; border:1px solid #ccc; box-shadow: 0 5px 15px rgba(0,0,0,.5);">
            <p>This will open a browser tab to another website, <strong>https://generalchicken.guru</strong>. If this is ok, click PROCEED, or click EXIT to quit.</p>
            <button id="proceedToExternalSite" class="button button-primary">PROCEED</button>
            <button id="exitModal" class="button">EXIT</button>
        </div>
        <div id="modalBackdrop" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background-color:rgba(0,0,0,0.5); z-index:999;"></div>
    `;
    jQuery('body').append(modalHtml);

    // Handle the click on the "here" link
    jQuery('#privacyPolicyLink').click(function(event) {
        event.preventDefault(); // Prevent the default behavior of the link

        // Show the modal and backdrop
        jQuery('#externalLinkModal').show();
        jQuery('#modalBackdrop').show();
    });

    // Handle the click on "PROCEED" button
    jQuery('#proceedToExternalSite').click(function() {
        window.open('https://generalchicken.guru/privacy-policy-2/', '_blank'); // Open the external site in a new tab
        jQuery('#externalLinkModal').hide(); // Hide the modal
        jQuery('#modalBackdrop').hide(); // Hide the backdrop
    });

    // Handle the click on "EXIT" button
    jQuery('#exitModal').click(function() {
        jQuery('#externalLinkModal').hide(); // Hide the modal
        jQuery('#modalBackdrop').hide(); // Hide the backdrop
    });
});
