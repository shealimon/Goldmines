import { NextRequest, NextResponse } from 'next/server';
import { redditAPI } from '@/lib/reddit';

export async function GET() {
  try {
    console.log('🔍 Testing Vokkoz post filtering...');
    
    // Create a mock Reddit post from the Vokkoz content you provided
    const vokkozPost = {
      id: 'vokkoz_test',
      title: 'I often talk with artisans and independent professionals, and one topic keeps coming up: **client reviews**.',
      content: `I often talk with artisans and independent professionals, and one topic keeps coming up: **client reviews**.

I've noticed something interesting: Videos are impactful, but they're **rare** because asking a client to record themselves is often complicated. With an **audio testimonial**, it only takes **15 seconds** — no camera, no editing, no stress. And still, the **voice carries emotion, authenticity, and trust**.

Right now, I'm testing my project **Vokkoz** for an artisan: it lets him centralize all his info **and** display voice testimonials in one place. But I'm still wondering if this has **more impact** than video when it comes to building trust.

So I'd love to hear your thoughts: Which builds more **credibility** for you: a video or a just voice testimonial?  

Really curious to read your feedback 🙌 And if you want to **see an** example, feel free to ask.`,
      author: 'VokkozUser',
      subreddit: 'entrepreneur',
      score: 25,
      num_comments: 8,
      url: 'https://reddit.com/r/entrepreneur/comments/vokkoz_test',
      permalink: '/r/entrepreneur/comments/vokkoz_test',
      created_utc: Date.now() / 1000
    };
    
    console.log('📝 Vokkoz post created:', {
      id: vokkozPost.id,
      title: vokkozPost.title.substring(0, 50),
      content_length: vokkozPost.content.length
    });
    
    // Test the filtering
    console.log('🔍 Testing business filter on Vokkoz post...');
    const filteredPosts = redditAPI.filterBusinessIdeaPosts([vokkozPost]);
    
    console.log(`✅ Filter result: ${filteredPosts.length}/1 posts passed`);
    
    // Show which keywords are found
    const businessKeywords = [
      'business', 'startup', 'entrepreneur', 'saas', 'app', 'product', 'service',
      'company', 'market', 'revenue', 'profit', 'customer', 'client', 'user',
      'idea', 'opportunity', 'venture', 'investment', 'funding', 'launch',
      'indie', 'side hustle', 'passive income', 'freelance', 'consulting'
    ];
    
    const combinedText = `${vokkozPost.title} ${vokkozPost.content}`.toLowerCase();
    const foundKeywords = businessKeywords.filter(keyword => combinedText.includes(keyword));
    
    console.log('🔍 Keywords found in Vokkoz post:', foundKeywords);
    
    return NextResponse.json({
      success: true,
      message: `Vokkoz post filtering test completed`,
      post: {
        id: vokkozPost.id,
        title: vokkozPost.title,
        subreddit: vokkozPost.subreddit,
        content_preview: vokkozPost.content.substring(0, 200) + '...'
      },
      filter_result: {
        passed: filteredPosts.length > 0,
        posts_passed: filteredPosts.length,
        total_posts: 1
      },
      keyword_analysis: {
        all_keywords: businessKeywords,
        found_keywords: foundKeywords,
        combined_text_length: combinedText.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error testing Vokkoz filter:', error);
    return NextResponse.json({
      success: false,
      message: 'Error testing Vokkoz filter',
      error: String(error)
    }, { status: 500 });
  }
}
