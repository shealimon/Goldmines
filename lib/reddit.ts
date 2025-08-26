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

export const redditAPI = {
  // Exact same subreddits as your Python code
  SUBREDDITS: [ "Entrepreneur", "indiehackers", "sidehustle", "SideProject", "startups", "smallbusiness", "SaaS", "microsaas"],
  //SUBREDDITS: [ "Entrepreneur"],

  // Generate content hash exactly like Python
  generateContentHash(title: string, content: string): string {
    const cleanTitle = title.replace(/[^\w\s]/g, '').toLowerCase().trim();
    const cleanContent = content.replace(/[^\w\s]/g, '').toLowerCase().trim();
    const combined = `${cleanTitle} ${cleanContent}`;
    const normalized = combined.replace(/\s+/g, ' ').trim();
    return normalized.substring(0, 100);
  },

  async fetchAllSubreddits(limit: number = 10, subredditNames?: string[]): Promise<RedditPost[]> {
    try {
      const subreddits = subredditNames && subredditNames.length > 0 ? subredditNames : this.SUBREDDITS;
      console.log('🚀 Starting to fetch posts from subreddits:', subreddits);
      
      const allPosts: RedditPost[] = [];
      
      for (const subreddit of subreddits) {
        try {
          console.log(` Fetching from r/${subreddit}...`);
          
          // Use TOP posts from last month with specified limit
          const url = `https://www.reddit.com/r/${subreddit}/top.json?t=month&limit=${limit}`;
          console.log(`🔗 URL: ${url}`);
          
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'application/json',
              'Accept-Language': 'en-US,en;q=0.9',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          if (!response.ok) {
            console.log(`⚠️ Failed to fetch from r/${subreddit}: ${response.status} ${response.statusText}`);
            if (response.status === 403) {
              console.log(`🚫 Access forbidden for r/${subreddit} - this subreddit might be private or have restrictions`);
            } else if (response.status === 429) {
              console.log(`⏰ Rate limited for r/${subreddit} - waiting longer before next request`);
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
            continue;
          }
          
          const data = await response.json();
          const posts = data.data?.children || [];
          
          console.log(`✅ Fetched ${posts.length} posts from r/${subreddit}`);
          
          // Process posts up to the specified limit
          let processedCount = 0;
          for (const post of posts) {
            if (processedCount >= limit) break; // Stop after reaching the limit
            
            const postData = post.data;
            
            // Skip posts with no content
            if (!postData.title || postData.title.trim().length < 10) {
              continue;
            }
            
            const redditPost: RedditPost = {
              id: postData.id,
              title: postData.title,
              content: postData.selftext || '',
              subreddit: subreddit,
              score: postData.score || 0,
              url: `https://reddit.com${postData.permalink}`,
              created_utc: postData.created_utc || Date.now() / 1000,
              author: postData.author || 'Unknown',
              num_comments: postData.num_comments || 0,
              permalink: postData.permalink || ''
            };
            
            allPosts.push(redditPost);
            processedCount++;
          }
          
          console.log(`🎯 Processed exactly ${processedCount} posts from r/${subreddit}`);
          
          // Add delay between subreddit requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`❌ Error fetching from r/${subreddit}:`, error);
          continue;
        }
      }
      
      console.log(`🎯 Total posts fetched from all subreddits: ${allPosts.length}`);
      return allPosts;
      
    } catch (error) {
      console.error('❌ Error in fetchAllSubreddits:', error);
      return [];
    }
  },

  filterBusinessIdeaPosts(posts: RedditPost[]): RedditPost[] {
    const businessKeywords = [
      'business', 'startup', 'entrepreneur', 'saas', 'app', 'product', 'service',
      'company', 'market', 'revenue', 'profit', 'customer', 'client', 'user',
      'idea', 'opportunity', 'venture', 'investment', 'funding', 'launch',
      'indie', 'side hustle', 'passive income', 'freelance', 'consulting'
    ];
    
    const filtered = posts.filter(post => {
      const combinedText = `${post.title} ${post.content}`.toLowerCase();
      return businessKeywords.some(keyword => combinedText.includes(keyword));
    });
    
    console.log(`✅ Filtered ${posts.length} TOP posts down to ${filtered.length} business idea posts`);
    return filtered;
  }
};



