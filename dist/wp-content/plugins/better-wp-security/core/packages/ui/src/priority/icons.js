import { SVG, Path } from '@wordpress/primitives';

function Low( props ) {
	return <SVG { ...props } viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<Path d="M9 10h6.125M9 13.556h3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
	</SVG>;
}

function Medium( props ) {
	return <SVG { ...props } viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<Path d="M8 8h8.75M8 11.555h6.125M8 15.111h3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
	</SVG>;
}

function High( props ) {
	return <SVG { ...props } viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<Path d="M5 6h13M5 10h10M5 14h7m-7 4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
	</SVG>;
}

export default function PriorityIcon( { priority, ...rest } ) {
	switch ( priority ) {
		case 'low':
			return <Low { ...rest } />;
		case 'medium':
			return <Medium { ...rest } />;
		case 'high':
			return <High { ...rest } />;
	}
}
