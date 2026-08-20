import {SchemaType} from '../types';

interface SchemaBase {
  '@context': string;
  '@type': string;
}

function cv(value: string): string {
  return value.trim();
}

function cu(url: string): string | undefined {
  const cleaned = url.trim();
  if (!cleaned) return undefined;
  try {
    new URL(cleaned);
    return cleaned;
  } catch {
    return undefined;
  }
}

function pl(text: string): string[] {
  return text.split('\n').map((s) => s.trim()).filter(Boolean);
}

export function generateSchema(type: SchemaType, data: Record<string, string>): string {
  const generators: Record<SchemaType, (d: Record<string, string>) => SchemaBase> = {
    Organization: genOrganization,
    LocalBusiness: genLocalBusiness,
    WebPage: genWebPage,
    Article: genArticle,
    BlogPosting: genBlogPosting,
    Product: genProduct,
    Service: genService,
    FAQPage: genFAQ,
    HowTo: genHowTo,
    Event: genEvent,
    VideoObject: genVideo,
    SoftwareApplication: genSoftware,
    Person: genPerson,
    Recipe: genRecipe,
    MedicalBusiness: genMedical,
    BreadcrumbList: genBreadcrumb,
  };
  return JSON.stringify(generators[type](data), null, 2);
}

function genOrganization(d: Record<string, string>): SchemaBase {
  const s: Record<string, unknown> = {'@context': 'https://schema.org', '@type': 'Organization'};
  if (d.name) s.name = cv(d.name);
  if (d.url) s.url = cu(d.url);
  if (d.logo) s.logo = cu(d.logo);
  if (d.description) s.description = cv(d.description);
  if (d.email) s.email = cv(d.email);
  if (d.telephone) s.telephone = cv(d.telephone);
  if (d.address) s.address = {'@type': 'PostalAddress', streetAddress: cv(d.address)};
  const urls = pl(d.sameAs || '').map((u) => cu(u)).filter((u): u is string => !!u);
  if (urls.length > 0) s.sameAs = urls;
  return s as SchemaBase;
}

function genLocalBusiness(d: Record<string, string>): SchemaBase {
  const s: Record<string, unknown> = {'@context': 'https://schema.org', '@type': 'LocalBusiness'};
  if (d.name) s.name = cv(d.name);
  if (d.url) s.url = cu(d.url);
  if (d.logo) s.image = cu(d.logo);
  if (d.description) s.description = cv(d.description);
  if (d.telephone) s.telephone = cv(d.telephone);
  if (d.email) s.email = cv(d.email);
  if (d.openingHours) s.openingHours = cv(d.openingHours);
  if (d.priceRange) s.priceRange = cv(d.priceRange);
  if (d.address || d.addressLocality) {
    s.address = {
      '@type': 'PostalAddress',
      ...(d.address && {streetAddress: cv(d.address)}),
      ...(d.addressLocality && {addressLocality: cv(d.addressLocality)}),
      ...(d.addressRegion && {addressRegion: cv(d.addressRegion)}),
      ...(d.postalCode && {postalCode: cv(d.postalCode)}),
      addressCountry: 'US',
    };
  }
  return s as SchemaBase;
}

function genWebPage(d: Record<string, string>): SchemaBase {
  const s: Record<string, unknown> = {'@context': 'https://schema.org', '@type': 'WebPage'};
  if (d.name) s.name = cv(d.name);
  if (d.url) s.url = cu(d.url);
  if (d.description) s.description = cv(d.description);
  if (d.datePublished) s.datePublished = cv(d.datePublished);
  if (d.dateModified) s.dateModified = cv(d.dateModified);
  if (d.author) s.author = {'@type': 'Person', name: cv(d.author)};
  return s as SchemaBase;
}

function genArticle(d: Record<string, string>): SchemaBase {
  const s: Record<string, unknown> = {'@context': 'https://schema.org', '@type': 'Article'};
  if (d.headline) s.headline = cv(d.headline);
  if (d.url) s.url = cu(d.url);
  if (d.description) s.description = cv(d.description);
  if (d.image) s.image = cu(d.image);
  if (d.datePublished) s.datePublished = cv(d.datePublished);
  if (d.dateModified) s.dateModified = cv(d.dateModified);
  if (d.author) s.author = {'@type': 'Person', name: cv(d.author)};
  if (d.publisher) {
    s.publisher = {
      '@type': 'Organization',
      name: cv(d.publisher),
      ...(d.publisherLogo && {logo: {'@type': 'ImageObject', url: cu(d.publisherLogo)}}),
    };
  }
  return s as SchemaBase;
}

function genBlogPosting(d: Record<string, string>): SchemaBase {
  const s: Record<string, unknown> = genArticle(d);
  s['@type'] = 'BlogPosting';
  return s as SchemaBase;
}

function genProduct(d: Record<string, string>): SchemaBase {
  const s: Record<string, unknown> = {'@context': 'https://schema.org', '@type': 'Product'};
  if (d.name) s.name = cv(d.name);
  if (d.url) s.url = cu(d.url);
  if (d.description) s.description = cv(d.description);
  if (d.image) s.image = cu(d.image);
  if (d.brand) s.brand = {'@type': 'Brand', name: cv(d.brand)};
  if (d.availability) {
    s.offers = {
      '@type': 'Offer',
      ...(d.price && {price: cv(d.price)}),
      ...(d.priceCurrency && {priceCurrency: cv(d.priceCurrency)}),
      availability: `https://schema.org/${d.availability}`,
    };
  }
  if (d.ratingValue || d.reviewCount) {
    s.aggregateRating = {
      '@type': 'AggregateRating',
      ...(d.ratingValue && {ratingValue: cv(d.ratingValue)}),
      ...(d.reviewCount && {reviewCount: cv(d.reviewCount)}),
      bestRating: '5',
    };
  }
  return s as SchemaBase;
}

function genService(d: Record<string, string>): SchemaBase {
  const s: Record<string, unknown> = {'@context': 'https://schema.org', '@type': 'Service'};
  if (d.name) s.name = cv(d.name);
  if (d.url) s.url = cu(d.url);
  if (d.description) s.description = cv(d.description);
  if (d.provider) s.provider = {'@type': 'Organization', name: cv(d.provider)};
  if (d.areaServed) s.areaServed = cv(d.areaServed);
  if (d.price) {
    s.offers = {'@type': 'Offer', price: cv(d.price), ...(d.priceCurrency && {priceCurrency: cv(d.priceCurrency)})};
  }
  return s as SchemaBase;
}

function genFAQ(d: Record<string, string>): SchemaBase {
  const s: Record<string, unknown> = {'@context': 'https://schema.org', '@type': 'FAQPage'};
  let faqs: Array<{question: string; answer: string}> = [];
  try {
    faqs = JSON.parse(d['faqs'] || '[]');
  } catch {
    faqs = (d['faqs'] || '').split('\n').filter(Boolean).map((line) => {
      const [q, a] = line.split('|||').map((x) => x.trim());
      return {question: q || '', answer: a || ''};
    });
  }
  s.mainEntity = faqs.map((faq) => ({
    '@type': 'Question',
    name: cv(faq.question),
    acceptedAnswer: {'@type': 'Answer', text: cv(faq.answer)},
  }));
  return s as SchemaBase;
}

function genHowTo(d: Record<string, string>): SchemaBase {
  const s: Record<string, unknown> = {'@context': 'https://schema.org', '@type': 'HowTo'};
  if (d.name) s.name = cv(d.name);
  if (d.description) s.description = cv(d.description);
  if (d.image) s.image = cu(d.image);
  if (d.totalTime) s.totalTime = cv(d.totalTime);
  let steps: Array<{name: string; text: string}> = [];
  try {
    steps = JSON.parse(d['steps'] || '[]');
  } catch {
    steps = (d['steps'] || '').split('\n').filter(Boolean).map((line) => {
      const [n, t] = line.split('|||').map((x) => x.trim());
      return {name: n || '', text: t || ''};
    });
  }
  s.step = steps.map((step, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: cv(step.name),
    text: cv(step.text),
  }));
  return s as SchemaBase;
}

function genEvent(d: Record<string, string>): SchemaBase {
  const s: Record<string, unknown> = {'@context': 'https://schema.org', '@type': 'Event'};
  if (d.name) s.name = cv(d.name);
  if (d.url) s.url = cu(d.url);
  if (d.description) s.description = cv(d.description);
  if (d.startDate) s.startDate = cv(d.startDate);
  if (d.endDate) s.endDate = cv(d.endDate);
  if (d.location) s.location = {'@type': 'Place', name: cv(d.location)};
  if (d.organizer) s.organizer = {'@type': 'Organization', name: cv(d.organizer)};
  return s as SchemaBase;
}

function genVideo(d: Record<string, string>): SchemaBase {
  const s: Record<string, unknown> = {'@context': 'https://schema.org', '@type': 'VideoObject'};
  if (d.name) s.name = cv(d.name);
  if (d.description) s.description = cv(d.description);
  if (d.thumbnailUrl) s.thumbnailUrl = cu(d.thumbnailUrl);
  if (d.uploadDate) s.uploadDate = cv(d.uploadDate);
  if (d.duration) s.duration = cv(d.duration);
  if (d.contentUrl) s.contentUrl = cu(d.contentUrl);
  if (d.embedUrl) s.embedUrl = cu(d.embedUrl);
  return s as SchemaBase;
}

function genSoftware(d: Record<string, string>): SchemaBase {
  const s: Record<string, unknown> = {'@context': 'https://schema.org', '@type': 'SoftwareApplication'};
  if (d.name) s.name = cv(d.name);
  if (d.url) s.url = cu(d.url);
  if (d.description) s.description = cv(d.description);
  if (d.applicationCategory) s.applicationCategory = cv(d.applicationCategory);
  if (d.operatingSystem) s.operatingSystem = cv(d.operatingSystem);
  if (d.offers) {
    s.offers = {'@type': 'Offer', price: cv(d.offers), ...(d.offersCurrency && {priceCurrency: cv(d.offersCurrency)})};
  }
  if (d.author) s.author = {'@type': 'Organization', name: cv(d.author)};
  return s as SchemaBase;
}

function genPerson(d: Record<string, string>): SchemaBase {
  const s: Record<string, unknown> = {'@context': 'https://schema.org', '@type': 'Person'};
  if (d.name) s.name = cv(d.name);
  if (d.url) s.url = cu(d.url);
  if (d.jobTitle) s.jobTitle = cv(d.jobTitle);
  if (d.email) s.email = cv(d.email);
  if (d.image) s.image = cu(d.image);
  if (d.sameAs) s.sameAs = pl(d.sameAs).map((u) => cu(u)).filter((u): u is string => !!u);
  if (d.worksFor) s.worksFor = {'@type': 'Organization', name: cv(d.worksFor)};
  return s as SchemaBase;
}

function genRecipe(d: Record<string, string>): SchemaBase {
  const s: Record<string, unknown> = {'@context': 'https://schema.org', '@type': 'Recipe'};
  if (d.name) s.name = cv(d.name);
  if (d.description) s.description = cv(d.description);
  if (d.image) s.image = cu(d.image);
  if (d.prepTime) s.prepTime = cv(d.prepTime);
  if (d.cookTime) s.cookTime = cv(d.cookTime);
  if (d.recipeYield) s.recipeYield = cv(d.recipeYield);
  if (d.recipeIngredient) s.recipeIngredient = pl(d.recipeIngredient);
  if (d.recipeInstructions) {
    s.recipeInstructions = pl(d.recipeInstructions).map((text, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text: cv(text),
    }));
  }
  return s as SchemaBase;
}

function genMedical(d: Record<string, string>): SchemaBase {
  const s: Record<string, unknown> = {'@context': 'https://schema.org', '@type': 'MedicalBusiness'};
  if (d.name) s.name = cv(d.name);
  if (d.url) s.url = cu(d.url);
  if (d.logo) s.image = cu(d.logo);
  if (d.description) s.description = cv(d.description);
  if (d.telephone) s.telephone = cv(d.telephone);
  if (d.email) s.email = cv(d.email);
  if (d.address || d.addressLocality) {
    s.address = {
      '@type': 'PostalAddress',
      ...(d.address && {streetAddress: cv(d.address)}),
      ...(d.addressLocality && {addressLocality: cv(d.addressLocality)}),
      ...(d.addressRegion && {addressRegion: cv(d.addressRegion)}),
      ...(d.postalCode && {postalCode: cv(d.postalCode)}),
    };
  }
  return s as SchemaBase;
}

function genBreadcrumb(d: Record<string, string>): SchemaBase {
  const items = (d.items || '').split('\n').filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => {
      const [name, url] = item.split('|||').map((x) => x.trim());
      return {
        '@type': 'ListItem',
        position: i + 1,
        name: name || '',
        ...(url && {item: cu(url)}),
      };
    }),
  } as SchemaBase;
}
