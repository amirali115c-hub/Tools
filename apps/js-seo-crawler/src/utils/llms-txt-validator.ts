import {LlmsTxtValidation} from '../types/phase1';

export async function validateLlmsTxt(baseUrl: string): Promise<LlmsTxtValidation> {
  const url = new URL(baseUrl);
  const llmsTxtUrl = `${url.protocol}//${url.hostname}/llms.txt`;

  const result: LlmsTxtValidation = {
    exists: false,
    url: llmsTxtUrl,
    isValid: false,
    hasOrganization: false,
    hasDescription: false,
    hasPages: false,
    issues: [],
    suggestions: [],
  };

  try {
    // Try to fetch llms.txt via CORS proxy
    const proxies = [
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?',
    ];

    let content = '';

    for (const proxy of proxies) {
      try {
        const response = await fetch(proxy + encodeURIComponent(llmsTxtUrl), {
          signal: AbortSignal.timeout(10000),
        });
        if (response.ok) {
          content = await response.text();
          break;
        }
      } catch {
        continue;
      }
    }

    if (!content) {
      result.issues.push('llms.txt file not found at ' + llmsTxtUrl);
      result.suggestions.push('Create a llms.txt file at the root of your website');
      result.suggestions.push('Format: # Organization Name\\n\\n> Description\\n\\n## Pages\\n\\n- [Page Title](/path)');
      return result;
    }

    result.exists = true;
    result.content = content;

    // Validate structure
    const lines = content.split('\n');
    const hasTitle = lines.some((l) => l.trim() && !l.startsWith('#') && !l.startsWith('>') && !l.startsWith('-'));
    const hasDescription = lines.some((l) => l.startsWith('>'));
    const hasPages = lines.some((l) => l.includes('[') && l.includes(']('));

    result.hasOrganization = hasTitle;
    result.hasDescription = hasDescription;
    result.hasPages = hasPages;

    if (!hasTitle) {
      result.issues.push('Missing organization/project name');
      result.suggestions.push('Add your organization name as the first non-comment line');
    }

    if (!hasDescription) {
      result.issues.push('Missing description (use > prefix)');
      result.suggestions.push('Add a brief description using > prefix: > Your organization description');
    }

    if (!hasPages) {
      result.issues.push('No pages listed');
      result.suggestions.push('Add key pages using format: - [Page Title](/path)');
    }

    // Check for common sections
    const hasAbout = content.toLowerCase().includes('about');
    const hasContact = content.toLowerCase().includes('contact');
    const hasProducts = content.toLowerCase().includes('product') || content.toLowerCase().includes('service');

    if (!hasAbout) {
      result.suggestions.push('Consider adding an About section');
    }
    if (!hasContact) {
      result.suggestions.push('Consider adding contact information');
    }

    result.isValid = result.issues.length === 0;

  } catch {
    result.issues.push('Failed to fetch llms.txt');
    result.suggestions.push('Ensure your server returns the file with correct MIME type');
  }

  return result;
}

export function generateLlmsTxtTemplate(organizationName: string, pages: {title: string; url: string}[]): string {
  let content = `# ${organizationName}\n\n`;
  content += `> ${organizationName} provides tools and services for web development and SEO.\n\n`;
  content += `## Homepage\n\n`;
  content += `- [${organizationName}](/)\n\n`;

  if (pages.length > 0) {
    content += `## Key Pages\n\n`;
    for (const page of pages) {
      content += `- [${page.title}](${page.url})\n`;
    }
    content += '\n';
  }

  content += `## Contact\n\n`;
  content += `- Email: contact@example.com\n`;
  content += `- Website: https://example.com\n`;

  return content;
}
