// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://zaakirio.github.io',
	base: '/RustyFile-Docs',
	integrations: [
		starlight({
			title: 'RustyFile',
			logo: {
				src: './src/assets/logo.png',
			},
			favicon: '/favicon.svg',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/zaakir/rustyfile' },
			],
			customCss: [
				'@fontsource/space-grotesk/400.css',
				'@fontsource/space-grotesk/500.css',
				'@fontsource/space-grotesk/600.css',
				'@fontsource/space-grotesk/700.css',
				'@fontsource/jetbrains-mono/400.css',
				'@fontsource/jetbrains-mono/600.css',
				'./src/styles/custom.css',
			],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ slug: 'getting-started/installation' },
						{ slug: 'getting-started/quick-start' },
						{ slug: 'getting-started/first-run' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ slug: 'guides/configuration' },
						{ slug: 'guides/authentication' },
						{ slug: 'guides/file-browsing' },
						{ slug: 'guides/uploading' },
						{ slug: 'guides/video-streaming' },
					],
				},
				{
					label: 'API Reference',
					items: [
						{ slug: 'api/overview' },
						{ slug: 'api/auth' },
						{ slug: 'api/filesystem' },
						{ slug: 'api/uploads' },
						{ slug: 'api/media' },
						{ slug: 'api/errors' },
					],
				},
				{
					label: 'Deployment',
					items: [
						{ slug: 'deployment/docker' },
						{ slug: 'deployment/reverse-proxy' },
						{ slug: 'deployment/production' },
					],
				},
				{
					label: 'Architecture',
					items: [
						{ slug: 'architecture/overview' },
						{ slug: 'architecture/backend' },
						{ slug: 'architecture/frontend' },
						{ slug: 'architecture/database' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ slug: 'reference/faq' },
						{ slug: 'reference/trade-offs' },
					],
				},
			],
		}),
	],
});
