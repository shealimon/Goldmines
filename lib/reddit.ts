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
  //SUBREDDITS: [ "Entrepreneur", "indiehackers", "sidehustle", "SideProject", "startups", "smallbusiness", "SaaS", "microsaas"],
  //SUBREDDITS: [ "Entrepreneur","indiehackers"],
  SUBREDDITS: [ "Entrepreneur", "indiehackers", "sidehustle", "SideProject", "startups", "smallbusiness", "SaaS", "microsaas", "Software", "Productivity", "LinkedIn", "FinTech", "Photography", "GameDev", "Accounting", "CyberSecurity", "SEO"],

  // Reddit URL endpoints for different sorting options
  getRedditUrls(subreddit: string, limit: number = 50) {
    return {      
      top: `https://www.reddit.com/r/${subreddit}/top.json?t=month&limit=${limit}`,
      
      //hot: `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
      
      //new: `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`,
      
      //best: `https://www.reddit.com/r/${subreddit}/best.json?limit=${limit}`
    };
  },

  // Generate content hash exactly like Python
  generateContentHash(title: string, content: string): string {
    const cleanTitle = title.replace(/[^\w\s]/g, '').toLowerCase().trim();
    const cleanContent = content.replace(/[^\w\s]/g, '').toLowerCase().trim();
    const combined = `${cleanTitle} ${cleanContent}`;
    const normalized = combined.replace(/\s+/g, ' ').trim();
    return normalized.substring(0, 100);
  },

  async fetchAllSubreddits(limit: number = 20, subredditNames?: string[]): Promise<RedditPost[]> {
    try {
      const subreddits = subredditNames && subredditNames.length > 0 ? subredditNames : this.SUBREDDITS;
      console.log('🚀 Starting to fetch posts from ALL sorting methods (top, hot, new, best) from subreddits:', subreddits);
      
      const allPosts: RedditPost[] = [];
      
      for (const subreddit of subreddits) {
        try {
          console.log(`📥 Fetching from ALL sorting methods for r/${subreddit}...`);
          
          // Get ALL Reddit URLs for this subreddit
          const urls = this.getRedditUrls(subreddit, limit);
          console.log(`🔗 URLs for r/${subreddit}:`, Object.keys(urls));
          
          // Fetch from ALL sorting methods simultaneously
          const fetchPromises = Object.entries(urls).map(async ([sortType, url]) => {
            try {
              console.log(`📥 Fetching ${sortType.toUpperCase()} posts from r/${subreddit}...`);
              
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
                console.log(`⚠️ Failed to fetch ${sortType} from r/${subreddit}: ${response.status} ${response.statusText}`);
                if (response.status === 403) {
                  console.log(`🚫 Access forbidden for r/${subreddit} ${sortType} - this subreddit might be private or have restrictions`);
                } else if (response.status === 429) {
                  console.log(`⏰ Rate limited for r/${subreddit} ${sortType} - waiting longer before next request`);
                  await new Promise(resolve => setTimeout(resolve, 5000));
                }
                return [];
              }
              
              const data = await response.json();
              const posts = data.data?.children || [];
              
              console.log(`✅ Fetched ${posts.length} ${sortType.toUpperCase()} posts from r/${subreddit}`);
              
              // Process posts up to the specified limit
              let processedCount = 0;
              const subredditPosts: RedditPost[] = [];
              
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
                
                subredditPosts.push(redditPost);
                processedCount++;
              }
              
              console.log(`🎯 Processed exactly ${processedCount} ${sortType.toUpperCase()} posts from r/${subreddit}`);
              return subredditPosts;
              
            } catch (error) {
              console.error(`❌ Error fetching ${sortType} from r/${subreddit}:`, error);
              return [];
            }
          });
          
          // Wait for all sorting methods to complete
          const allSubredditPosts = await Promise.all(fetchPromises);
          
          // Flatten and add all posts from this subreddit
          const subredditPosts = allSubredditPosts.flat();
          allPosts.push(...subredditPosts);
          
          console.log(`🎯 Total posts from r/${subreddit} (all sorting methods): ${subredditPosts.length}`);
          
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
    
    console.log(`✅ Filtered ${posts.length} posts (all sorting methods) down to ${filtered.length} business idea posts`);
    return filtered;
  },

  // Function to fetch posts from all sorting methods (legacy function for backward compatibility)
  async fetchAllSortingMethods(limit: number = 20, subredditNames?: string[]): Promise<{
    top: RedditPost[];
    hot: RedditPost[];
    new: RedditPost[];
    best: RedditPost[];
  }> {
    console.log('🔄 Fetching posts from all sorting methods...');
    
    // Since fetchAllSubreddits now fetches from ALL methods, we can use it directly
    const allPosts = await this.fetchAllSubreddits(limit, subredditNames);
    
    // For backward compatibility, we'll return the same structure
    // but note that all posts are now combined from all sorting methods
    return {
      top: allPosts,
      hot: allPosts,
      new: allPosts,
      best: allPosts
    };
  }
};



