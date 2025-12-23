/**
 * SEO Controller
 * Handles SEO settings management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import { adminRespond } from 'web/respond';

// ============================================================================
// SEO Settings Management
// ============================================================================

export const listSEOSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    // For now, show basic SEO settings interface
    // In a real implementation, this would load from a database
    const seoSettings = {
      siteName: 'Commercefull Store',
      siteDescription: 'Your complete e-commerce solution',
      defaultMetaTitle: 'Commercefull - Complete E-Commerce Platform',
      defaultMetaDescription: 'Shop the best products with our comprehensive e-commerce platform featuring advanced product management, secure payments, and fast shipping.',
      defaultKeywords: 'ecommerce, online shopping, products, store',
      robotsTxt: 'User-agent: *\nAllow: /\n\nSitemap: https://commercefull.com/sitemap.xml',
      googleAnalyticsId: '',
      facebookPixelId: '',
      twitterCardType: 'summary_large_image',
      ogImageUrl: '/images/og-default.jpg',
      structuredData: true,
      canonicalUrls: true,
      lastUpdated: new Date()
    };

    adminRespond(req, res, 'marketing/seo/index', {
      pageName: 'SEO Settings',
      seoSettings,
      
      success: req.query.success || null
    });
  } catch (error: any) {
    logger.error('Error:', error);
    
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load SEO settings',
    });
  }
};

export const updateSEOSettings = async (req: Request, res: Response): Promise<void> => {
  try {
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
      canonicalUrls
    } = req.body;

    // In a real implementation, this would save to database
    console.log('SEO Settings Update:', {
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
      structuredData: structuredData === 'true',
      canonicalUrls: canonicalUrls === 'true'
    });

    res.redirect('/hub/marketing/seo?success=SEO settings updated successfully');
  } catch (error: any) {
    logger.error('Error:', error);
    

    adminRespond(req, res, 'marketing/seo/index', {
      pageName: 'SEO Settings',
      error: error.message || 'Failed to update SEO settings',
      formData: req.body,
    });
  }
};

export const generateRobotsTxt = async (req: Request, res: Response): Promise<void> => {
  try {
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

Sitemap: https://commercefull.com/sitemap.xml`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="robots.txt"');
    res.send(robotsTxt);
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ error: 'Failed to generate robots.txt' });
  }
};

export const generateSitemap = async (req: Request, res: Response): Promise<void> => {
  try {
    // Generate basic sitemap XML
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://commercefull.com/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://commercefull.com/products</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://commercefull.com/categories</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://commercefull.com/about</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://commercefull.com/contact</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename="sitemap.xml"');
    res.send(sitemapXml);
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
};
