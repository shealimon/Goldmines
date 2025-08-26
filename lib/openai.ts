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

  // Batch analyze multiple posts
  async analyzeRedditPostsBatch(posts: RedditPost[]): Promise<Array<{post_id: string, analysis: string}>> {
    // Skip API calls during build if no valid API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-build') {
      console.log('Skipping OpenAI batch analysis during build - no valid API key');
      return posts.map(post => ({ post_id: post.id, analysis: '' }));
    }
    
    try {
      console.log(`Batch analyzing ${posts.length} Reddit posts with OpenAI...`);
      
      // Create numbered list of posts
      const postsList = posts.map((post, index) => 
        `${index + 1}. ID: ${post.id}\nTitle: ${post.title}\nContent: ${post.content}\nSubreddit: r/${post.subreddit}\n`
      ).join('\n');

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 600 * posts.length, // Scale with number of posts
        messages: [
          {
            role: "system",
            content: `You will be given multiple Reddit posts in a numbered list.
For each post, first check if it contains a clear business idea.
If yes, return the structured extraction in the same format for that post.
If no, return nothing for that post.

Return as a JSON array, where each object includes:
{
  "post_id": "actual_reddit_post_id",
  "analysis": "the full formatted text as per rules OR empty string"
}

Rules for analysis format (for the "analysis" field):
Business Idea:
[one-line, crafted title in 3–8 words that clearly conveys the core value]

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
- [bullets]

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON array, no markdown, no explanations, no other text
2. Use double quotes for all strings
3. Escape any quotes inside the analysis text
4. Use the actual post ID from the input (the ID after "ID:" in each post)
5. If no business idea, set analysis to empty string ""

Example format:
[{"post_id": "abc123", "analysis": "Business Idea:\\nSample Title\\n\\nOpportunity:\\n- Point 1"}]`
          },
          {
            role: "user",
            content: postsList
          }
        ]
      });

      const responseText = completion.choices[0]?.message?.content || '';
      console.log('OpenAI batch response:', responseText.substring(0, 200));

      try {
        // Try to clean up the response text first
        let cleanedResponse = responseText.trim();
        
        // Remove any markdown code blocks if present
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
        }
        
        const result = JSON.parse(cleanedResponse);
        return Array.isArray(result) ? result : [];
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        console.log('Raw response:', responseText);
        
        // Fallback: process each post individually
        console.log('Falling back to individual post processing...');
        const individualResults = [];
        
        for (const post of posts) {
          try {
            const analyzedPost = await this.analyzeRedditPost(post);
            individualResults.push({
              post_id: post.id,
              analysis: analyzedPost.full_analysis
            });
          } catch (individualError) {
            console.error(`Error processing individual post ${post.id}:`, individualError);
          }
        }
        
        return individualResults;
      }

    } catch (error) {
      console.error('Error in batch analysis:', error);
      throw error;
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
[one-line, crafted title in 3–8 words that clearly conveys the core value; do NOT copy verbatim from the post; write the best, most descriptive title]

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

      // Parse the structured text response
      const parseStructuredResponse = (text: string) => {
        console.log('Parsing response text:', text);
        
        const extractSection = (text: string, sectionName: string): string[] => {
          // More precise regex that captures content until the next section
          const regex = new RegExp(`${sectionName}:([\\s\\S]*?)(?=\\n[A-Z][a-z]+:|$)`, 'i');
          const match = text.match(regex);
          console.log(`Section "${sectionName}" match:`, match);
          if (!match) return [];
          
          const lines = match[1].split('\n');
          const bulletPoints = lines
            .map(line => line.trim())
            .filter(line => line.startsWith('-'))
            .map(line => line.substring(1).trim())
            .filter(line => line.length > 0);
          
          console.log(`Extracted "${sectionName}" bullets:`, bulletPoints);
          return bulletPoints;
        };

        const extractSingleLine = (text: string, sectionName: string): string => {
          // More precise regex that captures content until the next section or end
          const regex = new RegExp(`${sectionName}:\\s*([^\\n]+)`, 'i');
          const match = text.match(regex);
          console.log(`Single line "${sectionName}" match:`, match);
          if (!match) return '';
          
          const result = match[1].trim().replace(/^\[|\]$/g, '').trim();
          console.log(`Extracted "${sectionName}":`, result);
          return result;
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
        
        console.log('Parsed result:', parsed);
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
          niche: 'Business opportunity',
          category: 'General business',
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
        niche: analysis.niche || 'Business opportunity',
        category: analysis.category || 'General business',
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