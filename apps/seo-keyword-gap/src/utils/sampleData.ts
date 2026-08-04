import { parsePageHtml } from './parser';
import { PageMetadata, KeywordVolumeItem } from '../types';

export const SAMPLE_VOLUME_DATA: KeywordVolumeItem[] = [
  { keyword: 'b2b saas marketing agency', volume: 2400, cpc: 14.50, competition: 0.82 },
  { keyword: 'enterprise seo services', volume: 1900, cpc: 18.20, competition: 0.88 },
  { keyword: 'ppc campaign management', volume: 3600, cpc: 12.10, competition: 0.75 },
  { keyword: 'seo keyword clustering guide', volume: 1200, cpc: 4.80, competition: 0.45 },
  { keyword: 'b2b lead generation strategy', volume: 2900, cpc: 15.00, competition: 0.79 },
  { keyword: 'conversion rate optimization', volume: 5400, cpc: 16.50, competition: 0.84 },
  { keyword: 'local seo for dentists', volume: 880, cpc: 8.20, competition: 0.52 },
  { keyword: 'custom web development studio', volume: 1500, cpc: 9.40, competition: 0.61 }
];

export const SAMPLE_SEED_KEYWORDS = [
  'b2b saas marketing',
  'enterprise seo',
  'ppc management',
  'keyword clustering'
];

export function getSampleCompetitorRawHtmlPages(): { url: string; html: string }[] {
  return [
    {
      url: 'https://apexdigital.com/services/b2b-saas-marketing',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>B2B SaaS Marketing Agency | Scalable Growth Services</title>
          <meta name="description" content="Accelerate monthly recurring revenue with our specialized B2B SaaS marketing agency services. Data-driven acquisition, product-led growth, and pipeline generation." />
        </head>
        <body>
          <h1>B2B SaaS Marketing Agency Services</h1>
          <p>Apex Digital is a premier B2B SaaS marketing agency empowering high-growth software companies to scale ARR predictability. Our data-driven customer acquisition framework combines product-led growth, LinkedIn advertising, and inbound search demand.</p>
          <h2>Data-Driven B2B SaaS Demand Generation</h2>
          <p>We craft full-funnel SaaS marketing strategies designed to convert qualified decision makers into high-LTV subscribers. From demo request optimization to churn reduction analytics, our SaaS growth strategists deliver measureable ROI.</p>
          <h3>Core SaaS Marketing Capabilities</h3>
          <p>Our solutions include account-based marketing (ABM), paid search management, content marketing for SaaS, and conversion rate optimization (CRO).</p>
          <button>Request a Quote</button>
          <a href="/contact">Schedule a Consultation</a>
          <img src="saas.jpg" alt="B2B SaaS Marketing Agency Strategy Dashboard" />
        </body>
        </html>
      `
    },
    {
      url: 'https://apexdigital.com/services/enterprise-seo',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Enterprise SEO Services & Organic Growth Strategy | Apex Digital</title>
          <meta name="description" content="Scale complex enterprise websites with domain authority, technical auditing, and strategic keyword clustering enterprise SEO services." />
        </head>
        <body>
          <h1>Enterprise SEO Services for Industry Leaders</h1>
          <p>Our enterprise SEO services deliver organic market dominance for global brands managing 10,000+ indexed pages. We solve complex technical SEO architecture, internationalization (hreflang), and enterprise keyword targeting challenges.</p>
          <h2>Strategic Technical Audits & Keyword Clustering</h2>
          <p>Maximize organic traffic revenue with multi-million visit content strategies. Our enterprise SEO consulting team works directly with engineering and product teams to streamline site architecture and content velocity.</p>
          <a href="/pricing">Get a Quote for Enterprise SEO</a>
          <img src="seo.jpg" alt="Enterprise SEO Services organic rank growth analytics" />
        </body>
        </html>
      `
    },
    {
      url: 'https://apexdigital.com/services/ppc-campaign-management',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>PPC Campaign Management Services | Google & LinkedIn Ads</title>
          <meta name="description" content="Maximize return on ad spend with custom PPC campaign management services across Google Ads, LinkedIn Ads, and Meta." />
        </head>
        <body>
          <h1>PPC Campaign Management Services</h1>
          <p>Turn ad spend into profitable revenue pipeline with expert PPC campaign management services. We specialize in high-intent Google Search advertising, LinkedIn B2B targeting, and retargeting automation.</p>
          <h2>Performance Paid Search & Social Ads</h2>
          <p>Our PPC management specialists continuously optimize landing page conversions, quality scores, negative keyword lists, and bid strategies to lower customer acquisition costs.</p>
          <button>Free Trial Audit</button>
          <a href="/pricing">Get Started Now</a>
        </body>
        </html>
      `
    },
    {
      url: 'https://apexdigital.com/blog/b2b-saas-growth-strategies-2026',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>10 Proven B2B SaaS Growth Strategies for 2026 | Apex Insights</title>
          <meta name="description" content="In-depth guide detailing 10 actionable B2B SaaS growth strategies including product-led onboarding, pipeline velocity, and SEO topic clusters." />
        </head>
        <body>
          <h1>10 Proven B2B SaaS Growth Strategies for 2026</h1>
          <p>Scaling a modern software business requires moving beyond generic digital marketing tactics. In this comprehensive guide, we analyze 10 proven B2B SaaS growth strategies that top ARR brands rely on to achieve 3x customer expansion and sustainable acquisition efficiency.</p>
          <h2>1. Unlocking Product-Led Growth (PLG) Loops</h2>
          <p>Product-led growth turns your actual software experience into the primary driver of acquisition, retention, and referral. By lowering friction to initial value, SaaS brands can decrease payback periods dramatically.</p>
          <h2>2. Strategic Content & Keyword Clustering</h2>
          <p>Rather than chasing isolated high-volume keywords, build topic clusters surrounding core buyer intent topics. This establishes topical authority with Google and builds sustainable organic search leads.</p>
          <h2>3. Account-Based Marketing (ABM) Synergy</h2>
          <p>Align sales and marketing teams to target high-value enterprise accounts with personalized account-based campaigns. Combining programmatic LinkedIn Ads with direct SDR outreach yields 40% higher deal sizes.</p>
          <p>In conclusion, testing these B2B SaaS growth strategies with structured analytics ensures long-term compounding growth without excessive ad spend dependency.</p>
        </body>
        </html>
      `
    },
    {
      url: 'https://apexdigital.com/blog/seo-keyword-clustering-guide',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>The Complete SEO Keyword Clustering Guide | Step-by-Step Method</title>
          <meta name="description" content="Learn how to group search intent using our actionable SEO keyword clustering guide to build topical authority and dominate Google SERPs." />
        </head>
        <body>
          <h1>The Complete SEO Keyword Clustering Guide</h1>
          <p>Welcome to the definitive SEO keyword clustering guide for content marketers and SEO specialists. Keyword clustering is the process of grouping semantically related search terms together so a single authoritative page can target dozens of related queries simultaneously.</p>
          <h2>Why Keyword Clustering Replaces Single-Keyword Targeting</h2>
          <p>Modern search engines understand semantic relationships and context better than ever. Creating separate pages for minor keyword variations leads to keyword cannibalization and wasted domain authority. By implementing keyword clustering, your content hub can rank for hundreds of long-tail variations.</p>
          <h2>Step-by-Step Keyword Clustering Workflow</h2>
          <p>Step 1: Gather raw seed keyword exports from tools like Keywords Everywhere or Google Keyword Planner. Step 2: Group keywords by SERP similarity and user search intent. Step 3: Map primary keywords to core pillar pages and secondary keywords to supporting sub-headings.</p>
        </body>
        </html>
      `
    },
    {
      url: 'https://apexdigital.com/contact',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Contact Apex Digital Marketing Agency | Get in Touch</title>
          <meta name="description" content="Contact the team at Apex Digital to discuss your digital growth goals." />
        </head>
        <body>
          <h1>Contact Our Digital Agency Team</h1>
          <p>Have questions about our marketing services or ready to scale your pipeline? Reach out today.</p>
          <form><input type="text" placeholder="Your Name" /><button>Send Message</button></form>
        </body>
        </html>
      `
    }
  ];
}

export function getSampleOwnSiteRawHtmlPages(): { url: string; html: string }[] {
  return [
    {
      url: 'https://zenithwebstudio.com/services/ppc-management',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>PPC Campaign Management & Google Ads Services | Zenith Web Studio</title>
          <meta name="description" content="Zenith Web Studio offers custom PPC campaign management services to boost ROI and drive instant qualified traffic." />
        </head>
        <body>
          <h1>PPC Campaign Management & Paid Search Solutions</h1>
          <p>At Zenith Web Studio, our PPC campaign management team sets up high-converting Google Ads and paid media campaigns. We optimize bidding, ad copy, and landing page conversions to lower your cost per lead.</p>
          <h2>Custom PPC Campaign Optimization</h2>
          <p>We provide transparent monthly reporting, A/B ad testing, and keyword optimization to maximize your return on ad spend.</p>
          <a href="/contact">Book a Consultation</a>
        </body>
        </html>
      `
    },
    {
      url: 'https://zenithwebstudio.com/services/custom-web-development',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Custom Web Development & Web Design Studio | Zenith</title>
          <meta name="description" content="Tailored custom web development studio building fast, responsive React web apps and corporate websites." />
        </head>
        <body>
          <h1>Custom Web Development Studio & Web Design</h1>
          <p>Build a stunning digital presence with our custom web development studio team. We craft bespoke React applications, e-commerce storefronts, and responsive corporate websites engineered for performance.</p>
          <h2>Modern Tech Stack & UI/UX Design</h2>
          <p>From UI design to full-stack API integration, our developers deliver clean code and seamless user experiences.</p>
          <button>Get a Quote</button>
        </body>
        </html>
      `
    },
    {
      url: 'https://zenithwebstudio.com/blog/website-redesign-checklist',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>10-Step Website Redesign Checklist for Small Businesses</title>
          <meta name="description" content="Essential website redesign checklist covering UX, mobile responsiveness, and SEO preservation during site migrations." />
        </head>
        <body>
          <h1>10-Step Website Redesign Checklist for Businesses</h1>
          <p>Planning a website redesign can feel overwhelming without a clear blueprint. Follow our 10-step website redesign checklist to ensure your site relaunch improves conversion rates while preserving existing organic traffic rankings.</p>
          <h2>1. Audit Existing Site Analytics & Top Landing Pages</h2>
          <p>Before changing URLs or templates, identify your top-performing organic landing pages so 301 redirects are properly mapped.</p>
        </body>
        </html>
      `
    },
    {
      url: 'https://zenithwebstudio.com/about',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>About Zenith Web Studio | Our Web Team</title>
          <meta name="description" content="Learn about the Zenith Web Studio team." />
        </head>
        <body>
          <h1>About Zenith Web Studio</h1>
          <p>We are a boutique agency specializing in modern web design and paid campaign management.</p>
        </body>
        </html>
      `
    }
  ];
}
