import OpenAI from 'openai';

// Initialize OpenAI client with fallback
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
});

export interface RedditPost {
  id: string;
  title: string;
  content: string;
  subreddit: string;
  score: number;
  url: string;
  created_utc: number;
  author: string;
  num_comments: number;
  permalink: string;
}

export interface AnalyzedPost extends RedditPost {
  analysis_status: 'completed' | 'failed';
  business_idea_name: string;
  opportunity_points: string[];
  problems_solved: string[];
  target_customers: string[];
  market_size: string[];
  niche: string;
  category: string;
  marketing_strategy: string[];
  full_analysis: string;
}

export const openaiService = {
  // Pre-filter function to check if post contains business idea
  async preFilterBusinessIdea(text: string): Promise<boolean> {
    // Skip API calls during build if no valid API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-build') {
      console.log('Skipping OpenAI API call during build - no valid API key');
      return true; // Default to true during build
    }
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.1,
        max_tokens: 50, // Very cheap pre-filter
        messages: [
          {
            role: "system",
            content: "You are a business idea classifier. Given a Reddit post, determine if it contains a potential business idea. Respond with ONLY 'Yes' or 'No'. A business idea is something that could be turned into a product, service, or business opportunity."
          },
          {
            role: "user",
            content: text.substring(0, 200) // Limit text for cost efficiency
          }
        ]
      });

      const response = completion.choices[0]?.message?.content?.trim().toLowerCase() || '';
      return response.includes('yes');
    } catch (error) {
      console.error('Pre-filter error:', error);
      return true; // Default to true if filter fails
    }
  },



  // Single post analysis (for backward compatibility)
  async analyzeRedditPost(post: RedditPost): Promise<AnalyzedPost> {
    // Skip API calls during build if no valid API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-build') {
      console.log('Skipping OpenAI analysis during build - no valid API key');
      return {
        ...post,
        analysis_status: 'failed',
        business_idea_name: post.title,
        opportunity_points: ['Build mode - no analysis available'],
        problems_solved: ['Build mode - no analysis available'],
        target_customers: ['Build mode - no analysis available'],
        market_size: ['Build mode - no analysis available'],
        niche: 'Build mode',
        category: 'Build mode',
        marketing_strategy: ['Build mode - no analysis available'],
        full_analysis: 'Build mode - OpenAI analysis not available'
      };
    }
    
    try {
      console.log('Analyzing single Reddit post with OpenAI...');
      
      const prompt = `Text:
Title: ${post.title}
Content: ${post.content}
Subreddit: r/${post.subreddit}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 600,
        messages: [
          {
            role: "system",
            content: `You are a precise business idea extractor. 

Your task:
1) First, check if the given text contains a clear, new, or useful business idea.
2) If no valid business idea exists, return nothing at all (empty output).
3) If yes, extract and format strictly like this:

Business Idea:
[one-line, crafted title in 3 to 8 words that clearly conveys the core value; do NOT copy verbatim from the post; do NOT use trademarked game or product names in the title; always make it a generic, brand-safe title]

Opportunity:
- [bullets]

Problem it Solves:
- [bullets]

Target Customer:
- [bullets]

Market Size:
- [bullets with dollar values, e.g., $2B, $15M]

Niche:
[one line: single word or multiple comma-separated words if multiple niches]

Category:
[one line: industry category]

Marketing Strategy:
- [bullets with specific marketing tactics and strategies]

Rules:
- The "Business Idea" must be a concise, compelling, original title (3–8 words), not copied from the text.
- Market Size must always be expressed with $ + short number format (e.g., $2B, $500M).
- Niche can be multiple comma-separated words.
- Category should be one clear line.
- Marketing Strategy must include specific, actionable marketing tactics with bullet points.
- Use bullets for all multi-point fields.
- Do not add explanations or extra text outside this structure.
- Ensure Marketing Strategy is the last section and includes at least 3-4 bullet points.`
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

      const responseText = completion.choices[0]?.message?.content || '';
      console.log('OpenAI response (full):', responseText);

      // Parse the structured text response using improved section boundary detection
      const parseStructuredResponse = (text: string) => {
        console.log('Parsing response text:', text);
        
        const extractSection = (text: string, sectionName: string): string[] => {
          // Find the start of the section
          const sectionStart = text.indexOf(sectionName + ':');
          if (sectionStart === -1) return [];
          
          // Define all possible section names to look for
          const sectionNames = [
            'Business Idea:', 'Opportunity:', 'Problem it Solves:', 'Target Customer:', 
            'Market Size:', 'Niche:', 'Category:', 'Marketing Strategy:'
          ];
          
          // Find the start of the next section by looking for the next section header
          let sectionEnd = text.length;
          const remainingText = text.substring(sectionStart + sectionName.length + 1);
          
          for (const nextSection of sectionNames) {
            if (nextSection === sectionName + ':') continue; // Skip current section
            
            const nextSectionIndex = remainingText.indexOf(nextSection);
            if (nextSectionIndex !== -1) {
              sectionEnd = sectionStart + sectionName.length + 1 + nextSectionIndex;
              break;
            }
          }
          
          // Extract the section content
          const sectionContent = text.substring(sectionStart + sectionName.length + 1, sectionEnd);
          
          // Parse bullet points and clean up
          const lines = sectionContent.split('\n');
          const bulletPoints = lines
            .map(line => line.trim())
            .filter(line => line.startsWith('-'))
            .map(line => line.substring(1).trim())
            .filter(line => line.length > 0)
            .filter(line => {
              // Remove any lines that contain section headers
              const hasSectionHeader = sectionNames.some(name => line.includes(name));
              if (hasSectionHeader) {
                console.log(`🚫 Removed section header from ${sectionName}:`, line);
                return false;
              }
              return true;
            });
          
          console.log(`📝 Extracted ${bulletPoints.length} items for ${sectionName}:`, bulletPoints);
          return bulletPoints;
        };

        const extractSingleLine = (text: string, sectionName: string): string => {
          console.log(`🔍 Extracting ${sectionName} from text...`);
          
          // Method 1: Try exact section match first
          const sectionStart = text.indexOf(sectionName + ':');
          if (sectionStart !== -1) {
            // Find the end of this section by looking for the next section
            const sectionNames = [
              'Business Idea:', 'Opportunity:', 'Problem it Solves:', 'Target Customer:', 
              'Market Size:', 'Niche:', 'Category:', 'Marketing Strategy:'
            ];
            
            let sectionEnd = text.length;
            const remainingText = text.substring(sectionStart + sectionName.length + 1);
            
            for (const nextSection of sectionNames) {
              if (nextSection === sectionName + ':') continue;
              const nextSectionIndex = remainingText.indexOf(nextSection);
              if (nextSectionIndex !== -1) {
                sectionEnd = sectionStart + sectionName.length + 1 + nextSectionIndex;
                break;
              }
            }
            
            // Extract content and get first line
            const sectionContent = text.substring(sectionStart + sectionName.length + 1, sectionEnd);
            const firstLine = sectionContent.split('\n')[0].trim();
            
            if (firstLine && firstLine.length > 0) {
              const result = firstLine.replace(/^\[|\]$/g, '').trim();
              console.log(`✅ ${sectionName} extracted via section method:`, result);
              return result;
            }
          }
          
          // Method 2: Try multiple regex patterns
          const regexPatterns = [
            new RegExp(`${sectionName}:?\\s*([^\\n\\r]+)`, 'i'),
            new RegExp(`${sectionName}\\s*:\\s*([^\\n\\r]+)`, 'i'),
            new RegExp(`${sectionName}\\s*=\\s*([^\\n\\r]+)`, 'i'),
            new RegExp(`${sectionName}\\s*([^\\n\\r]+)`, 'i'),
            new RegExp(`${sectionName}\\s*:\\s*([^\\n\\r]+?)(?=\\n|\\r|$)`, 'i')
          ];
          
          for (const pattern of regexPatterns) {
            const match = text.match(pattern);
            if (match && match[1] && match[1].trim().length > 0) {
              const result = match[1].trim();
              console.log(`✅ ${sectionName} extracted via regex:`, result);
              return result;
            }
          }
          
          // Method 3: Look for the section anywhere in the text
          const lowerText = text.toLowerCase();
          const lowerSectionName = sectionName.toLowerCase();
          const sectionIndex = lowerText.indexOf(lowerSectionName + ':');
          
          if (sectionIndex !== -1) {
            // Find the end of this line
            const textAfterSection = text.substring(sectionIndex + sectionName.length + 1);
            const endOfLine = textAfterSection.indexOf('\n');
            const endOfLineIndex = endOfLine !== -1 ? endOfLine : textAfterSection.length;
            
            const content = textAfterSection.substring(0, endOfLineIndex).trim();
            if (content && content.length > 0) {
              console.log(`✅ ${sectionName} extracted via line search:`, content);
              return content;
            }
          }
          
          console.log(`❌ Could not extract ${sectionName}`);
          return '';
        };

        // Try multiple extraction methods for business idea name
        let businessIdeaName = extractSingleLine(text, 'Business Idea');
        if (!businessIdeaName) {
          // Fallback: look for business idea in different formats
          const fallbackRegex = /Business Idea:?\s*([^\n\r]+)/i;
          const fallbackMatch = text.match(fallbackRegex);
          if (fallbackMatch) {
            businessIdeaName = fallbackMatch[1].trim();
            console.log('Fallback business idea extraction:', businessIdeaName);
          }
        }
        
        // Special handling for marketing strategy (often the last section)
        let marketingStrategy = extractSection(text, 'Marketing Strategy');
        if (marketingStrategy.length === 0) {
          // Fallback: look for marketing strategy at the end of the text
          const marketingRegex = /Marketing Strategy:([\s\S]*?)$/i;
          const marketingMatch = text.match(marketingRegex);
          if (marketingMatch) {
            const lines = marketingMatch[1].split('\n');
            marketingStrategy = lines
              .map(line => line.trim())
              .filter(line => line.startsWith('-'))
              .map(line => line.substring(1).trim())
              .filter(line => line.length > 0);
            console.log('Fallback marketing strategy extraction:', marketingStrategy);
          }
        }
        
        const parsed = {
          business_idea_name: businessIdeaName,
          opportunity_points: extractSection(text, 'Opportunity'),
          problems_solved: extractSection(text, 'Problem it Solves'),
          target_customers: extractSection(text, 'Target Customer'),
          market_size: extractSection(text, 'Market Size'),
          niche: extractSingleLine(text, 'Niche'),
          category: extractSingleLine(text, 'Category'),
          marketing_strategy: marketingStrategy
        };
        
        // Enhanced fallback for niche and category if extraction failed
        if (!parsed.niche || parsed.niche.length === 0) {
          console.log('🔍 Niche extraction failed, trying keyword fallback...');
          // Try to find industry keywords in the text
          const industryKeywords = [
            'tech', 'software', 'saas', 'ecommerce', 'healthcare', 'finance', 'education',
            'marketing', 'consulting', 'real estate', 'food', 'fitness', 'travel', 'entertainment',
            'automotive', 'fashion', 'beauty', 'home', 'garden', 'pets', 'sports', 'gaming',
            'corporate', 'training', 'gamification', 'cybersecurity'
          ];
          
          const lowerText = text.toLowerCase();
          for (const keyword of industryKeywords) {
            if (lowerText.includes(keyword)) {
              parsed.niche = keyword.charAt(0).toUpperCase() + keyword.slice(1);
              console.log('🔍 Keyword-based niche fallback:', parsed.niche);
              break;
            }
          }
        }
        
        if (!parsed.category || parsed.category.length === 0) {
          console.log('🔍 Category extraction failed, trying inference...');
          // Try to infer category from niche or content
          if (parsed.niche && parsed.niche.length > 0) {
            if (['tech', 'software', 'saas'].includes(parsed.niche.toLowerCase())) {
              parsed.category = 'Technology';
            } else if (['healthcare', 'fitness'].includes(parsed.niche.toLowerCase())) {
              parsed.category = 'Healthcare';
            } else if (['finance', 'banking'].includes(parsed.niche.toLowerCase())) {
              parsed.category = 'Finance';
            } else if (['education', 'training'].includes(parsed.niche.toLowerCase())) {
              parsed.category = 'Education';
            } else {
              parsed.category = 'Business Services';
            }
            console.log('🔍 Inferred category from niche:', parsed.category);
          }
        }
        
        console.log('📝 Final parsed result:', parsed);
        return parsed;
      };

      let analysis;
      try {
        analysis = parseStructuredResponse(responseText);
      } catch (parseError) {
        console.log('Failed to parse response, using fallback analysis');
        analysis = {
          business_idea_name: post.title,
          opportunity_points: ['Market opportunity identified'],
          problems_solved: ['Addresses market need'],
          target_customers: ['General audience'],
          market_size: ['Market analysis needed'],
          niche: 'Unknown',
          category: 'Unknown',
          marketing_strategy: ['Marketing strategy required']
        };
      }

      const analyzedPost: AnalyzedPost = {
        ...post,
        analysis_status: 'completed',
        business_idea_name: analysis.business_idea_name || post.title,
        opportunity_points: analysis.opportunity_points || ['Market opportunity identified'],
        problems_solved: analysis.problems_solved || ['Addresses market need'],
        target_customers: analysis.target_customers || ['General audience'],
        market_size: analysis.market_size || ['Market analysis needed'],
        niche: analysis.niche || 'Unknown',
        category: analysis.category || 'Unknown',
        marketing_strategy: analysis.marketing_strategy || ['Marketing strategy required'],
        full_analysis: responseText
      };

      console.log('Post analysis completed successfully');
      return analyzedPost;

    } catch (error) {
      console.error('Error analyzing post with OpenAI:', error);
      throw error;
    }
  }
};