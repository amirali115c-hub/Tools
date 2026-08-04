import {
  DiagnosticIssue,
  ParsedLine,
  ParsedRobots,
  ParserMode,
  Rule,
  RuleMatchCandidate,
  UrlTestResult,
  UserAgentGroup,
} from '../types';

export function parseRobotsTxt(rawText: string): ParsedRobots {
  const hasBOM = rawText.charCodeAt(0) === 0xfeff;
  const cleanText = hasBOM ? rawText.slice(1) : rawText;
  const byteSize = new TextEncoder().encode(rawText).length;

  const rawLines = cleanText.split(/\r?\n/);
  const parsedLines: ParsedLine[] = [];
  const groups: UserAgentGroup[] = [];
  const sitemaps: { url: string; lineNumber: number; isAbsolute: boolean }[] = [];
  const syntaxIssues: DiagnosticIssue[] = [];
  const orphanedDirectives: ParsedLine[] = [];

  if (hasBOM) {
    syntaxIssues.push({
      id: 'bom-detected',
      severity: 'syntax',
      title: 'UTF-8 Byte Order Mark (BOM) Detected',
      message: 'The file begins with a invisible UTF-8 BOM character (U+FEFF).',
      explanation:
        'A UTF-8 BOM at the top of robots.txt causes some web crawlers (including legacy crawlers) to fail parsing the very first directive or User-agent line.',
      lineNumber: 1,
    });
  }

  if (byteSize > 512000) {
    syntaxIssues.push({
      id: 'filesize-exceeded',
      severity: 'warning',
      title: 'File Size Exceeds Google Crawl Limit',
      message: `File size is ${(byteSize / 1024).toFixed(1)} KiB, exceeding the 500 KiB limit.`,
      explanation:
        'Googlebot and Bingbot truncate robots.txt files larger than 500 KiB (~512,000 bytes) and ignore any directives beyond that point.',
    });
  }

  let currentGroup: UserAgentGroup | null = null;
  let inGroupRules = false;
  let groupCounter = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const lineNumber = i + 1;
    const raw = rawLines[i];
    const trimmed = raw.trim();

    // Check comments
    let comment: string | undefined;
    let lineWithoutComment = trimmed;
    const commentIndex = trimmed.indexOf('#');
    if (commentIndex !== -1) {
      comment = trimmed.substring(commentIndex + 1).trim();
      lineWithoutComment = trimmed.substring(0, commentIndex).trim();
    }

    if (!lineWithoutComment) {
      parsedLines.push({
        lineNumber,
        raw,
        type: 'comment',
        comment,
      });
      continue;
    }

    const colonIndex = lineWithoutComment.indexOf(':');
    if (colonIndex === -1) {
      const issue: DiagnosticIssue = {
        id: `syntax-no-colon-${lineNumber}`,
        severity: 'syntax',
        title: 'Malformed Directive (Missing Colon)',
        message: `Line ${lineNumber} does not contain a colon ":" separator.`,
        explanation:
          'Robots.txt directives must follow the syntax "Directive: Value". Lines without colons are ignored by crawlers.',
        lineNumber,
      };
      syntaxIssues.push(issue);
      parsedLines.push({
        lineNumber,
        raw,
        type: 'unknown',
        warning: 'Missing colon separator',
      });
      continue;
    }

    const key = lineWithoutComment.substring(0, colonIndex).trim().toLowerCase();
    const rawValue = lineWithoutComment.substring(colonIndex + 1);
    const value = rawValue.trim();

    let type: ParsedLine['type'] = 'unknown';

    if (key === 'user-agent') {
      type = 'user-agent';
      const uaValue = value.toLowerCase();

      // Consecutive User-Agent lines belong to the same group unless rules have started
      if (!currentGroup || inGroupRules) {
        groupCounter++;
        currentGroup = {
          id: `group-${groupCounter}`,
          userAgents: [uaValue],
          userAgentLineNumbers: [lineNumber],
          rules: [],
        };
        groups.push(currentGroup);
        inGroupRules = false;
      } else {
        // Shared group with previous User-agent line
        currentGroup.userAgents.push(uaValue);
        currentGroup.userAgentLineNumbers.push(lineNumber);
      }
    } else if (key === 'allow' || key === 'disallow') {
      type = key;
      if (!currentGroup) {
        const lineItem: ParsedLine = {
          lineNumber,
          raw,
          type,
          key,
          value,
          warning: 'Orphaned rule before User-agent header',
        };
        orphanedDirectives.push(lineItem);
        syntaxIssues.push({
          id: `orphaned-${lineNumber}`,
          severity: 'syntax',
          title: 'Orphaned Directive',
          message: `The "${key}:" directive on line ${lineNumber} appears before any User-agent declaration.`,
          explanation:
            'Directives placed at the top of the file before any User-agent group are orphaned and will be ignored by crawlers.',
          lineNumber,
        });
      } else {
        inGroupRules = true;
        if (type === 'disallow' && value === '') {
          // Empty Disallow: means ALLOW ALL (reset)
          // We do not add a blocking rule
        } else if (value !== '') {
          // Check for spaces in value
          if (rawValue.startsWith(' ') || rawValue.endsWith(' ')) {
            syntaxIssues.push({
              id: `whitespace-path-${lineNumber}`,
              severity: 'syntax',
              title: 'Leading/Trailing Space in Path',
              message: `The ${key} path "${value}" on line ${lineNumber} has leading or trailing whitespace.`,
              explanation:
                'Some parsers treat spaces as literal characters in URLs, which can cause pattern matching to fail unexpectedly.',
              lineNumber,
            });
          }

          currentGroup.rules.push({
            type,
            pattern: value,
            lineNumber,
            raw,
          });
        }
      }
    } else if (key === 'sitemap') {
      type = 'sitemap';
      const isAbsolute = /^https?:\/\//i.test(value);
      sitemaps.push({
        url: value,
        lineNumber,
        isAbsolute,
      });

      if (!isAbsolute) {
        syntaxIssues.push({
          id: `sitemap-relative-${lineNumber}`,
          severity: 'warning',
          title: 'Relative Sitemap URL',
          message: `Sitemap URL "${value}" on line ${lineNumber} is relative, not absolute.`,
          explanation:
            'Per RFC 9309 and search engine standards, Sitemap directives must specify a complete, absolute URL (e.g. https://example.com/sitemap.xml).',
          lineNumber,
        });
      }
    } else if (key === 'crawl-delay') {
      type = 'crawl-delay';
      const num = parseFloat(value);
      if (!isNaN(num)) {
        if (currentGroup) {
          currentGroup.crawlDelay = num;
          currentGroup.crawlDelayLineNumber = lineNumber;
        }
      } else {
        syntaxIssues.push({
          id: `crawl-delay-invalid-${lineNumber}`,
          severity: 'syntax',
          title: 'Invalid Crawl-Delay Value',
          message: `Crawl-delay value "${value}" on line ${lineNumber} is not a valid number.`,
          explanation: 'Crawl-delay must be a numeric value representing seconds.',
          lineNumber,
        });
      }
    } else if (key === 'clean-param') {
      type = 'clean-param';
      if (currentGroup) {
        if (!currentGroup.cleanParams) currentGroup.cleanParams = [];
        currentGroup.cleanParams.push(value);
      }
    } else if (key === 'host') {
      type = 'host';
    } else {
      type = 'unknown';
      syntaxIssues.push({
        id: `unknown-directive-${lineNumber}`,
        severity: 'syntax',
        title: 'Unknown Directive',
        message: `Unrecognized directive "${key}" on line ${lineNumber}.`,
        explanation:
          'Crawlers ignore unknown directives. Common directives are User-agent, Allow, Disallow, Sitemap, and Crawl-delay.',
        lineNumber,
      });
    }

    parsedLines.push({
      lineNumber,
      raw,
      type,
      key,
      value,
      comment,
    });
  }

  return {
    rawText,
    hasBOM,
    byteSize,
    lines: parsedLines,
    groups,
    sitemaps,
    syntaxIssues,
    orphanedDirectives,
  };
}

/**
 * Selects the winning User-agent group for a given crawler user-agent name.
 */
export function findMatchingGroup(
  groups: UserAgentGroup[],
  targetUA: string
): { group: UserAgentGroup | null; matchedUA: string } {
  if (!groups || groups.length === 0) {
    return { group: null, matchedUA: '*' };
  }

  const cleanUA = targetUA.trim().toLowerCase();

  // 1. Look for exact or substring match in specific groups (non-wildcard)
  let bestGroup: UserAgentGroup | null = null;
  let bestMatchLength = -1;
  let bestMatchedUA = '*';

  for (const group of groups) {
    for (const ua of group.userAgents) {
      if (ua === '*') continue;

      // Exact match or UA contains/starts with rule UA
      if (cleanUA === ua || cleanUA.includes(ua) || ua.includes(cleanUA)) {
        if (ua.length > bestMatchLength) {
          bestMatchLength = ua.length;
          bestGroup = group;
          bestMatchedUA = ua;
        }
      }
    }
  }

  if (bestGroup) {
    return { group: bestGroup, matchedUA: bestMatchedUA };
  }

  // 2. Fall back to wildcard * group if exists
  for (const group of groups) {
    if (group.userAgents.includes('*')) {
      return { group, matchedUA: '*' };
    }
  }

  // 3. If no matching group found at all, permissive default
  return { group: null, matchedUA: '*' };
}

/**
 * Matches a robots.txt pattern against a path.
 * Returns match details including character length of matched pattern.
 */
export function matchPattern(
  pattern: string,
  path: string
): { matches: boolean; patternLength: number } {
  if (!pattern) {
    return { matches: false, patternLength: 0 };
  }

  // Build regex from robots.txt wildcard rule
  // Escape regex special chars EXCEPT '*' and '$'
  let regexString = '';
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === '*') {
      regexString += '.*';
    } else if (char === '$' && i === pattern.length - 1) {
      regexString += '$';
    } else {
      // Escape regex special characters
      regexString += char.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }
  }

  // If pattern does not end with $, it matches as prefix
  if (!regexString.startsWith('^')) {
    regexString = '^' + regexString;
  }

  try {
    const regex = new RegExp(regexString);
    const matches = regex.test(path);
    return {
      matches,
      patternLength: pattern.length,
    };
  } catch {
    // Fallback simple startsWith check if regex fails
    const matches = path.startsWith(pattern);
    return {
      matches,
      patternLength: pattern.length,
    };
  }
}

/**
 * Tests a URL/path against parsed robots.txt rules and explains the decision.
 */
export function testUrl(
  parsed: ParsedRobots,
  pathOrUrl: string,
  userAgent: string = 'Googlebot',
  mode: ParserMode = 'google'
): UrlTestResult {
  // Extract path from full URL if provided
  let path = pathOrUrl.trim();
  try {
    if (/^https?:\/\//i.test(path)) {
      const urlObj = new URL(path);
      path = urlObj.pathname + urlObj.search;
    }
  } catch {
    // Keep as is
  }

  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  const { group, matchedUA } = findMatchingGroup(parsed.groups, userAgent);

  if (!group || group.rules.length === 0) {
    return {
      urlOrPath: path,
      userAgent,
      matchedGroup: group,
      matchedGroupUA: matchedUA,
      status: 'allowed',
      winningRule: null,
      reason: `No specific or wildcard rule group applies to User-agent "${userAgent}". Access is allowed by default per RFC 9309 specification.`,
      candidates: [],
      parserMode: mode,
    };
  }

  const candidates: RuleMatchCandidate[] = [];

  for (const rule of group.rules) {
    const { matches, patternLength } = matchPattern(rule.pattern, path);
    candidates.push({
      rule,
      uaGroup: matchedUA,
      pattern: rule.pattern,
      patternLength,
      isMatch: matches,
      type: rule.type,
      reason: matches
        ? `Matched pattern "${rule.pattern}" (length ${patternLength})`
        : `Did not match pattern "${rule.pattern}"`,
      won: false,
    });
  }

  const matchingCandidates = candidates.filter((c) => c.isMatch);

  if (matchingCandidates.length === 0) {
    return {
      urlOrPath: path,
      userAgent,
      matchedGroup: group,
      matchedGroupUA: matchedUA,
      status: 'allowed',
      winningRule: null,
      reason: `No ${group.rules.length} rule(s) in group "User-agent: ${matchedUA}" matched path "${path}". Default behavior is ALLOWED.`,
      candidates,
      parserMode: mode,
    };
  }

  // Find winner based on mode
  let winner: RuleMatchCandidate | null = null;

  if (mode === 'google') {
    // Google-flavored mode:
    // 1. Longest matching pattern length wins
    // 2. On tie between Allow and Disallow of equal length, ALLOW wins!
    let maxLength = -1;
    for (const candidate of matchingCandidates) {
      if (candidate.patternLength > maxLength) {
        maxLength = candidate.patternLength;
      }
    }

    const longestCandidates = matchingCandidates.filter(
      (c) => c.patternLength === maxLength
    );

    const allowCandidate = longestCandidates.find((c) => c.type === 'allow');
    if (allowCandidate) {
      winner = allowCandidate;
    } else {
      winner = longestCandidates[0];
    }
  } else {
    // Strict RFC 9309 mode:
    // 1. Longest pattern length wins.
    // 2. If tie in length, the FIRST rule appearing in the file wins!
    let maxLength = -1;
    for (const candidate of matchingCandidates) {
      if (candidate.patternLength > maxLength) {
        maxLength = candidate.patternLength;
      }
    }

    const longestCandidates = matchingCandidates.filter(
      (c) => c.patternLength === maxLength
    );

    // Pick first appearing line among longest candidates
    longestCandidates.sort((a, b) => a.rule.lineNumber - b.rule.lineNumber);
    winner = longestCandidates[0];
  }

  if (winner) {
    winner.won = true;
  }

  const status = winner?.type === 'disallow' ? 'blocked' : 'allowed';

  // Construct explanation summary
  let reason = '';
  if (winner) {
    const isTie =
      matchingCandidates.filter((c) => c.patternLength === winner!.patternLength)
        .length > 1;

    if (status === 'blocked') {
      reason = `BLOCKED by line ${winner.rule.lineNumber} ("Disallow: ${
        winner.pattern
      }") because it had the longest matching pattern (${
        winner.patternLength
      } chars).`;
    } else {
      if (isTie && mode === 'google' && winner.type === 'allow') {
        reason = `ALLOWED by line ${winner.rule.lineNumber} ("Allow: ${
          winner.pattern
        }") because under Google's rule, Allow wins over Disallow on equal pattern length (${
          winner.patternLength
        } chars).`;
      } else {
        reason = `ALLOWED by line ${winner.rule.lineNumber} ("Allow: ${
          winner.pattern
        }") because it matched with pattern length ${winner.patternLength} chars.`;
      }
    }
  }

  return {
    urlOrPath: path,
    userAgent,
    matchedGroup: group,
    matchedGroupUA: matchedUA,
    status,
    winningRule: winner ? winner.rule : null,
    reason,
    candidates,
    parserMode: mode,
  };
}
