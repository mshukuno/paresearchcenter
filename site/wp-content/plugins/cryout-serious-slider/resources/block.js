/**
 * Cryout Serious Slider Block JS
 *
 * All translatable strings, option choices, and defaults are supplied from PHP
 * by CRYOUT_SLIDER_BLOCK_PARAMS (fieldLabels, optionChoices, sliderDefaults).
 *
 */
/* globals: wp, CRYOUT_SLIDER_BLOCK_PARAMS */
( function () {
    'use strict';

    var el                = wp.element.createElement;
    var Fragment          = wp.element.Fragment;
    var registerBlockType = wp.blocks.registerBlockType;
    var useBlockProps     = wp.blockEditor.useBlockProps;
    var InspectorControls = wp.blockEditor.InspectorControls;
    var PanelBody         = wp.components.PanelBody;
    var SelectControl     = wp.components.SelectControl;
    var TextControl       = wp.components.TextControl;
    var ColorPicker       = wp.components.ColorPicker;
    var Spinner           = wp.components.Spinner;
    var Placeholder       = wp.components.Placeholder;
    var Button            = wp.components.Button;
    var useState          = wp.element.useState;
    var useEffect         = wp.element.useEffect;

    var P               = CRYOUT_SLIDER_BLOCK_PARAMS;
    var REST_BASE       = P.restUrl;
    var NONCE           = P.restNonce;
    var NO_OVERRIDE     = P.noOverride;     // '__default__'
    var ADMIN_URL       = P.adminUrl;
    var POSTTYPE        = P.posttype;
    var TAXONOMY        = P.taxonomy;
    var DEFCOLOR        = P.defaultcolor;
    var SLIDER_DEFAULTS = P.sliderDefaults; // from PHP $defaults
    var OPTION_CHOICES  = P.optionChoices;  // from PHP $option_choices
    var L               = P.fieldLabels;    // pre-translated labels

    // url helpers
    function urlCreateSlider() {
        return ADMIN_URL + 'edit-tags.php?taxonomy=' + TAXONOMY + '&post_type=' + POSTTYPE;
    }
    function urlEditSlides( slug ) {
        return ADMIN_URL + 'edit.php?post_type=' + POSTTYPE + '&' + TAXONOMY + '=' + encodeURIComponent( slug );
    }

    // build SelectControl options for a given option key, from OPTION_CHOICES[key].choices
    function getChoices( optionKey ) {
        var entry = OPTION_CHOICES[ optionKey ] || {};
        var raw = entry.choices || [];
        return raw.map( function( item ) {
            return { value: item.value, label: item.label };
        } );
    }

    // build a flat value -> label map for a given option key
    function buildLabelMap( optionKey ) {
        var entry = OPTION_CHOICES[ optionKey ] || {};
        var raw = entry.choices || [];
        var map = {};
        raw.forEach( function( item ) { map[ item.value ] = item.label; } );
        return map;
    }

    // get the field label for a given option key
    function fieldLabel( optionKey ) {
        var entry = OPTION_CHOICES[ optionKey ] || {};
        return entry.label || optionKey;
    }

    // prepend "Global: <current value>" to options
    function buildOptions( choices, sliderVal, labelMap ) {
        var displayVal = labelMap && labelMap[ sliderVal ] !== undefined
            ? labelMap[ sliderVal ]
            : String( sliderVal );
        return [ { label: L.globalPrefix + ': ' + displayVal, value: NO_OVERRIDE } ].concat( choices );
    }

    // color picker row
    function ColorRow( props ) {
        var openR = useState( false );
        var open = openR[0]; var setOpen = openR[1];
        var activeColor = ( props.value && props.value !== NO_OVERRIDE ) ? props.value : '';
        var isOverridden = !! activeColor;

        return el( 'div', { className: 'cryout-sblock-color-row' + ( isOverridden ? ' cryout-sblock-field-overridden' : '' ) },
            el( 'div', { className: 'cryout-sblock-color-row-header' },
                el( 'span', { className: 'cryout-sblock-field-label' }, props.label ),
                el( 'div', { className: 'cryout-sblock-color-row-controls' },
                    el( 'span', {
                        className: 'cryout-sblock-color-swatch',
                        style: { background: activeColor || props.sliderColor || DEFCOLOR },
                    } ),
                    el( Button, {
                        variant: 'tertiary', isSmall: true,
                        onClick: function() { setOpen( function( o ) { return ! o; } ); }
                    }, open ? L.close : ( activeColor || props.sliderColor || DEFCOLOR ) ),
                    isOverridden && el( Button, {
                        variant: 'tertiary', isSmall: true, isDestructive: true,
                        onClick: function() { props.onChange( NO_OVERRIDE ); setOpen( false ); }
                    }, L.reset )
                )
            ),
            open && el( ColorPicker, {
                color: activeColor || props.sliderColor || DEFCOLOR,
                onChange: function( c ) { props.onChange( c.hex || c ); },
                enableAlpha: false
            } )
        );
    }

    // select with override highlight
    function OverrideSelect( props ) {
        var isOverridden = props.value !== NO_OVERRIDE;
        var options = buildOptions( props.choices, props.sliderVal, props.labelMap );
        return el( 'div', { className: 'cryout-sblock-field-wrap' + ( isOverridden ? ' cryout-sblock-field-overridden' : '' ) },
            el( SelectControl, {
                label: props.label,
                value: isOverridden ? props.value : NO_OVERRIDE,
                options: options,
                onChange: props.onChange,
                __nextHasNoMarginBottom: true,
            } )
        );
    }

    // number input with override highlight
    function OverrideNumber( props ) {
        var isOverridden = props.value !== NO_OVERRIDE && props.value !== '';
        var displayVal   = isOverridden ? props.value : '';
        return el( 'div', { className: 'cryout-sblock-field-wrap' + ( isOverridden ? ' cryout-sblock-field-overridden' : '' ) },
            el( TextControl, {
                label: props.label,
                type: 'number',
                value: displayVal,
                placeholder: ( props.sliderVal !== undefined && props.sliderVal !== null )
                    ? String( props.sliderVal ) + ' (' + L.global + ')'
                    : L.sliderSetting,
                onChange: function( v ) { props.onChange( v ? String( v ) : NO_OVERRIDE ); },
                __nextHasNoMarginBottom: true,
            } )
        );
    }

    // slider preview with slide thumbnails
    function SliderPreview( props ) {
        var info   = props.info;
        if ( ! info ) return null;

        var thumbs = info.slides.map( function( slide, i ) {
            return el( 'div', { key: slide.id, className: 'cryout-sblock-thumb' },
                slide.thumb_url
                    ? el( 'img', { src: slide.thumb_url, alt: slide.title } )
                    : el( 'span', { className: 'dashicons dashicons-format-image cryout-sblock-no-thumb' } ),
                el( 'span', { className: 'cryout-sblock-thumb-label' },
                    el( 'span', { className: 'cryout-sblock-thumb-title' },
                        slide.title || ( L.slide + ' ' + ( i + 1 ) )
                    ),
                    el( 'a', {
                        href: ADMIN_URL + 'post.php?post=' + slide.id + '&action=edit',
                        target: '_blank',
                        rel: 'noreferrer',
                        className: 'cryout-sblock-slide-edit-link',
                        onClick: function( e ) { e.stopPropagation(); }
                    }, L.editSlide )
                )
            );
        } );

        var slideCount = info.slides.length;
        var slideLabel = slideCount === 1 ? L.slide : L.slides;

        return el( 'div', { className: 'cryout-sblock-preview-wrap' },
            el( 'div', { className: 'cryout-sblock-preview-header' },
                el( 'span', { className: 'dashicons dashicons-images-alt2' } ),
                el( 'strong', null, info.name ),
                el( 'span', { className: 'cryout-sblock-count' }, slideCount + ' ' + slideLabel ),
                el( Button, {
                    className: 'cryout-sblock-edit-slides-btn',
                    variant: 'secondary', isSmall: true,
                    href: urlEditSlides( info.slug ),
                    target: '_blank', rel: 'noreferrer'
                },
                    el( 'span', { className: 'dashicons dashicons-edit' } ),
                    ' ' + L.editSlides
                ),
                el( Button, {
                    className: 'cryout-sblock-edit-slides-btn',
                    variant: 'secondary', isSmall: true,
                    href: ADMIN_URL + 'edit-tags.php?action=edit&taxonomy=' + TAXONOMY + '&tag_ID=' + info.id + '&post_type=' + POSTTYPE,
                    target: '_blank', rel: 'noreferrer'
                },
                    el( 'span', { className: 'dashicons dashicons-admin-settings' } ),
                    ' ' + L.manageSlider
                )
            ),
            el( 'div', { className: 'cryout-sblock-thumb-grid' }, thumbs )
        );
    }

    // main block editor thingamabob
    function SeriousSliderBlock( props ) {
        var attr  = props.attributes;
        var setAt = props.setAttributes;

	/* fix drag support in editor */
	var blockEl = null;
	useEffect( function() {
		if ( ! blockEl ) return;
		var wrapper = blockEl.closest( '.wp-block' );
		if ( ! wrapper ) return;

		function preventDrag( e ) {
			e.preventDefault();
			e.stopPropagation();
		}

		wrapper.setAttribute( 'draggable', 'false' );
		wrapper.addEventListener( 'dragstart', preventDrag, true );

		return function() {
			wrapper.removeEventListener( 'dragstart', preventDrag, true );
		};
	}, [] );
	
	var blockProps = useBlockProps( {
		className: 'cryout-sblock-block',
		ref: function( el ) { blockEl = el; }, /* drag support */
		onDragStart: function( e ) { e.preventDefault(); e.stopPropagation(); },
		onMouseDown: function( e ) { e.stopPropagation(); },
	} );

        var slidersR    = useState( [] );    var sliders    = slidersR[0];    var setSliders    = slidersR[1];
        var sliderInfoR = useState( null );  var sliderInfo = sliderInfoR[0]; var setSliderInfo = sliderInfoR[1];
        var loadListR   = useState( true );  var loadList   = loadListR[0];   var setLoadList   = loadListR[1];
        var loadInfoR   = useState( false ); var loadInfo   = loadInfoR[0];   var setLoadInfo   = loadInfoR[1];
        var errorR      = useState( '' );    var error      = errorR[0];      var setError      = errorR[1];

        useEffect( function() {
            fetch( REST_BASE + '/sliders', { headers: { 'X-WP-Nonce': NONCE } } )
                .then( function( r ) { return r.json(); } )
                .then( function( d ) {
                    if ( Array.isArray( d ) ) setSliders( d );
                    else setError( L.restError );
                    setLoadList( false );
                } )
                .catch( function() { setError( L.apiError ); setLoadList( false ); } );
        }, [] );

        useEffect( function() {
            if ( ! attr.sliderId ) { setSliderInfo( null ); return; }
            setLoadInfo( true );
            fetch( REST_BASE + '/sliders/' + attr.sliderId, { headers: { 'X-WP-Nonce': NONCE } } )
                .then( function( r ) { return r.json(); } )
                .then( function( d ) { setSliderInfo( d ); setLoadInfo( false ); } )
                .catch( function() { setLoadInfo( false ); } );
        }, [ attr.sliderId ] );

        /*useEffect( function() {
            if ( ! attr.lock || ! attr.lock.move ) {
                setAt( { lock: { move: true, remove: false } } );
            }
        }, [] );*/

        function set( key ) {
            return function( val ) {
                var o = {};
                o[ key ] = ( val === null || val === undefined ) ? NO_OVERRIDE : String( val );
                setAt( o );
            };
        }

        /**
         * Get a slider-level option value, falling back to the PHP-supplied global default.
         */
        function get( optKey ) {
            if ( sliderInfo && sliderInfo.options && sliderInfo.options[ optKey ] !== undefined ) {
                return sliderInfo.options[ optKey ];
            }
            return SLIDER_DEFAULTS[ optKey ] !== undefined ? SLIDER_DEFAULTS[ optKey ] : '';
        }

        var overrideKeys = [
            'overrideSort','overrideSizing','overrideWidth','overrideHeight',
            'overrideResponsiveness','overrideHidetitles','overrideTheme',
            'overrideShadow','overrideOverlay','overrideTextsize','overrideAlign',
            'overrideCaptionWidth','overrideTextstyle','overrideAccent',
            'overrideAutoplay','overrideAnimation','overrideHover','overrideDelay',
            'overrideTransition','overrideCaptionanimation'
        ];

        var hasOverrides = overrideKeys.some( function( k ) {
            return attr[ k ] && attr[ k ] !== NO_OVERRIDE;
        } );

        function resetAll() {
            var r = {};
            overrideKeys.forEach( function( k ) { r[ k ] = NO_OVERRIDE; } );
            setAt( r );
        }

        var sliderOptions = [ { label: '\u2014 ' + L.selectSlider + ' \u2014', value: 0 } ].concat(
            sliders.map( function( s ) {
                return { label: s.name + ' (' + s.count + ' ' + L.slides + ')', value: s.id };
            } )
        );

        // panels
        var panelSlider = el( PanelBody, { title: L.panelSlider, initialOpen: true },
            loadList ? el( Spinner )
                : el( SelectControl, {
                    label: L.selectSlider,
                    value: attr.sliderId,
                    options: sliderOptions,
                    onChange: function( v ) {
                        var id = parseInt( v, 10 );
                        var ch = sliders.find( function( s ) { return s.id === id; } );
                        setAt( { sliderId: id, sliderName: ch ? ch.name : '' } );
                    }
                } ),
            el( 'div', { className: 'cryout-sblock-panel-actions' },
                el( Button, {
                    variant: 'tertiary', isSmall: true,
                    href: urlCreateSlider(),
                    target: '_blank', rel: 'noreferrer',
                    className: 'cryout-sblock-create-btn'
                },
                    el( 'span', { className: 'dashicons dashicons-plus-alt2' } ),
                    ' ' + L.createSlider
                )
            ),
            attr.sliderId > 0 && el( 'p', { className: 'cryout-sblock-sc-hint description' },
                L.shortcodeHint,
                el( 'br' ),
                el( 'code', null, '[serious-slider id="' + attr.sliderId + '"]' )
            ),
            el( 'div', { className: 'cryout-sblock-override-description' },
                el( 'p', null, L.overrideDesc )
            )
        );

		// options-derived panel fields
		function renderField( key ) {
			var entry = OPTION_CHOICES[ key ];
			var attrKey = 'override' + key.replace( /_([a-z])/g, function(m,c){ return c.toUpperCase(); } )
										   .replace( /^[a-z]/, function(c){ return c.toUpperCase(); } );
			var label = entry.label + ( entry.um ? ' (' + entry.um + ')' : '' );
			var commonProps = {
				key: key,
				label: label,
				value: attr[ attrKey ],
				onChange: set( attrKey ),
			};
			if ( entry.control === 'select' ) {
				return el( OverrideSelect, Object.assign( {}, commonProps, {
					sliderVal: get( key ), labelMap: buildLabelMap( key ), choices: getChoices( key )
				} ) );
			}
			if ( entry.control === 'number' ) {
				return el( OverrideNumber, Object.assign( {}, commonProps, { sliderVal: get( key ) } ) );
			}
			if ( entry.control === 'color' ) {
				return el( ColorRow, { key: key, label: label, value: attr[ attrKey ], sliderColor: get( key ), onChange: set( attrKey ) } );
			}
		}

		function fieldsForPanel( panelName ) {
			return Object.keys( OPTION_CHOICES )
				.filter( function( key ) { return OPTION_CHOICES[ key ].panel === panelName; } )
				.map( renderField );
		}
		
		var panelGeneral    = el( PanelBody, { title: L.panelGeneral,    initialOpen: false }, fieldsForPanel( 'general' ) );
		var panelAppearance  = el( PanelBody, { title: L.panelAppearance, initialOpen: false }, fieldsForPanel( 'appearance' ) );
		var panelAnimation   = el( PanelBody, { title: L.panelAnimation,  initialOpen: false }, fieldsForPanel( 'animation' ) );

        // override indicator strip
        var overrideStrip = hasOverrides && el( 'div', { className: 'cryout-sblock-override-strip' },
            el( 'span', { className: 'cryout-sblock-override-indicator' },
                el( 'span', { className: 'dashicons dashicons-edit' } ),
                ' ' + L.optionsCustomized
            ),
            el( Button, {
                variant: 'tertiary', isSmall: true, isDestructive: true,
                onClick: resetAll
            }, L.resetAll )
        );

        // canvas
        var canvas;
        if ( error ) {
            canvas = el( 'div', { className: 'cryout-sblock-error' },
                el( 'span', { className: 'dashicons dashicons-warning' } ), ' ', error );
        } else if ( ! attr.sliderId ) {
            canvas = el( Placeholder, {
                icon: el( 'span', { className: 'dashicons dashicons-images-alt2' } ),
                label: L.blockTitle,
                instructions: L.selectPrompt,
            } );
        } else if ( loadInfo ) {
            canvas = el( 'div', { className: 'cryout-sblock-loading' },
                el( Spinner ), el( 'span', null, L.loadingPreview ) );
        } else {
            canvas = el( Fragment, null,
                el( SliderPreview, { info: sliderInfo } ),
                overrideStrip
            );
        }

        return el( Fragment, null,
            el( InspectorControls, null, panelSlider, panelGeneral, panelAppearance, panelAnimation ),
            el( 'div', blockProps, canvas )
        );
    }

    // block registration
    registerBlockType( 'cryout-serious-slider/slider', {
        title:       L.blockTitle,
        description: L.blockDescription,
        category:    'media',
        icon:        'images-alt2',
        keywords:    [ 'slider', 'carousel', 'serious slider', 'cryout', 'widget' ],
        attributes:  Object.keys(OPTION_CHOICES).reduce( function( attrs, key ) {
						var pascal = key.replace( /_([a-z])/g, function( m, c ) { return c.toUpperCase(); } )
										 .replace( /^[a-z]/, function( c ) { return c.toUpperCase(); } );
						attrs[ 'override' + pascal ] = { type: 'string', default: NO_OVERRIDE };
						return attrs;
					 }, { 
						sliderId: { type: 'integer', default: 0 }, 
						sliderName: { type: 'string', default: '' }, 
						/*lock: { type: 'object', default: { move: true, remove: false } }*/
					 } ),
        supports: { html: false, align: [ 'wide', 'full' ] },
        edit: SeriousSliderBlock,
        save: function() { return null; },
    } );

} )();

/* fin */
