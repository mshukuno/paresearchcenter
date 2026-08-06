/**
 *	Copyright (C) 2015-26 CERBER TECH INC., https://wpcerber.com
 */
jQuery( function( $ ) {

    window.crb_scan_id = 0;

    const CERBER_LDE = 10;
    const CERBER_UOP = 14;
    const CERBER_DIR = 26;
    const CERBER_MOD = 50;

    let crb_req_min_delay = 1000; // ms, throttling - making requests to the server not often than

    let crb_scan_mode = '';
    let crb_user_stop = false;
    let crb_scan_in_progress = false;

    let crb_response;
    let scanner_data;
    let all_issues = {};

    let crb_scan_requests = 0;
    let crb_server_errors = 0;

    let crb_scanner = $("#crb-scanner");
    let crb_scan_display = $("#crb-scan-display");
    let crb_scan_controls = $('#crb-scan-controls');
    let crb_file_controls = $('#crb-file-controls');
    let crb_scan_filter = $('#crb-scan-filter');

    let crb_scan_details = $('#crb-scan-details');
    let crb_scan_progress = $('#crb-scan-progress');
    let crb_scan_bar = crb_scan_progress.find('#the-scan-bar');

    let crb_scan_message = $("#crb-scan-message");
    let crb_scan_note = $("#crb-scan-note");
    let crb_scan_browser = $("#crb-browse-files > tbody");

    //let crb_txt_strings = [];
    let crb_the_file;
    let crb_row_id = 0; // For local parent -> child relationship

    let crb_all_sections = null;
    let crb_all_rows = null;

    if (crb_admin_page === 'cerber-integrity'
        && (crb_admin_tab === '' || crb_admin_tab === 'scan_main')) {

        cerber_scan_load_data();
    }

    crb_scan_controls.find(':button,a').on('click', function (event) {
        let operation = $(event.target).data('control');
        switch (operation) {
            case 'start_scan':
                cerber_scan_start($(event.target));
                break;
            case 'continue_scan':
                cerber_scan_continue();
                break;
            case 'stop_scan':
                crb_user_stop = true;
                crb_scan_in_progress = false;
                //cerber_scan_controls('stopped');
                //cerber_scan_controls('disabled');
                break;
            case 'delete_file':
            case 'ignore_add_file':
                cerber_scan_bulk_files(operation);
                break;
            case 'full-paths':
                cerber_toggle_file_name(event.target);
                break;
        }

        if (crb_scan_in_progress) {
            window.onbeforeunload = function () {
                return 'Scanning in progress';
            }
        }
        else {
            window.onbeforeunload = null;
        }

        event.preventDefault();
    });

    function crb_scan_reset() {
        all_issues = {};
        crb_server_errors = 0;

        crb_scan_display.find('[data-init]').each(function () {
            $(this).text($(this).data('init'));
        });

        crb_scan_filter.find('.crb-scan-flon').removeClass('crb-scan-flon');

        crb_scan_browser.find('tr').not('.crb-scan-container').remove();
    }

    function cerber_scan_start(object) {

        console.log('Start Scan');

        crb_scan_reset();

        crb_scan_mode = object.data('mode');
        crb_scan_requests = 0;
        crb_user_stop = false;

        crb_scan_message.slideDown().text(crb_scan_msg_steps[0]);
        crb_scan_note.hide();

        cerber_update_bar(true);
        cerber_scan_controls('scanning');
        cerber_scan_step('start_scan');
    }

    function cerber_scan_continue() {
        crb_scan_message.text('');
        cerber_scan_controls('scanning');
        cerber_scan_step();
    }

    function cerber_scan_step(operation) {
        console.log('Request ' + crb_scan_requests);

        if (!operation) {
            operation = 'continue_scan';
        }

        crb_scan_in_progress = true;
        crb_scan_requests++;

        cerber_rate_control.setState(0);
        setTimeout(function (state) {
            cerber_rate_control.setState(state);
        }, crb_req_min_delay, 1);

        $.post(ajaxurl, {
                action: 'cerber_scan_control',
                cerber_scan_do: operation,
                cerber_scan_mode: crb_scan_mode,
                ajax_nonce: crb_ajax_nonce
            },
            function (server_response) {
                cerber_scan_parse(server_response);
                cerber_scan_render(false);

                if (!crb_user_stop && crb_response.cerber_scan_do !== 'stop') {
                    cerber_scan_next_step();
                }
                else {
                    cerber_scan_ended(); // Scanning finished normally
                }

            }
        ).fail(function (jqXHR, textStatus, errorThrown) {
            console.error('Server error: ' + jqXHR.status);
            crb_server_errors++;
            if (crb_server_errors < 3) {
                cerber_scan_next_step();
            }
            else {
                cerber_scan_ended(true);
                alert('Process has been aborted due to a server error. Check your browser console for errors.');
            }
        });
    }

    // Continue to scan with rate control
    function cerber_scan_next_step() {
        if (cerber_rate_control.getState()) {
            cerber_scan_step();
        }
        else {
            setTimeout(cerber_scan_step, crb_req_min_delay);
        }
    }

    function cerber_scan_ended(aborted = false){
        window.onbeforeunload = null;
        crb_scan_in_progress = false;
        cerber_scan_controls('stopped');
        crb_scan_message.slideUp('slow');
        cerber_update_bar();
        if (scanner_data.aborted) {
            let msg = 'Scanning was aborted due to a server error. ';
            if (scanner_data.errors && scanner_data.errors.length) {
                msg = msg + scanner_data.errors[0];
            }
            alert(msg);
        }
        else if (!crb_user_stop) {
            if (!aborted) {
                cerber_scan_load_data(); // Refresh issues
            }

            cerber_popup_show(crb_scan_msg_misc.finished, '<p style="text-align: center;">' + crb_scan_msg_misc.finished_desc + '</p><p style="text-align: center;"><a href="https://wpcerber.com/wordpress-integrity-checker/" target="_blank">Scanner Documentation</a></p>');
        }
    }

    function cerber_scan_render(no_scroll) {

        if (!scanner_data.started) {
            return;
        }

        crb_all_rows = null;

        if (scanner_data.old) {
            alert(crb_scan_msg_misc.rerun_needed);
        }

        let smode = scanner_data.mode;

        if (scanner_data.cloud) {
            smode += ', Scheduled';
        }
        else {
            smode += ', Manual';
        }

        $("#crb-started").text(scanner_data.started);
        $("#crb-finished").text(scanner_data.finished);
        $("#crb-duration").text(scanner_data.duration);
        $("#crb-performance").text(scanner_data.performance);
        $("#crb-smode").text(smode);

        $.each(scanner_data.scan_ui, function (id, element_html) {
            let e = $('#' + id);
            if (e.length) {
                e.replaceWith(element_html);
            }
        });

        $("#crb-total-files").text(scanner_data.total.files);
        $("#crb-scanned-files").text(scanner_data.scanned.files);

        if ((typeof scanner_data.scan_stats !== 'undefined')) {
            $("#crb-critical").text(scanner_data.scan_stats.risk[3]);
            $("#crb-warning").text(scanner_data.scan_stats.total_issues);
        }

        if (!scanner_data.aborted && crb_scan_in_progress) {

            let progress = scanner_data.progress?.step || '';
            progress = progress ? ' - ' + progress + '%' : '';

            crb_scan_message.text((crb_scan_msg_steps[scanner_data.scan_stage] || '') + ' ' + progress);
        }

        if (crb_scan_message.text()) {
            crb_scan_message.show();
        }

        cerber_update_bar();

        // Displaying results

        let scan_sections = scanner_data.issues || scanner_data.step_issues;

        $.each(scan_sections, function (section_id, section_data) {

            let the_items = [];

            //let vul_list = section_data.sec_details?.vul_list;

            const section_name = section_data.name;
            const setype = section_data.setype;
            let version = section_data.sec_details.obj_version || '';

            let section_header_class = 'crb-scan-section';

            if (section_data.container) {
                section_header_class += ' section-' + section_data.container;
            }

            let section_items = [];

            let target_section = crb_scan_browser.find('#' + section_id);
            let parent_section_id  = (target_section.length ? target_section.data('row-id') : crb_row_id);

            let section_labels = '';
            let section_details = '';
            let section_top_issues = [];

            $.each(section_data.issues, function (index, single_issue) {

                const [issue_type_id, extra_issue = 0] = single_issue.ii ? single_issue.ii : [single_issue[0], single_issue[3] ?? 0];
                const ilist = single_issue.ii ? '[' + single_issue.ii.join(',') + ']' : '';
                const risk = single_issue[2];
                let label = '';
                let action_link = '';
                let action_link_html = '';

                if (crb_scan_top_issues.includes(issue_type_id)) {

                    // Section header -------------------------

                    section_top_issues.push(issue_type_id);

                    label = crb_scan_msg_labels[issue_type_id];

                    if ( label ) {
                        section_labels += '<span class="crb-it-' + issue_type_id + ' scan-ilabel">' + label + '</span>';
                    }

                    if (issue_type_id === 1) {
                        return;
                    }

                    let issue_info = single_issue.data?.msg_html ||
                        (single_issue.data?.msg ? crb_escape_string(single_issue.data.msg) :
                            crb_scan_msg_issues[issue_type_id] || 'Unknown issue');

                    if ([100, 101].includes(issue_type_id)) {
                        action_link = crb_create_link('#', 'Plugin Details',
                            {'css_class': 'crb-issue-link'},
                            {'itype': issue_type_id, 'plugin-slug': section_data.sec_details.plugin?.plugin_slug});
                    }

                    if ([5].includes(issue_type_id)) {
                        action_link = crb_create_link('#', crb_txt_strings['explain'][9],
                            {'css_class': 'crb-issue-link'},
                            {'itype': issue_type_id, 'section-name': section_name + ' v. ' + version});
                    }

                    action_link_html = action_link ? ' [ ' + action_link.outerHTML + ' ]' : '';

                    section_details += '<li class="crb-it-' + issue_type_id + '">' + issue_info + action_link_html + '</li>';

                }
                else {

                    // Single file issue ----------------

                    const file_name = single_issue[1];
                    const full_file_name = single_issue.data?.name ?? '';
                    let css_classes = full_file_name ? 'cursor-pointer' : '';
                    const isize = single_issue.data?.size ?? "";
                    const itime = single_issue.data?.time ?? "";

                    let rbox = (single_issue.data.fd_allowed ? '<input type="checkbox">' : '');
                    section_items.push('<tr class="crb-item-file" data-prid="' + parent_section_id + '" data-ilist="' + ilist + '" data-itype="' + issue_type_id + '" data-iextra="' + extra_issue + '" data-file_name="' + full_file_name + '"><td>&nbsp;' + rbox + '&nbsp;</td><td data-short="' + file_name + '" class="' + css_classes + '">' + file_name + '</td><td>' + cerber_get_issue_labels(index, single_issue) + '</td><td class="risk' + risk + '"><span>' + crb_scan_msg_risks[risk] + '</span></td><td>' + isize + '</td><td>' + itime + '</td></tr>');
                }

            });

            if (target_section.length) {
                // Add to the existing section
                target_section.after(section_items);
            }
            else {
                // Add a new section
                if (section_details) {
                    section_details = '<ul class="crb-scan-section-issues">' + section_details + '</ul>';
                }

                let section_header = '<tr id="' + section_id + '" class="' + section_header_class + '" data-row-id="' + crb_row_id + '" data-section-name="' + crb_escape_string(section_name) + '" data-setype="' + setype + '" data-top-section-issues="[' + section_top_issues.join(', ') + ']"><td></td><td colspan = 5><span>' + section_name + '</span>' + section_labels + section_details + '</td></tr>';

                section_items.unshift(section_header);
                $.merge(the_items, section_items);
                crb_row_id++;
            }

            if (the_items) {
                let container = null;
                if (this.container) {
                    container = crb_scan_browser.find('#' + this.container);
                }
                if (container && container.length) {
                    container.after(the_items);
                }
                else {
                    crb_scan_browser.append(the_items);
                }
            }


        });

        if (!crb_scan_in_progress) {
            cerber_file_controls();
        }

        /*
        @since 8.7.1
        if (!no_scroll) {
            crb_scan_details.animate({scrollTop: crb_scan_details.prop("scrollHeight")}, 500);
        }*/
    }

    function cerber_scan_parse(server_response) {
        crb_response = JSON.parse(server_response);
        if (!crb_response) {
            cerber_scan_ended(true);
            alert('Process has been aborted due to a server error. Check your browser console for errors.');
            return false;
        }

        scanner_data = crb_response.cerber_scanner;
        console.log('Step: ' + scanner_data.step + ', stage: ' + scanner_data.scan_stage);

        if (scanner_data.issues) {
            all_issues = scanner_data.issues;
        }
        else if (scanner_data.step_issues) {
            $.each(scanner_data.step_issues, function (section_id, value) {
                all_issues[section_id] = value;
            });
        }

        window.crb_scan_id = scanner_data.scan_id;

        //crb_txt_strings = crb_response.strings || [];
        //crb_txt_strings = crb_escape_object_properties(crb_txt_strings);

        if (scanner_data.errors && scanner_data.errors.length) {
            scanner_data.errors.forEach(function (item, index) {
                console.error('WP CERBER SCANNER: ' + item);
            });
        }
        if (crb_response.console_log && crb_response.console_log.length) {
            crb_response.console_log.forEach(function (item) {
                console.log('WP CERBER SCANNER: ' + item);
            });
        }
    }

    function cerber_scan_load_data() {
        crb_scan_browser.find('tr').not('.crb-scan-container').remove();

        $.post(ajaxurl, {
                action: 'cerber_scan_control',
                cerber_scan_do: 'get_last_scan',
                ajax_nonce: crb_ajax_nonce
            },
            function (server_response) {
                cerber_scan_parse(server_response);
                // Remove spinner
                uis_loader_remove(crb_scan_details);
                cerber_scan_render(true);
            }
        ).fail(function (jqXHR, textStatus, errorThrown) {
            console.error('WP CERBER SCANNER ERROR: Unable to get scanner data from server. Server error code: ' + jqXHR.status);
        });
    }

    function cerber_get_issue_labels(index, file_data) {
        if (typeof file_data.ii === "undefined") {
            return '';
        }

        let ret = '';
        let attr = '';
        let label = '';

        $.each(file_data.ii, function (id, issue_id) {
            attr = '';

            if (typeof file_data.dd !== "undefined"
                && typeof file_data.dd[issue_id] !== "undefined") {
                if (file_data.dd[issue_id].xdata && file_data.dd[issue_id].xdata.length) {
                    attr += ' data-idx="' + index + '"';
                }
            }

            label = crb_scan_msg_issues[issue_id];

            if (attr || (issue_id === CERBER_LDE || (issue_id > CERBER_UOP && issue_id < CERBER_MOD))) {
                label = '<a href="#" ' + attr + ' data-isd="' + issue_id + '">' + label + '</a>';
            }

            ret += label + '<br/>';
        });

        if (typeof file_data.data.prced !== "undefined") {
            ret += crb_scan_msg_issues[file_data.data.prced];
        }

        return ret;
    }

    // Enable/disable scan controls
    function cerber_scan_controls(state) {
        let stop = $('#crb-stop-scan');
        cerber_file_controls();
        switch (state) {
            case 'scanning':
                crb_scan_controls.find(':button').hide();
                stop.show();
                break;
            case 'stopped':
                crb_scan_controls.find(':button').show();
                stop.hide();
                if (scanner_data.finished) {
                    $('#crb-continue-scan').hide();
                }
                break;
            case 'disabled':
                crb_scan_controls.find(':button').prop( "disabled", true );
                break;
        }
    }

    // Enable/disable file controls
    function cerber_file_controls() {
        let b = crb_file_controls.find(':button');
        if (crb_scan_browser.find('input[type=checkbox]').length) {
            b.show();
        }
        else {
            b.hide();
        }

        let a = crb_scan_controls.find('a');
        if (crb_scan_browser.find('.crb-item-file').length) {
            a.show();
        }
        else {
            a.hide();
        }
    }

    function cerber_update_bar(show) {
        if (!crb_scan_in_progress) {
            if (!show) {
                crb_scan_progress.hide();
            }
            else {
                crb_scan_progress.show();
            }
            crb_scan_bar.width(0);
            return;
        }

        crb_scan_progress.show();
        crb_scan_progress.width('100%');

        let percentage = Number(scanner_data.progress?.entire_scan) || 0;

        crb_scan_bar.animate({width: percentage + '%'}, 1000);
    }

    // Rate limiting helper
    var cerber_rate_control = (function () {
        var state = 0;
        var obj = {};
        obj.setState = function (setnew) {
            state = setnew;
        };
        obj.getState = function() {
            return state;
        };
        return obj;
    }());

    function cerber_scan_bulk_files(operation) {
        var selected = crb_scan_browser.find('input[type=checkbox]:checked');
        if (!selected.length) {
            return;
        }
        if (!cerber_user_confirm(crb_scan_msg_misc[operation][0])) {
            return;
        }
        var files = [];
        $.each(selected, function () {
            files.push($(this).closest('tr').data('file_name'));
        });
        cerber_scan_ajax_operation(files, operation);
    }

    function cerber_scan_ajax_operation(files, operation) {
        if (!files.length) {
            return;
        }
        var formData = new FormData();
        formData.append('action', 'cerber_scan_bulk_files');
        formData.append('ajax_nonce', crb_ajax_nonce);
        formData.append('scan_id', window.crb_scan_id);
        formData.append('scan_file_operation', operation);
        if (files instanceof Array) {
            $.each(files, function (index, value) {
                formData.append('files[]', value);
            });
        }
        else {
            formData.append('files[]', files);
        }
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            dataType: 'json'
        }).done(function (server_response) {
            let msg = '', title = '';

            if (server_response.errors && server_response.errors.length) {
                title = crb_scan_msg_misc.file_error;
                msg = '<div style="color: #c91619;"><p><b>' + title + '</b></p><p>' + server_response.errors.join('</p><p>') + '</p></div>';
            }

            if (server_response.processed && server_response.processed.length) {
                msg = msg + '<div><p><b>' + crb_scan_msg_misc[operation][1] + '</b></p><p>' + server_response.processed.join('</p><p>') + '</p></div>';
            }

            if (!title) {
                title = crb_scan_msg_misc.all_ok;
            }

            if (server_response.processed && server_response.processed.length) {
                $.each(server_response.processed, function (index, file_name) {
                    //crb_scan_browser.find('td[data-file-name="' + file_name + '"]').parent().remove();
                    crb_scan_browser.find('tr[data-file_name="' + file_name + '"]').remove();
                });
            }

            cerber_popup_show(title, msg);

        }).fail(function (jqXHR, textStatus, errorThrown) {
            cerber_popup_show('Something went wrong on the server', jqXHR.responseText);
        });
    }

    function cerber_toggle_file_name(control) {
        window.cerber_name_toggler = (!window.cerber_name_toggler) ? 1 : 0;
        var full_name, td;
        if (window.cerber_name_toggler) {
            $('.crb-item-file').each(function () {
                full_name = $(this).data('file_name');
                $(this).find('td:nth-child(2)').text(full_name);
            });
        }
        else {
            $('.crb-item-file').each(function () {
                td = $(this).find('td:nth-child(2)');
                td.text($(td).data('short'));
            });
        }
    }


    // Filtering issues

    crb_scan_filter.on('click', 'span', function (event) {

        if (!$(this).hasClass('crb-scan-flon')) {
            return;
        }

        // Toggle visibility

        if ($(this).hasClass('crb-scan-filter-ed')) {
            crb_all_rows.not('.crb-scan-container').show();
            $(this).removeClass("crb-scan-filter-ed");
            return;
        }

        $(this).addClass( "crb-scan-filter-ed" );

        // -----------------

        if (crb_scan_in_progress || crb_all_rows === null) {
            crb_all_rows = crb_scan_browser.find('tr');
            crb_all_sections = crb_scan_browser.children('.crb-scan-section');
        }

        crb_all_rows.hide();

        // Single issues by issue type

        let show_issues = $(this).data('itype-list');
        if (show_issues && show_issues.length > 0) {

            $(show_issues).each(function (index, value) {

                // Show single file issues

                let filtered_rows = crb_all_rows.filter('.crb-item-file').filter(function (index, element) {
                    let ilist = $(element).data('ilist');
                    return !!ilist.includes(value);
                });

                filtered_rows.show();

                // Show section header if any top issue

                let filtered_sections = crb_all_sections.filter(function (index, element) {
                    let section_issues = $(element).data('top-section-issues');
                    return !!section_issues.includes(value);
                });

                filtered_sections.show();
            });

            // Show section header if a children became visible

            crb_all_sections.each(function () {
                let children = $(this).nextAll('.crb-item-file').filter(':visible').first();
                let next_section = $(this).nextAll('.crb-scan-section:first');
                if ((children.index() > 1)) {
                    if (children.index() < next_section.index()
                        || next_section.index() < 0) {

                        $(this).show();
                    }
                }
            });
        }

        // Entire sections by section type

        let show_sections = $(this).data('setype-list');
        if (show_sections && show_sections.length > 0) {
            $(show_sections).each(function (index, value) {
                let filtered_sections = crb_all_rows.filter('.crb-scan-section[data-setype=' + value + ']');
                filtered_sections.show();
                filtered_sections.each(function () {
                    // All rows in the section
                    $(this).nextAll('.crb-item-file[data-prid=' + $(this).data('row-id') + ']').show();
                });
            });
        }

    });

    // Pop-ups for the scan issues

    crb_scan_browser.on('click', 'a', function (event) {

        let itype = $(this).data('itype');
        let isd = $(this).data('isd');

        if (!itype && !isd) {
            return;
        }

        switch (itype) {
            case 5:
                $('#ref-section-name').text($(this).data('section-name'));
                crb_enable_ref_form();
                crb_upload_form_ul.children().hide();
                tb_show(crb_txt_strings['explain'][8], '#TB_inline?width=520&height=400&inlineId=crb-ref-upload-dialog');
                $('#TB_closeWindowButton').blur();
                break;
            case 100:
            case 101:
                let slug = $(this).data('plugin-slug');
                tb_show('Plugin Details', crb_admin_url + 'plugin-install.php?tab=plugin-information&plugin=' + slug + '&TB_iframe=true&width=772&height=562');
                $('#TB_closeWindowButton').blur();
                break;
            default:
                cerber_issue_popup(this);
        }

        event.preventDefault();
    });

    function cerber_issue_popup(element) {

        let info = [];
        let section = cerber_get_section(element);
        let section_type = section.data('setype');
        let itype = cerber_get_itype(element);
        crb_the_file = cerber_get_ifile(element);

        if (itype === CERBER_LDE || itype === 15 || itype === 18) {
            let section_name = section.data('section-name');
            cerber_popup_show($(element).text(), cerber_get_issue_explain(itype, section_name), true);
            return;
        }

        if (section_type === 20 && itype <= 25) {
            info.push('<p>' + crb_txt_strings['explain'][0] + '</p>');
        }

        // Some file inspection data?

        let d = cerber_xdata_info(section.prop('id'), element);
        if (d.length) {
            info.push(d);
        }

        if (section_type > 20) {
            info.push(cerber_get_issue_explain(itype));
        }

        cerber_popup_show($(element).text(), info, true);

    }

    function cerber_xdata_info(section_id, element) {

        let idx = $(element).data('idx');

        if (typeof idx === 'undefined') {
            return '';
        }

        let isd = $(element).data('isd');
        let xdata = [];
        let itype = 0;

        if (typeof isd !== 'undefined') {
            xdata = all_issues[section_id].issues[idx].dd[isd].xdata;
            itype = isd;
        }
        else {
            return '';
        }

        let tokens = [], regs = [], info = '', ls = [];

        $.each(xdata, function (index, e) {
            if (e[0] === 1) {
                tokens.push('<code>Line ' + e[2] + ': <b>' + e[1] + '</b></code><p>' + crb_txt_strings[e[0]][e[1]][1] + '</p>');
            }
            else {
                ls = [];
                $.each(e[2], function (index, s) {
                    ls.push('<code>Line ' + s[2] + ': <b>' + s[0] + '</b></code>');
                });
                regs.push(ls.join('<br />') + '<p>' + crb_txt_strings[e[0]][e[1]] + ' (' + e[1] + ')' + '</p>');
            }
        });

        if (tokens.length) {
            info += '<p><b> ' + crb_txt_strings['explain'][3] + '</b></p><div>' + tokens.join('</div><div>') + '</div>';
        }

        if (regs.length) {
            let title = (itype === CERBER_DIR) ? crb_txt_strings['explain'][5] : crb_txt_strings['explain'][4];

            info += '<p><b>' + title + '</b></p><div>' + regs.join('</div><div>') + '</div>';
        }

        return info;
    }

    // Our explainer for the admin

    function cerber_get_issue_explain(itype, subject) {

        subject = '<b>' + (subject || 'WordPress') + '</b>';
        let ret = [];

        switch (itype) {
            case CERBER_LDE: // New way
                let explainer = crb_txt_strings['explain_issue'][itype];
                ret = explainer[0].map(item => {
                    return item.replace('%s', subject);
                });
                if (typeof explainer[1] !== 'undefined') {
                    ret = ret.concat(explainer[1].map(i => {
                        return crb_txt_strings['explain'][i].replace('%s', subject);
                    }));
                }
                break;
            case 15:
                ret.push(crb_txt_strings['explain'][6]);
                ret.push(crb_txt_strings['explain'][7].replace('%s', subject));
                break;
            default:
                ret.push(crb_txt_strings['explain'][1]);
                ret.push(crb_txt_strings['explain'][2].replace('%s', subject));
                break;
        }

        return '<p>'+ ret.join('</p><p>') + '</p>'
    }

    function cerber_get_itype(element) {
        let ret = $(element).data('isd');
        if (ret !== "undefined") {
            return ret;
        }
    }

    function cerber_get_section(e) {
        return $(e).closest('tr').prevAll('.crb-scan-section:first');
    }

    function cerber_get_ifile(e) {
        return $(e).closest('tr').data('file_name');
    }

    /*
    function cerber_load_strings() {
        $.get(ajaxurl, {
                action: 'cerber_get_strings',
                ajax_nonce: crb_ajax_nonce,
            },
            function (server_response) {
                crb_scan_strings = $.parseJSON(server_response);
                if (!crb_scan_strings.complete) {
                    alert('Unable to load strings due to a server error.');
                }
            }).fail(function () {
            alert('Unable to load strings due to a server error.');
        });
    }*/

    // Uploader

    let crb_upload_form = $('#crb-ref-upload-dialog').find('form');
    let crb_upload_form_ul = crb_upload_form.find('ul');

    crb_upload_form.on('submit', function (event) {

        let formData = new FormData($(this)[0]);
        formData.append('action', 'cerber_ref_upload');
        formData.append('ajax_nonce', crb_ajax_nonce);

        crb_upload_form.find('input').prop('disabled', true);
        crb_upload_form.find('input').hide();
        crb_upload_form_ul.children().hide();
        crb_upload_form_ul.find('li:nth-child(1)').show();

        $.ajax({
            url: ajaxurl,
            type: 'POST',
            enctype: 'multipart/form-data',
            data: formData,
            contentType: false,
            processData: false,
            dataType: 'json'
        }).done(function (response) {
            if (!response.error) {
                crb_ref_step2(response);
            } else {
                crb_ref_done(response);
            }
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.error('AJAX upload failed:', {
                status: jqXHR.status,
                statusText: jqXHR.statusText,
                error: errorThrown,
                textStatus: textStatus,
                responseText: jqXHR.responseText
            });

            crb_ref_errors({
                textStatus: textStatus,
                errorThrown: errorThrown,
                status: jqXHR.status
            }, 'File upload error');

            crb_enable_ref_form();
        });

        event.preventDefault();
    });

    function crb_ref_step2(server_response) {
        crb_upload_form_ul.find('li:nth-child(2)').show();

        $.ajax({
            url: ajaxurl,
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'cerber_ref_upload',
                ajax_nonce: crb_ajax_nonce
            }
        }).done(crb_ref_done)
            .fail(function(jqXHR, textStatus, errorThrown) {
                console.error('Request failed:', {
                    status: jqXHR.status,
                    statusText: jqXHR.statusText,
                    error: errorThrown,
                    textStatus: textStatus
                });

                crb_ref_errors({
                    textStatus: textStatus,
                    errorThrown: errorThrown,
                    status: jqXHR.status
                }, 'File processing error');

                crb_enable_ref_form();
            });
    }

    function crb_ref_done(server_response) {
        crb_ref_errors(server_response, 'Process aborted');

        if (!server_response.error) {
            tb_remove();
        }

        crb_enable_ref_form();
    }

    function crb_ref_errors(response, prefix) {
        let message = '';

        if (response && response.error) {
            message = response.error;
        } else if (response && (response.textStatus || response.errorThrown)) {
            message = 'Request failed: ' + response.textStatus;
            if (response.errorThrown && response.errorThrown !== response.textStatus) {
                message += ' - ' + response.errorThrown;
            }
            if (response.status) {
                message += ' (HTTP ' + response.status + ')';
                if (response.status === 500) {
                    message += '<p style="color: #000;">A server-side error occurred. Open the “WP Cerber Software Errors” section on the Tools / Diagnostic tab to check for possible issues. If the section is missing or contains no relevant messages, check the server error log to identify the cause.</p>';
                }
            }
        } else if (response instanceof Error) {
            message = response.message || 'Unexpected error';
        } else {
            message = 'Unknown error';
        }

        if (prefix) {
            crb_upload_form_ul.append('<li style="color: #dd1320;">' + prefix + '</li>');
        }

        crb_upload_form_ul.append('<li style="color: #dd1320;">' + message + '</li>');
    }

    function crb_enable_ref_form() {
        crb_upload_form.find('input').prop('disabled', false);
        crb_upload_form.find('input').show();
        crb_upload_form.trigger('reset');
    }

    crb_upload_form.find('input').on('change', function () {
        crb_upload_form_ul.children().hide();
    });


    // File viewer

    crb_scan_browser.on('click', 'td', function (event) {

        let short = $(this).data('short');
        let file_name = $(this).closest('tr').data('file_name');

        if (typeof short === "undefined" || short === '' || !file_name?.length) {
            return;
        }

        let view_width = window.innerWidth * 0.8;
        let view_height = window.innerHeight * 0.8;

        tb_show("File: " + file_name, ajaxurl + '?action=cerber_view_file&ajax_nonce=' + crb_ajax_nonce + '&file=' + file_name + '&scan_id=' + window.crb_scan_id + '&sheight=' + view_height + '&width=' + view_width + '&height=' + view_height + '&TB_iframe=1');
        $('#TB_closeWindowButton').blur();

        event.preventDefault();
    });



    //

    function cerber_user_confirm(message) {
        return confirm(message);
    }

    // Simple popups based on WP thickbox

    function cerber_popup_show(title, message, b) {
        if (typeof message !== 'string'){
            message = message.filter(function (e) {
                return (e !== 'undefined' && e !== null && e !== '');
            });
            message = '<div>' + message.join('</div><div>') + '</div>';
        }

        let wmax = (window.innerWidth < 600) ? window.innerWidth * 0.9 : window.innerWidth * 0.5;
        let hmax = (window.innerHeight < 600) ? window.innerHeight * 0.9 : window.innerHeight * 0.5;

        w = 200 + message.length;
        h = 140 + Math.round(message.length / 2);
        w = (w < 400) ? 400 : w;
        h = (h < 170) ? 170 : h;
        w = (w > wmax) ? wmax : w;
        h = (h > hmax) ? hmax : h;

        let max = h - 70;

        let button = '<input type="button" value="OK" class="button button-primary">';

        if (b) {
            button += '<input type="button" id="add2ignore" value=" Add to ignore list " class="button button-secondary">';
        }

        let popup = cerber_init_popup('crb-popup-box');
        popup.html('<div class="crb-popup-inner" style="max-height: ' + max + 'px;">' + message + '</div>' +
            '<p class="crb-popup-controls">'
            + button
            + '</p>');
        $('#TB_window .crb-popup-inner').html('');
        //popup.find('input[type=button]').off('click');
        popup.find('input[type=button]').on('click', function (event) {
            //$(this).off('click');
            /*event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();*/
            cerber_popup_close(this);
        });

        tb_show(title, '#TB_inline?width=' + w + '&height=' + h + '&inlineId=crb-popup-box');
        $('#TB_closeWindowButton').blur();
    }

    function cerber_init_popup(id) {
        let body = $("body");
        let popup = body.find('#' + id);
        if (popup.length) {
            return popup;
        }
        body.append('<div id="' + id + '" style="display: none;"></div>');
        return body.find('#' + id);
    }

    function cerber_popup_close(element) {
        tb_remove();
        if (element.id === 'add2ignore') {
            cerber_scan_ajax_operation(crb_the_file, 'ignore_add_file');
        }
    }

});
