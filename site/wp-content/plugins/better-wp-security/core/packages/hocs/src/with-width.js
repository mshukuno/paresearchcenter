/**
 * WordPress dependencies
 */
import { Component, createRef } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/*
 * A simple HOC that provides facility for listening to container resizes.
 */
const withWidth = createHigherOrderComponent( ( WrappedComponent ) => {
	return class WithWidth extends Component {
		state = {
			width: 1280,
		};

		mounted = false;
		containerRef = createRef();
		resizeObserver = null;

		componentDidMount() {
			this.mounted = true;

			window.addEventListener( 'resize', this.onWindowResize );
			const collapseBtn = document.getElementById( 'collapse-button' );
			collapseBtn?.addEventListener( 'click', this.onWindowResize );

			// Prefer ResizeObserver when available
			if ( 'ResizeObserver' in window && this.containerRef.current ) {
				this.resizeObserver = new window.ResizeObserver( ( [ entry ] ) => {
					if ( ! this.mounted ) {
						return;
					}
					const width = Math.round( entry.contentRect.width );
					this.setState( { width } );
				} );
				this.resizeObserver.observe( this.containerRef.current );
			} else {
				this.onWindowResize();
			}
		}

		componentWillUnmount() {
			this.mounted = false;
			window.removeEventListener( 'resize', this.onWindowResize );
			const collapseBtn = document.getElementById( 'collapse-button' );
			collapseBtn?.removeEventListener( 'click', this.onWindowResize );
			this.resizeObserver?.disconnect();
		}

		onWindowResize = () => {
			if ( ! this.mounted || ! this.containerRef.current ) {
				return;
			}

			const width = this.containerRef.current.offsetWidth;
			this.setState( { width } );
		};

		render() {
			const { measureBeforeMount = false, className, style, ...rest } = this.props;
			if ( measureBeforeMount && ! this.mounted ) {
				return (
					<div className={ className } style={ style } ref={ this.containerRef } />
				);
			}

			return (
				<div ref={ this.containerRef } className={ className } style={ style }>
					<WrappedComponent { ...rest } width={ this.state.width + 20 } />
				</div>
			);
		}
	};
}, 'withWidth' );

export default withWidth;
