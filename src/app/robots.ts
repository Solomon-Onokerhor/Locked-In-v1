import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin', '/onboarding', '/create-room', '/edit-room'],
            },
        ],
        sitemap: 'https://lockedinumat.tech/sitemap.xml',
    };
}
