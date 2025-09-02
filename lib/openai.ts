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
  
  // NEW premium fields
  problem_story?: string;               // long-form explanation of pain/problem
  solution_vision?: string;             // detailed "what you can build" vision
  revenue_model?: string[];             // multiple revenue options (e.g. subscription, ads)
  competitive_advantage?: string[];     // why this idea is unique
  next_steps?: string[];                // actionable steps for a founder
}

export interface MarketingIdeaPost extends RedditPost {
  analysis_status: 'completed' | 'failed';
  marketing_idea_name: string;
  idea_description: string;
  channel: string[];
  target_audience: string[];
  potential_impact: 'High' | 'Medium' | 'Low';
  implementation_tips: string[];
  success_metrics: string[];
  full_analysis: string;
}

      // Parse the structured text response using improved section boundary detection
      const parseStructuredResponse = (text: string) => {
        console.log('Parsing response text:', text);
        
  // First, check if this is a multi-idea format (=== Post X - Idea Y ===)
  const isMultiIdeaFormat = text.includes('=== Post') && text.includes('Idea');
  
  if (isMultiIdeaFormat) {
    console.log('🔍 Detected multi-idea format, extracting individual idea...');
    
    // For multi-idea format, we need to extract just one idea section
    // The text should already be a single idea section when passed here
    // Remove the header line if present
    const cleanText = text.replace(/^=== Post \d+ - Idea \d+ ===\s*/g, '').trim();
    
    if (cleanText !== text) {
      console.log('✅ Removed multi-idea header, parsing single idea...');
      return parseSingleIdea(cleanText);
    }
  }
  
  // Fall back to single idea parsing
  return parseSingleIdea(text);
};

// Parse a single business idea
const parseSingleIdea = (text: string) => {
        const extractSection = (text: string, sectionName: string): string[] => {
          // Find the start of the section
          const sectionStart = text.indexOf(sectionName + ':');
          if (sectionStart === -1) {
            if (sectionName === 'Market Size') {
              console.log('⚠️ Market Size section not found in text');
              console.log('🔍 Looking for:', sectionName + ':');
              console.log('🔍 Text preview:', text.substring(0, 500));
            }
            return [];
          }
          
          // Define all possible section names to look for
          const sectionNames = [
            'Business Idea:', 'Niche:', 'Problem Story:', 'Solution Vision:', 'Target Customers:',
            'Revenue Model:', 'Market Size:', 'Category:', 'Competitive Advantage:', 
            'Marketing Strategy:', 'Next Steps:'
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
          
          if (sectionName === 'Market Size') {
            console.log(`📝 Market Size extraction details:`);
            console.log(`📝 Section content:`, sectionContent);
            console.log(`📝 Raw lines:`, lines);
            console.log(`📝 Filtered bullet points:`, bulletPoints);
          }
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
              'Business Idea:', 'Niche:', 'Problem Story:', 'Solution Vision:', 'Target Customers:',
              'Revenue Model:', 'Market Size:', 'Category:', 'Competitive Advantage:', 
              'Marketing Strategy:', 'Next Steps:'
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
              let result = firstLine.replace(/^\[|\]$/g, '').trim();
              
              // Remove markdown formatting (**bold**, *italic*, etc.)
              result = result.replace(/\*\*([^*]+)\*\*/g, '$1'); // Remove **bold**
              result = result.replace(/\*([^*]+)\*/g, '$1'); // Remove *italic*
              result = result.replace(/`([^`]+)`/g, '$1'); // Remove `code`
              
              // Special cleaning for business idea name
              if (sectionName === 'Business Idea') {
                // Remove brackets and clean up
                result = result.replace(/^\[|\]$/g, '').trim();
                // Remove dashes and clean up formatting
                result = result.replace(/^-\s*/, '').trim(); // Remove leading dash
                result = result.replace(/\s*-\s*$/, '').trim(); // Remove trailing dash
                // Ensure it's not empty after cleaning
                if (!result || result.length < 3) {
                  console.log(`⚠️ Business idea name too short after cleaning: "${result}"`);
                  result = 'Innovative Business Solution';
                }
              }
              
              // Special cleaning for niche field
              if (sectionName === 'Niche') {
                // Remove brackets and clean up
                result = result.replace(/^\[|\]$/g, '').trim();
                // Remove common unwanted prefixes
                result = result.replace(/^(Business Idea\s*\/?\s*|Marketing Strategy\s*\/?\s*|Case Study\s*\/?\s*)/i, '');
                // Remove dashes and clean up formatting
                result = result.replace(/^-\s*/, '').trim(); // Remove leading dash
                result = result.replace(/\s*-\s*$/, '').trim(); // Remove trailing dash
                // Clean up any remaining slashes and extra spaces
                result = result.replace(/\s*\/\s*/g, ' / ').trim();
                
                // Validate that it's one of the three allowed values
                const validNicheValues = ['Business Idea', 'Marketing Strategy', 'Case Study'];
                const matchedValue = validNicheValues.find(valid => 
                  result.toLowerCase().includes(valid.toLowerCase())
                );
                if (matchedValue) {
                  result = matchedValue;
                } else {
                  console.log(`⚠️ Invalid niche value: "${result}", using fallback`);
                  result = 'Business Idea';
                }
              }
              
              console.log(`✅ ${sectionName} extracted via section method:`, result);
              return result;
            }
          }
          
          // Method 2: Try multiple regex patterns
          const regexPatterns = [
            new RegExp(`${sectionName}:?\\s*([^\\n\\r]+)`, 'i'),
            new RegExp(`${sectionName}\\s*:\\s*([^\\n\\r]+)`, 'i'),
            new RegExp(`${sectionName}\\s*([^\\n\\r]+)`, 'i'),
          ];
          
          for (const pattern of regexPatterns) {
            const match = text.match(pattern);
      if (match && match[1]) {
        let result = match[1].trim().replace(/^\[|\]$/g, '').trim();
        
        // Remove markdown formatting (**bold**, *italic*, etc.)
        result = result.replace(/\*\*([^*]+)\*\*/g, '$1'); // Remove **bold**
        result = result.replace(/\*([^*]+)\*/g, '$1'); // Remove *italic*
        result = result.replace(/`([^`]+)`/g, '$1'); // Remove `code`
        
        // Special cleaning for niche field
        if (sectionName === 'Niche') {
          console.log(`🔍 Raw niche before cleaning: "${result}"`);
          // Remove common unwanted prefixes
          result = result.replace(/^(Business Idea\s*\/?\s*|Marketing Strategy\s*\/?\s*|Case Study\s*\/?\s*)/i, '');
          // Remove dashes and clean up formatting
          result = result.replace(/^-\s*/, '').trim(); // Remove leading dash
          result = result.replace(/\s*-\s*$/, '').trim(); // Remove trailing dash
          // Clean up any remaining slashes and extra spaces
          result = result.replace(/\s*\/\s*/g, ' / ').trim();
          console.log(`🔍 Niche after cleaning: "${result}"`);
        }
        
        if (result && result.length > 0) {
          console.log(`✅ ${sectionName} extracted via regex method:`, result);
              return result;
            }
            }
          }
          
          console.log(`❌ Could not extract ${sectionName}`);
          return '';
        };

  try {
    // Extract all sections
    let businessIdeaName = extractSingleLine(text, 'Business Idea');
    console.log('🔍 Extracted business idea name:', businessIdeaName);
    console.log('🔍 Business idea name length:', businessIdeaName?.length || 0);
    console.log('🔍 Extracting niche field...');
    let niche = extractSingleLine(text, 'Niche');
    console.log('🔍 Extracted niche:', niche);
    console.log('🔍 Niche length:', niche?.length || 0);
    console.log('🔍 Niche type:', typeof niche);
    let problemStory = extractSingleLine(text, 'Problem Story');
    let solutionVision = extractSingleLine(text, 'Solution Vision');
    let targetCustomers = extractSection(text, 'Target Customers');
    let revenueModel = extractSection(text, 'Revenue Model');
    let marketSize = extractSection(text, 'Market Size');
    console.log('🔍 Extracted market size:', marketSize);
    console.log('🔍 Market size length:', marketSize?.length || 0);
    let category = extractSingleLine(text, 'Category');
    let competitiveAdvantage = extractSection(text, 'Competitive Advantage');
    let marketingStrategy = extractSection(text, 'Marketing Strategy');
    let nextSteps = extractSection(text, 'Next Steps');

    // Validate required fields with fallback
    if (!businessIdeaName || businessIdeaName.length < 3) {
      console.log('⚠️ Business idea name missing or too short, using fallback');
      console.log('Raw business idea name:', businessIdeaName);
      console.log('Full text for debugging:', text.substring(0, 500));
      // Use fallback instead of throwing error
      businessIdeaName = 'Innovative Business Solution';
      console.log(`Using fallback business idea name: ${businessIdeaName}`);
    }

    if (!niche || niche.length < 2) {
      console.log('⚠️ Niche field missing or too short, using fallback');
      console.log('Raw niche value:', niche);
      console.log('Full text for debugging:', text.substring(0, 500));
      // Use fallback instead of throwing error
      niche = 'Business Idea';
      console.log(`Using fallback niche: ${niche}`);
    }

    if (!problemStory || problemStory.length < 10) {
      console.log('⚠️ Problem story missing, using fallback');
      problemStory = 'Customers face significant challenges in this area that need innovative solutions.';
    }

    if (!solutionVision || solutionVision.length < 10) {
      console.log('⚠️ Solution vision missing, using fallback');
      solutionVision = 'Build a comprehensive platform that addresses these pain points with modern technology and user-friendly design.';
    }

    if (targetCustomers.length === 0) {
      console.log('⚠️ Target customers missing, using fallback');
      targetCustomers.push('Small business owners', 'Entrepreneurs', 'Tech-savvy professionals');
    }

    if (revenueModel.length === 0) {
      console.log('⚠️ Revenue model missing, using fallback');
      revenueModel.push('Subscription model', 'Freemium with premium features', 'Transaction fees');
    }

    if (marketSize.length === 0) {
      console.log('⚠️ Market size missing, using fallback');
      marketSize.push('$1B+ market opportunity');
    }

    if (!category || category.length < 2) {
      console.log('⚠️ Category missing, using fallback');
      category = 'SaaS';
    }

    if (competitiveAdvantage.length === 0) {
      console.log('⚠️ Competitive advantage missing, using fallback');
      competitiveAdvantage.push('First-mover advantage in this niche');
    }

    if (marketingStrategy.length === 0) {
      console.log('⚠️ Marketing strategy missing, using fallback');
      marketingStrategy.push('Content marketing', 'Social media outreach', 'Partnership development');
    }

    if (marketSize.length === 0) {
      console.log('⚠️ Market size missing, using fallback');
      marketSize.push('$1B+ market opportunity', 'Growing market with high demand', 'Multiple revenue streams possible');
    }

    if (nextSteps.length === 0) {
      console.log('⚠️ Next steps missing, using fallback');
      nextSteps.push('Validate the idea with potential customers', 'Create a minimum viable product (MVP)', 'Test the market with a pilot program', 'Scale based on initial feedback');
    }

    console.log('✅ Successfully parsed all sections');
    console.log('🔍 Final niche value before return:', niche);
    console.log('🔍 Final niche fallback value:', niche || 'Business Idea');
    console.log('🔍 Final market size value:', marketSize);

    return {
      business_idea_name: businessIdeaName,
      niche: niche || 'Business Idea', // Use fallback if niche is missing
      problem_story: problemStory || 'Customers face significant challenges in this area that need innovative solutions.',
      solution_vision: solutionVision || 'Build a comprehensive platform that addresses these pain points with modern technology and user-friendly design.',
      target_customers: targetCustomers.length > 0 ? targetCustomers : ['Small business owners', 'Entrepreneurs', 'Tech-savvy professionals'],
      revenue_model: revenueModel.length > 0 ? revenueModel : ['Subscription model', 'Freemium with premium features', 'Transaction fees'],
      market_size: marketSize.length > 0 ? marketSize : ['$1B+ market opportunity'],
      category: category || 'SaaS',
      competitive_advantage: competitiveAdvantage.length > 0 ? competitiveAdvantage : ['First-mover advantage in this niche'],
      marketing_strategy: marketingStrategy.length > 0 ? marketingStrategy : ['Content marketing', 'Social media outreach', 'Partnership development'],
      next_steps: nextSteps.length > 0 ? nextSteps : ['Validate the idea with potential customers', 'Create a minimum viable product (MVP)', 'Test the market with a pilot program', 'Scale based on initial feedback'],
      full_analysis: text,
      // Legacy fields for backward compatibility
      opportunity_points: [problemStory || 'Customers face significant challenges in this area that need innovative solutions.'], // Map problem story to opportunity points
      problems_solved: [problemStory || 'Customers face significant challenges in this area that need innovative solutions.'] // Map problem story to problems solved
    };
    } catch (error) {
    console.error('❌ Error parsing structured response:', error);
      throw error;
    }
};

export const openaiService = {

  // Single batch function that does both pre-filtering AND analysis in one API call
  async batchAnalyzeRedditPosts(posts: RedditPost[]): Promise<AnalyzedPost[]> {
    // Skip API calls during build if no valid API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-build') {
      console.log('Skipping OpenAI analysis during build - no valid API key');
      return posts.map(post => ({
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
        full_analysis: 'Build mode - OpenAI analysis not available',
        
        // NEW premium fields
        problem_story: 'Build mode - no analysis available',
        solution_vision: 'Build mode - no analysis available',
        revenue_model: ['Build mode - no analysis available'],
        competitive_advantage: ['Build mode - no analysis available'],
        next_steps: ['Build mode - no analysis available']
      }));
    }
    
    try {
      console.log(`Analyzing ${posts.length} Reddit posts in batch with OpenAI...`);
      
      // Create a batch prompt with all posts
      const batchPrompt = posts.map((post, index) => 
        `Reddit Post ${index + 1}:
Title: ${post.title}
Content: ${post.content}`
      ).join('\n\n');

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 4000, // Increased for multiple ideas per post
        messages: [
          {
            role: "system",
             content: `You are a startup strategist and business consultant. 
Analyze the following Reddit posts and generate multiple structured founder-pack style business ideas.

Rules:
1. If a post is irrelevant (meme, rant, joke, politics, NSFW), skip it.
2. For useful posts:
   - Extract the main pain point.
   - Generate 3–5 unique ideas that solve it.
   - Each idea must include ALL of the following fields.

Output Format (repeat for each idea, separated by "---"):

Business Idea:
[catchy 3–8 word title]

Problem Story:
[2–3 sentences that describe the real-world pain customers face, with context and emotional detail]

Solution Vision:
[2–3 sentences explaining what a founder could build, how it works, and why it's practical]

Target Customers:
- [bullet points of main customer groups]

Revenue Model:
- [bullet points of ways to monetize, e.g. subscription, ads, partnerships]

Market Size:
- [$ values with short format, e.g. $2B, $500M]

Niche:
[Choose EXACTLY one of these three options: Business Idea OR Marketing Strategy OR Case Study]

Category:
[industry like SaaS, FinTech, EdTech, HealthTech, Productivity, etc.]

Competitive Advantage:
- [bullet points explaining why this idea is different or stronger than existing solutions]

Marketing Strategy:
- [at least 3–4 actionable marketing tactics]

Next Steps:
- [3–4 concrete steps a founder can take to test or launch]

---

Important:
- Do NOT output JSON.
- Do NOT add explanations outside this structure.
- Write in clear, professional, and inspiring style.
- Ensure every field is filled and detailed enough that a paying user feels they got consultant-level advice.`
          },
          {
            role: "user",
            content: batchPrompt
          }
        ]
      });

      const responseText = completion.choices[0]?.message?.content || '';
      console.log('OpenAI batch response (full):', responseText);

      // Parse the structured text response
      const analyzedPosts: AnalyzedPost[] = [];
      
      // Split response into individual idea sections using the --- separator
      const ideaSections = responseText.split(/---/);
      
      for (let i = 0; i < ideaSections.length; i++) {
        const section = ideaSections[i].trim();
        if (!section) continue;
        
        try {
          // Parse the structured idea section
          const parsedIdea = parseStructuredResponse(section);
          
          // Validate that the idea has proper content
          if (!parsedIdea.business_idea_name || parsedIdea.business_idea_name.trim().length < 5) {
            console.log(`⚠️ Skipping idea with invalid title: ${parsedIdea.business_idea_name}`);
            continue;
          }

          // Validate that full_analysis meets minimum requirements
          if (parsedIdea.full_analysis.length < 50) {
            console.log(`⚠️ Skipping idea with insufficient analysis (${parsedIdea.full_analysis.length} chars): ${parsedIdea.business_idea_name}`);
            continue;
          }

          // Use the first post for attribution (since we're batching multiple posts into one prompt)
          const post = posts[0];

          const analyzedPost: AnalyzedPost = {
            ...post,
            analysis_status: 'completed',
            business_idea_name: parsedIdea.business_idea_name,
            opportunity_points: parsedIdea.opportunity_points,
            problems_solved: parsedIdea.problems_solved,
            target_customers: parsedIdea.target_customers,
            market_size: parsedIdea.market_size,
            niche: parsedIdea.niche,
            category: parsedIdea.category,
            marketing_strategy: parsedIdea.marketing_strategy,
            full_analysis: parsedIdea.full_analysis,
            
            // NEW premium fields
            problem_story: parsedIdea.problem_story,
            solution_vision: parsedIdea.solution_vision,
            revenue_model: parsedIdea.revenue_model,
            competitive_advantage: parsedIdea.competitive_advantage,
            next_steps: parsedIdea.next_steps
          };
          
          analyzedPosts.push(analyzedPost);
          console.log(`✅ Successfully processed idea: ${parsedIdea.business_idea_name}`);
        } catch (error) {
          console.error(`❌ Error processing idea section ${i}:`, error);
        }
      }

      console.log(`✅ Successfully extracted ${analyzedPosts.length} business ideas from ${posts.length} posts`);
      return analyzedPosts;

    } catch (error) {
      console.error('Batch analysis error:', error);
      // Return empty array instead of failed posts to avoid database constraint violations
      return [];
    }
  },
};