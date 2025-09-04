import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
    CodeReviewRequestDto,
    SupportedLanguage,
} from './dto/code-review-request.dto';
import {
    CodeReviewResponseDto,
    ReviewIssue,
    ReviewSeverity,
    ReviewCategory,
} from './dto/code-review-response.dto';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly anthropic: Anthropic;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY is not configured');
        }

        this.anthropic = new Anthropic({
            apiKey,
        });
    }

    async reviewCode(
        request: CodeReviewRequestDto,
    ): Promise<CodeReviewResponseDto> {
        const startTime = Date.now();

        try {
            this.logger.log(
                `Starting code review for ${request.language} code`,
            );

            const prompt = this.buildPrompt(request);
            const response = await this.anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4000,
                temperature: 0.1,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            });

            const content = response.content[0];
            const text = content.type === 'text' ? content.text : '';
            const reviewResult = this.parseResponse(
                text,
                Date.now() - startTime,
            );

            this.logger.log(
                `Code review completed in ${reviewResult.reviewTime}ms`,
            );

            return reviewResult;
        } catch (error) {
            this.logger.error('Failed to perform code review', error);
            throw new Error('Failed to perform code review');
        }
    }

    private buildPrompt(request: CodeReviewRequestDto): string {
        const languageContext = this.getLanguageContext(request.language);

        return `You are a senior software engineer and code reviewer specializing in ${request.language}. 
Please perform a comprehensive code review of the following ${request.language} code.

${request.context ? `Context: ${request.context}` : ''}
${request.filePath ? `File: ${request.filePath}` : ''}

Code to review:
\`\`\`${request.language}
${request.code}
\`\`\`

${languageContext}

Please analyze the code and provide a detailed review in the following JSON format:
{
  "overallScore": 85,
  "summary": "Brief summary of the code quality and main findings",
  "issues": [
    {
      "line": 5,
      "column": 12,
      "severity": "medium",
      "category": "bug",
      "title": "Short issue title",
      "description": "Detailed description of the issue",
      "suggestion": "How to fix this issue",
      "suggestedCode": "Example code showing the fix"
    }
  ],
  "suggestions": ["General improvement suggestions"],
  "strengths": ["What the code does well"]
}

Focus on:
- Potential bugs and errors
- Security vulnerabilities
- Performance issues
- Code style and best practices
- Maintainability concerns
- Type safety issues (if applicable)

Be thorough but constructive. Provide specific line numbers and actionable suggestions.
Return only the JSON response, no additional text.`;
    }

    private getLanguageContext(language: SupportedLanguage): string {
        const contexts = {
            [SupportedLanguage.TYPESCRIPT]: `
Pay special attention to:
- Type safety and proper TypeScript usage
- Potential null/undefined issues
- Interface and type definitions
- Async/await patterns
- Import/export statements
- ESLint and Prettier compliance`,

            [SupportedLanguage.JAVASCRIPT]: `
Pay special attention to:
- Variable hoisting issues
- == vs === comparisons
- Async/await vs Promises
- Event handling
- DOM manipulation safety
- ES6+ features usage`,

            [SupportedLanguage.PYTHON]: `
Pay special attention to:
- PEP 8 compliance
- Exception handling
- Type hints usage
- Import statements
- List comprehensions vs loops
- Memory efficiency`,

            [SupportedLanguage.JAVA]: `
Pay special attention to:
- Exception handling
- Memory management
- Null pointer exceptions
- Thread safety
- Access modifiers
- SOLID principles`,

            [SupportedLanguage.CPP]: `
Pay special attention to:
- Memory leaks and ownership
- Buffer overflows
- Null pointer dereferences
- RAII principles
- Smart pointers usage
- Thread safety`,

            [SupportedLanguage.CSHARP]: `
Pay special attention to:
- Null reference exceptions
- IDisposable implementation
- Exception handling
- LINQ usage
- Async/await patterns
- Access modifiers`,

            [SupportedLanguage.GO]: `
Pay special attention to:
- Error handling patterns
- Goroutine usage
- Channel operations
- Defer statements
- Interface implementations
- Package structure`,

            [SupportedLanguage.RUST]: `
Pay special attention to:
- Ownership and borrowing
- Lifetime annotations
- Pattern matching
- Error handling with Result
- Memory safety
- Trait implementations`,
        };

        return contexts[language] || '';
    }

    private parseResponse(
        responseText: string,
        reviewTime: number,
    ): CodeReviewResponseDto {
        try {
            // Extract JSON from code blocks if present
            let jsonText = responseText.trim();

            // Remove markdown code block markers if present
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/^```json\s*/, '');
            }
            if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/^```\s*/, '');
            }
            if (jsonText.endsWith('```')) {
                jsonText = jsonText.replace(/\s*```$/, '');
            }

            const parsed = JSON.parse(jsonText) as Record<string, unknown>;

            // Validate and sanitize the response
            return {
                overallScore: Math.max(
                    0,
                    Math.min(100, Number(parsed.overallScore) || 0),
                ),
                summary:
                    typeof parsed.summary === 'string'
                        ? parsed.summary
                        : 'No summary provided',
                issues: this.validateIssues(
                    Array.isArray(parsed.issues) ? parsed.issues : [],
                ),
                suggestions: Array.isArray(parsed.suggestions)
                    ? parsed.suggestions.map(String)
                    : [],
                strengths: Array.isArray(parsed.strengths)
                    ? parsed.strengths.map(String)
                    : [],
                reviewTime,
            };
        } catch (error) {
            this.logger.error('Failed to parse AI response', error);

            // Return a fallback response
            return {
                overallScore: 50,
                summary:
                    'Unable to parse AI response. Manual review may be needed.',
                issues: [],
                suggestions: ['Consider manual code review'],
                strengths: [],
                reviewTime,
            };
        }
    }

    private validateIssues(issues: unknown[]): ReviewIssue[] {
        return issues
            .filter((issue): issue is Record<string, unknown> => {
                return (
                    issue !== null &&
                    typeof issue === 'object' &&
                    !Array.isArray(issue)
                );
            })
            .map((issue) => ({
                line: Math.max(1, parseInt(String(issue.line)) || 1),
                column:
                    typeof issue.column === 'string' ||
                    typeof issue.column === 'number'
                        ? Math.max(1, parseInt(String(issue.column)))
                        : undefined,
                severity: this.validateSeverity(
                    typeof issue.severity === 'string' ? issue.severity : '',
                ),
                category: this.validateCategory(
                    typeof issue.category === 'string' ? issue.category : '',
                ),
                title:
                    typeof issue.title === 'string'
                        ? issue.title
                        : 'Issue detected',
                description:
                    typeof issue.description === 'string'
                        ? issue.description
                        : 'No description provided',
                suggestion:
                    typeof issue.suggestion === 'string'
                        ? issue.suggestion
                        : undefined,
                suggestedCode:
                    typeof issue.suggestedCode === 'string'
                        ? issue.suggestedCode
                        : undefined,
            }));
    }

    private validateSeverity(severity: string): ReviewSeverity {
        const validSeverities = Object.values(ReviewSeverity);
        return validSeverities.includes(severity as ReviewSeverity)
            ? (severity as ReviewSeverity)
            : ReviewSeverity.MEDIUM;
    }

    private validateCategory(category: string): ReviewCategory {
        const validCategories = Object.values(ReviewCategory);
        return validCategories.includes(category as ReviewCategory)
            ? (category as ReviewCategory)
            : ReviewCategory.BUG;
    }
}
