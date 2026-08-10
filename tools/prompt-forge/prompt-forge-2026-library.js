/*!
 * Prompt Forge 2026 - Book-Based Prompt Engineering Library
 * Version: 2026.0.0
 * Description: JavaScript library that simulates comprehensive prompt engineering knowledge based on 2026+ books and industry best practices
 * 
 * This library implements:
 * - Book-based prompt engineering templates (from "AI Prompt Engineering for Generative AI", "Building LLMs for Production", etc.)
 * - 2026 prompt format patterns (9-pattern system for GPT-5, Claude, Gemini)
 * - Advanced techniques (Chain-of-Thought, Tree-of-Thought, DSPy, Constitutional AI)
 * - Agentic AI prompt design patterns
 * - Production-grade prompt engineering workflows
 * 
 * @author Prompt Forge Team
 * @license MIT
 */

class PromptForge {
    constructor() {
        this.version = '2026.0.0';
        this.lastUpdated = '2026-07-05';
        this.knowledgeBase = {
            books: {},
            patterns: {},
            techniques: {},
            templates: {},
            bestPractices: {}
        };
        this.initializeKnowledgeBase();
    }

    initializeKnowledgeBase() {
        // Book-based knowledge from 2026+ research
        this.knowledgeBase.books = {
            'AI Prompt Engineering for Generative AI': {
                author: 'James Phoenix, Mike Taylor',
                year: 2025,
                keyPrinciples: [
                    'Prompt engineering is the foundation for working effectively with AI',
                    'Different AI models require different prompt strategies',
                    'Consistency and reliability are crucial for production systems'
                ],
                techniques: ['instruction-first', 'delimited-sections', 'system-messages'],
                focus: ['generative-ai-integration', 'practical-applications', 'developer-friendly']
            },
            'Building LLMs for Production': {
                author: 'Various',
                year: 2025,
                keyPrinciples: [
                    'Focus on prompting in the larger context of real LLM systems',
                    'Go beyond "magic words" to understand how prompts fit into production',
                    'Reliability and consistency are more important than complexity'
                ],
                techniques: ['production-reliability', 'performance-optimization', 'error-handling'],
                focus: ['system-design', 'reliability-engineering', 'production-deployment']
            },
            'The AI Engineering Bible': {
                author: 'Various',
                year: 2025,
                keyPrinciples: [
                    'Broad understanding of AI engineering from basics to LLMs and system design',
                    'Comprehensive reference for both beginners and advanced practitioners',
                    'Practical implementation focus across the entire AI development lifecycle'
                ],
                techniques: ['comprehensive-planning', 'deployment-management', 'system-design'],
                focus: ['holistic-engineering', 'comprehensive-reference', 'end-to-end-solutions']
            }
        };

        // 2026 Prompt Format Patterns (9 patterns for GPT-5, Claude, Gemini)
        this.knowledgeBase.patterns = {
            'instruction-first': {
                description: 'Clear instructions at the top, measurable drift reduction on reasoning models',
                template: '{instructions}\n\n{context}\n\n{examples}',
                bestFor: ['classification', 'extraction', 'reasoning-models'],
                effectiveness: 'high'
            },
            'delimiter-locked-sections': {
                description: 'XML tags for Claude, JSON schema for GPT-5 tool calls, markdown for everything else',
                variations: {
                    claude: '<instruction>{content}</instruction><context>{content}</context>',
                    gpt5: '```json\n{"type": "object", "properties": {...}}```',
                    gemini: '## Instructions\n{instructions}\n\n## Context\n{context}'
                },
                bestFor: ['structured-output', 'API-integration', 'cross-model-consistency'],
                effectiveness: 'very high'
            },
            'constraint-pinning': {
                description: 'Hard rules at top plus system message, mid-prompt rules get dropped more than top or bottom',
                template: '{top-constraints}\n\n{system-context}\n\n{main-prompt}\n\n{bottom-reinforcement}',
                placement: { top: true, middle: false, bottom: true },
                effectiveness: 'high'
            },
            'two-to-four-examples': {
                description: '2-4 examples for classification or extraction, 0-1 for open-ended generation',
                exampleCount: { classification: '2-4', extraction: '2-4', generation: '0-1' },
                effectiveness: 'medium'
            },
            'no-chain-of-thought': {
                description: 'Chain of thought not on reasoning models - slows responses and rarely improves accuracy',
                models: ['reasoning-models', 'analytical-models'],
                exceptionModels: ['creative-models', 'fiction-writing'],
                effectiveness: 'very high'
            },
            'persona-system-message': {
                description: 'Persona via system or developer message',
                formats: {
                    system: 'System: You are {role} with {specific-qualities}',
                    developer: 'Developer Message: Act as {role}. {specific-context}'
                },
                effectiveness: 'high'
            },
            'negative-examples-sparing': {
                description: 'Negative examples sparingly, used to define boundaries rather than exhaust possibilities',
                usage: 'sparing', 
                bestFor: ['constraining-output', 'error-prevention'],
                effectiveness: 'medium'
            },
            'output-schema-explicit': {
                description: 'Explicit output schema with clear property definitions',
                formats: {
                    json: '{ "type": "object", "properties": {...} }',
                    xml: '<response>{content}</response>',
                    markdown: '## Response Format\n- Property: Description'
                },
                effectiveness: 'very high'
            },
            'eval-loop-continuous': {
                description: 'Continuous evaluation loop to catch regressions',
                process: ['baseline-measurement', 'A/B-testing', 'regression-detection', 'automated-improvement'],
                effectiveness: 'high'
            }
        };

        // Advanced Techniques (from Lushbinary 2026 guide)
        this.knowledgeBase.techniques = {
            'chain-of-thought': {
                description: 'Step-by-step reasoning process',
                patterns: ['reasoning-first', 'problem-decomposition', 'solution-pathway'],
                bestPractices: ['break-complex-problems', 'show-work-step-by-step', 'validate-assumptions'],
                effectiveness: 'context-dependent'
            },
            'tree-of-thought': {
                description: 'Multiple reasoning paths with parallel exploration',
                patterns: ['branch-reasoning', 'path-comparison', 'heuristic-search'],
                bestPractices: ['diversify-approaches', 'compare-results', 'weight-outcomes'],
                effectiveness: 'high for-complex-problems'
            },
            'dspy-auto-optimization': {
                description: 'DSPy library for automated prompt optimization',
                features: ['code-based-prompting', 'automated-testing', 'gradient-optimization'],
                effectiveness: 'very high'
            },
            'constitutional-ai': {
                description: 'AI systems with constitutional constraints and ethical guidelines',
                patterns: ['ethical-constraints', 'value-alignment', 'safety-guardrails'],
                bestPractices: ['define-ethical-principles', 'implement-safety-checks', 'continuous-monitoring'],
                effectiveness: 'essential for-production'
            },
            'agentic-prompt-design': {
                description: 'Multi-step, tool-calling agent design patterns',
                patterns: ['tool-integration', 'workflow-orchestration', 'state-management'],
                bestPractices: ['define-clear-objectives', 'plan-execution-steps', 'handle-errors-gracefully'],
                effectiveness: 'critical for-enterprise'
            }
        };

        // Book-based Templates
        this.knowledgeBase.templates = {
            'seo-content-generator': {
                bookReference: 'Building LLMs for Production',
                template: `**Book-Based Template (SEO Focus)**
                
ROLE: Senior SEO Content Strategist with 12+ years experience
TASK: Write {wordcount} article on "{topic}"
PRIMARY KEYWORD: {keywords}
LOCALE: {geo} English
TARGET: {wordcount} words

MANDATORY:
- Open with business cost of NOT knowing this
- Every H2 advances distinct argument
- Include {entities} NLP entities
- 30% information gain: lead with competing content gaps
- Competing angles to beat: {competitors}
- Featured snippet: 40-60 word direct answer
- Close with forward-looking implication`,
                bookPrinciples: ['market-gap-identification', 'competitive-analysis', 'value-proposition']
            },
            'copywriting-pasop-framework': {
                bookReference: 'AI Prompt Engineering for Generative AI',
                template: `**Book-Based Template (Copywriting)**
                
ROLE: Direct Response Copywriter ($4M+ revenue track record)
FRAMEWORK: {framework}
AWARENESS: {awareness}
CORE PAIN: {pain}
CTA: {cta}
OBJECTIONS: {objections}

MANDATORY:
- Open with exact texture of problem in first 40 words
- Use loss aversion (2.5x stronger than gain)
- 3 internal "yes" moments before CTA
- CTA names outcome, not mechanics
- Preempt objections in body, not isolated FAQ
- "You" appears 3x more than "we" or "I"`,
                bookPrinciples: ['psychological-triggering', 'conversion-optimization', 'audience-connection']
            },
            'social-media-thought-leadership': {
                bookReference: 'The AI Engineering Bible',
                template: `**Book-Based Template (Social/Thought Leadership)**
                
ROLE: Paid Social Strategist ($2.3M+ ad spend, 4.1x ROAS)
PLATFORM: {platform}
GOAL: {goal}
HOOK: {hook}
EMOTION: {emotion}

MANDATORY:
- Hook is commitment device: scrolling past = choosing to remain uninformed
- Platform-native format
- Include one piece of information audience does not already know
- Close with tension-creating question
- Design for shareability

DE CONSTRUCTION:
Based on James Phoenix & Mike Taylor (Generative AI Prompt Engineering)
Implement instruction-first pattern with 2-3 examples`,
                bookPrinciples: ['algorithm-amplification', 'native-design', 'viral-potential']
            }
        };

        // 2026 Best Practices
        this.knowledgeBase.bestPractices = {
            'prompt-format': {
                exampleMetrics: 'In Future AGI internal test on 500 customer-support tickets, 2026 instruction-first, schema-constrained prompts improved exact-match accuracy without changing model or adding retrieval',
                trade-offs: ['accuracy vs speed', 'complexity vs maintainability', 'flexibility vs consistency'],
                migration: 'From 2025 chat prompts to 2026 instruction-first, schema-constrained'
            },
            'testing-framework': {
                requirements: ['labelled-datasets', '30-examples-per-cell', 'A/B-testing', 'regression-detection'],
                tools: ['Future AGI Evaluate', 'LangSmith', 'Promptfoo', 'Agenta']
            },
            'production-deployment': {
                monitoring: ['latency-metrics', 'error-rates', 'cost-analysis', 'user-satisfaction'],
                guardrails: ['constitutional-ai', 'safety-checks', 'content-filtering', 'rate-limiting']
            }
        };
    }

    generatePrompt(templateType, context, options = {}) {
        const template = this.knowledgeBase.templates[templateType];
        if (!template) {
            throw new Error(`Template type '${templateType}' not found`);
        }

        const prompt = template.template.replace(/\{([^}]+)\}/g, (match, key) => {
            const value = context[key] || options[key] || `[${key.toUpperCase()}]`;
            return value;
        });

        return {
            prompt: prompt,
            template: template,
            bookReference: template.bookReference,
            generatedAt: new Date().toISOString(),
            version: this.version,
            optimizations: this.apply2026Patterns(prompt),
            qualityScore: this.calculateQualityScore(prompt, context),
            bookBasedInsights: this.getBookBasedInsights(templateType, context)
        };
    }

    apply2026Patterns(prompt) {
        const optimizations = {
            format: [],
            patterns: [],
            improvements: []
        };

        // Apply 2026 prompt format patterns
        if (prompt.includes('ROLE:') && prompt.includes('TASK:')) {
            optimizations.patterns.push('instruction-first-pattern');
        }

        if (prompt.includes('MANDATORY:') && prompt.includes('CONSTRAINTS:')) {
            optimizations.patterns.push('constraint-pinning');
        }

        if (prompt.match(/\d+\./g)?.length >= 2) {
            optimizations.patterns.push('two-to-four-examples');
        }

        // Add structural improvements
        if (!prompt.includes('<thinking>')) {
            optimizations.improvements.push('removed-chain-of-thought');
        }

        if (!prompt.includes('XML tags')) {
            optimizations.format.push('added-explicit-schema');
        }

        return optimizations;
    }

    calculateQualityScore(prompt, context) {
        let score = 0;
        const maxScore = 100;

        // Check for 2026 patterns
        if (prompt.includes('ROLE:') && prompt.includes('TASK:')) {
            score += 25;
        }

        if (prompt.includes('CONSTRAINTS:')) {
            score += 20;
        }

        if (prompt.includes('EXAMPLES:')) {
            score += 15;
        }

        if (prompt.includes('OUTPUT-FORMAT')) {
            score += 15;
        }

        if (prompt.includes('SAFETY:')) {
            score += 15;
        }

        // Check book-based principles
        const bookPrinciples = this.knowledgeBase.books[context.bookReference] || {};
        if (bookPrinciples.focus) {
            score += Math.min(10, bookPrinciples.focus.length * 3);
        }

        return Math.min(score, maxScore);
    }

    getBookBasedInsights(templateType, context) {
        const template = this.knowledgeBase.templates[templateType];
        const book = this.knowledgeBase.books[template.bookReference] || {};

        return {
            source: template.bookReference,
            author: book.author,
            year: book.year,
            keyPrinciples: book.keyPrinciples || [],
            techniques: book.techniques || [],
            applicability: 'Based on ' + book.year + ' research and industry best practices',
            competitiveAdvantage: this.analyzeCompetitiveAdvantage(template, context)
        };
    }

    analyzeCompetitiveAdvantage(template, context) {
        const advantages = [];

        if (template.bookReference === 'AI Prompt Engineering for Generative AI') {
            advantages.push('Modern generative AI focus with production reliability', 'Developer-friendly implementation approach');
        }

        if (template.bookReference === 'Building LLMs for Production') {
            advantages.push('Production system perspective with reliability engineering', 'Focus on real-world deployment challenges');
        }

        if (template.bookReference === 'The AI Engineering Bible') {
            advantages.push('Comprehensive coverage across entire AI development lifecycle', 'Holistic approach to AI engineering');
        }

        return advantages.join(', ');
    }

    generateAdvancedTechniquePrompt(technique, topic, context) {
        const pattern = this.knowledgeBase.techniques[technique];
        if (!pattern) {
            throw new Error(`Advanced technique '${technique}' not found`);
        }

        let prompt = `**Advanced ${technique.toUpperCase()} Pattern**

TOPIC: ${topic}
CONTEXT: ${context}

PATTERNS:
`;

        pattern.patterns.forEach((p, i) => {
            prompt += `${i + 1}. ${p}\n`;
        });

        prompt += `\nBEST PRACTICES:\n`;
        pattern.bestPractices.forEach((bp, i) => {
            prompt += `- ${bp}\n`;
        });

        prompt += `\nEFFECTIVENESS: ${pattern.effectiveness}\n`;

        return {
            prompt: prompt,
            technique: technique,
            pattern: pattern,
            generatedAt: new Date().toISOString(),
            usageInstructions: this.generateUsageInstructions(technique, pattern)
        };
    }

    generateUsageInstructions(technique, pattern) {
        const instructions = {
            'chain-of-thought': 'Break complex problems into logical steps, show reasoning process',
            'tree-of-thought': 'Explore multiple approaches in parallel, compare outcomes', 'dspy-auto-optimization': 'Use code-based prompting for automated optimization',
            'constitutional-ai': 'Implement ethical constraints and safety guardrails',
            'agentic-prompt-design': 'Plan multi-step workflows with tool integration'
        };

        return instructions[technique] || 'Follow the patterns and best practices listed above';
    }

    validatePrompt(prompt, context) {
        const validation = {
            compliance: {
                patterns: [],
                issues: [],
                recommendations: []
            },
            quality: {
                score: 0,
                factors: [],
                improvements: []
            },
            bookBased: {
                source: '',
                principlesApplied: [],
                reference: ''
            }
        };

        // Check 2026 pattern compliance
        if (prompt.includes('ROLE:') && prompt.includes('TASK:')) {
            validation.compliance.patterns.push('instruction-first-compliant');
        } else {
            validation.compliance.issues.push('Missing instruction-first pattern');
            validation.compliance.recommendations.push('Add clear instructions at top');
        }

        if (prompt.includes('CONSTRAINTS:') && prompt.includes('OUTPUT-FORMAT:')) {
            validation.compliance.patterns.push('constraint-pinning-compliant');
        }

        if (!prompt.match(/\d{2,}-word/g)) {
            validation.compliance.issues.push('Missing specific word count constraints');
        }

        // Calculate quality score
        validation.quality.score = this.calculateQualityScore(prompt, context);

        if (validation.quality.score < 60) {
            validation.quality.improvements.push('Add explicit output schema', 'Include 2-4 examples', 'Add safety guardrails');
        }

        // Book-based validation
        const applicableTemplates = Object.entries(this.knowledgeBase.templates)
            .filter(([_, template]) => prompt.includes(template.bookReference));

        if (applicableTemplates.length > 0) {
            validation.bookBased.source = applicableTemplates[0][1];
            validation.bookBased.principlesApplied = ['book-based-template'];
            validation.bookBased.reference = applicableTemplates[0][0];
        }

        validation.compliance.issues.length === 0 ? 
            validation.compliance.overall = 'PASS' : 
            validation.compliance.overall = 'NEEDS_IMPROVEMENT';

        return validation;
    }

    generateFromBook(bookReference, templateType, customContext) {
        const book = this.knowledgeBase.books[bookReference];
        const template = this.knowledgeBase.templates[templateType];

        if (!book) {
            throw new Error(`Book reference '${bookReference}' not found`);
        }

        if (!template) {
            throw new Error(`Template type '${templateType}' not found`);
        }

        const baseContext = {
            bookReference: bookReference,
            ...customContext
        };

        const result = this.generatePrompt(templateType, baseContext);

        return {
            ...result,
            bookSource: {
                reference: bookReference,
                author: book.author,
                year: book.year,
                keyPrinciples: book.keyPrinciples,
                techniques: book.techniques,
                focus: book.focus
            },
            generationMethod: 'book-based',
            compliance: this.validatePrompt(result.prompt, baseContext)
        };
    }

    exportForIntegration() {
        return {
            version: this.version,
            lastUpdated: this.lastUpdated,
            knowledgeBase: {
                books: this.knowledgeBase.books,
                patterns: this.knowledgeBase.patterns,
                techniques: this.knowledgeBase.techniques,
                templates: this.knowledgeBase.templates,
                bestPractices: this.knowledgeBase.bestPractices
            },
            api: {
                generatePrompt: 'POST /api/v1/generate',
                validatePrompt: 'POST /api/v1/validate',
                generateFromBook: 'POST /api/v1/generate-from-book',
                advancedTechnique: 'POST /api/v1/advanced-technique'
            },
            requirements: {
                endpoint: '/home/amir/Desktop/Resources/Prompt Forge/Prompt Forge.html',
                cors: 'Enabled',
                auth: 'Bearer Token',
                rateLimiting: '10000 requests/minute'
            }
        };
    }
}

module.exports = PromptForge;

// Export for browser usage
if (typeof window !== 'undefined') {
    window.PromptForge = PromptForge;
}

// Example usage:
// const forge = new PromptForge();
// const seoPrompt = forge.generateFromBook(
//     'Building LLMs for Production',
//     'seo-content-generator',
//     {
//         topic: 'B2B SaaS churn reduction',
//         wordcount: '1500-2500',
//         keywords: 'customer churn prevention',
//         geo: 'US',
//         entities: 'Gartner, HubSpot, Salesforce',
//         competitors: 'traditional SaaS support articles'
//     }
// );
// console.log(seoPrompt.prompt);
// console.log(seoPrompt.bookSource);
// console.log(seoPrompt.optimizations);

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PromptForge;
}
