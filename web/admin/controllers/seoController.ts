/**
 * SEO Controller
 * Handles SEO settings management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { adminRespond } from '../../respond';

// ============================================================================
// SEO Settings Management
// ============================================================================

export const listSEOSettings = async (req: TypedRequest, res: Response): Promise<void> => {
  // For now, show basic SEO settings interface
  // In a real implementation, this would load from a database
  const seoSettings = {
    siteName: 'Commercefull Store',
    siteDescription: 'Your complete e-commerce solution',
    defaultMetaTitle: 'Commercefull - Complete E-Commerce Platform',
    defaultMetaDescription:
      'Shop the best products with our comprehensive e-commerce platform featuring advanced product management, secure payments, and fast shipping.',
    defaultKeywords: 'ecommerce, online shopping, products, store',
    robotsTxt: 'User-agent: *\nAllow: /\n\nSitemap: https://Commercefull.com/sitemap.xml',
    googleAnalyticsId: '',
    facebookPixelId: '',
    twitterCardType: 'summary_large_image',
    ogImageUrl: '/images/og-default.jpg',
    structuredData: true,
    canonicalUrls: true,
    lastUpdated: new Date(),
  };

  adminRespond(req, res, 'marketing/seo/index', {
    pageName: 'SEO Settings',
    seoSettings,

    success: req.query.success || null,
  });
  
};

export const updateSEOSettings = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const {
      siteName,
      siteDescription,
      defaultMetaTitle,
      defaultMetaDescription,
      defaultKeywords,
      robotsTxt,
      googleAnalyticsId,
      facebookPixelId,
      twitterCardType,
      ogImageUrl,
      structuredData,
      canonicalUrls,
    } = body;

    // In a real implementation, this would save to database
    logger.info('SEO Settings Update', { siteName, siteDescription, defaultMetaTitle, defaultMetaDescription, defaultKeywords, robotsTxt, googleAnalyticsId, facebookPixelId, twitterCardType, ogImageUrl, structuredData: structuredData === 'true', canonicalUrls: canonicalUrls === 'true' });

    res.redirect('/hub/marketing/seo?success=SEO settings updated successfully');
  } catch (error: unknown) {
    logger.warn('Error:', error);

    adminRespond(req, res, 'marketing/seo/index', {
      pageName: 'SEO Settings',
      error: (error as Error).message || 'Failed to update SEO settings',
      formData: req.body as RequestBody,
    });
  }
};

export const generateRobotsTxt = async (req: TypedRequest, res: Response): Promise<void> => {
  // Generate robots.txt content
  const robotsTxt = `User-agent: *
Allow: /

# Block admin areas
Disallow: /hub/
Disallow: /admin/
Disallow: /api/

# Allow important pages
Allow: /products/
Allow: /categories/

Sitemap: https://Commercefull.com/sitemap.xml`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename="robots.txt"');
  res.send(robotsTxt);
  
};

export const generateSitemap = async (req: TypedRequest, res: Response): Promise<void> => {
  // Generate basic sitemap XML
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
  <loc>https://Commercefull.com/</loc>
  <lastmod>${new Date().toISOString()}</lastmod>
  <changefreq>daily</changefreq>
  <priority>1.0</priority>
</url>
<url>
  <loc>https://Commercefull.com/products</loc>
  <lastmod>${new Date().toISOString()}</lastmod>
  <changefreq>daily</changefreq>
  <priority>0.8</priority>
</url>
<url>
  <loc>https://Commercefull.com/categories</loc>
  <lastmod>${new Date().toISOString()}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.7</priority>
</url>
<url>
  <loc>https://Commercefull.com/about</loc>
  <lastmod>${new Date().toISOString()}</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.5</priority>
</url>
<url>
  <loc>https://Commercefull.com/contact</loc>
  <lastmod>${new Date().toISOString()}</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.5</priority>
</url>
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Content-Disposition', 'attachment; filename="sitemap.xml"');
  res.send(sitemapXml);
  
};
