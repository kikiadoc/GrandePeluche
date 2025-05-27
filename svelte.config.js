// import adapter from '@sveltejs/adapter-auto';
import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(
			{
			      pages: 'build',
			      assets: 'build',
			      fallback: null,
      }						
		),
		paths: {
		      base: '/enjoyTest',
		},
		serviceWorker: {
			register: true,
   	},
		csp: {
			mode: 'hash',
			directives: {
        'default-src': [ 'none' ],
        'object-src': [ 'none' ],
        'base-uri': [ 'none' ],
        'form-action': [ 'none' ],
        'frame-src': [ 'none' ],
        'child-src': [ 'none' ],
        'manifest-src': [ 'self' ],
        'worker-src': [ 'self' ],
        'media-src': [ 'self', 'https://cdn.adhoc.click' ],
        'img-src': [ 'self', 'https://cdn.adhoc.click', 'data:', 'blob:' ],
        'font-src': [ 'self', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com' ],
        'script-src': [ 'self', 'https://cdn.adhoc.click' ],
        'style-src': [ 'self', 'unsafe-inline', 'https://cdn.adhoc.click', 'https://fonts.googleapis.com' ],
        'connect-src': [ 'self', 'https://api.adhoc.click', 'wss://api.adhoc.click', 'https://cdn.adhoc.click' ]
			}
		}
	}
};

export default config;
