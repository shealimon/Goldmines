import { NextRequest, NextResponse } from 'next/server';
import { openaiService } from '@/lib/openai';

export async function GET() {
  try {
    console.log('🔍 Analyzing post 93 manually...');
    
    // Create a mock Reddit post from the content you provided
    const mockPost = {
      id: '1n6c3ax', // Using the ID from the logs
      title: 'Here\'s my reality with Fungies Inc. (aka fungies.io) running on Stripe Express',
      content: `Here's my reality with Fungies Inc. (aka fungies.io) running on Stripe Express:

They pitch themselves not just as a creator platform, but as a SaaS + digital product marketplace + whatever else they can slap on the site. In practice, it's a mess:

Payouts frozen. I've got $2k+ USD on hold. Other users report even higher amounts. Payments keep coming in, but payouts get paused, and then boom, you're blocked.

Video KYC demand. They require you to record yourself, with no clear privacy policy about what happens to your biometric data. If that data is misused? Stripe's response = "ask Fungies."

Front vs. backend. Their landing page looks decent. The actual workspace? Laggy, error-filled, duct-taped together.

Discord censorship. Got kicked out of their Discord without explanation. Most users with good questions or real complaints get banned. Messages exposing issues are deleted, while only the "nice" ones remain. Their excuse? "Policy violation." But funny enough, before banning, they themselves tell people "yes you can sell your product/service here." Then later, payouts get paused, complaints ignored, and surprise! you're out.

Evidence ignored. I've sent Stripe screenshots, videos, and detailed complaints. Stripe's answer on repeat: "ask Fungies."

So, to all new people: avoid Fungies.io at all costs. They'll let you onboard, let you sell, let you bring in money, then flip the switch: freeze payouts, block you, and erase your voice from Discord.

And Stripe? Totally fine with it, because hey, it's "Stripe Express." The only thing "express" here is how fast Stripe bounces your complaint back to Fungies with zero accountability.

TL;DR: Fungies.io on Stripe Express = payouts on hold, Discord bans, deleted complaints, $2k+ stuck, users ghosted. Don't touch it.`,
      author: 'ComplaintUser',
      subreddit: 'saas',
      score: 150,
      num_comments: 25,
      url: 'https://reddit.com/r/saas/comments/1n6c3ax',
      permalink: '/r/saas/comments/1n6c3ax',
      created_utc: Date.now() / 1000
    };
    
    console.log('📝 Mock post created:', {
      id: mockPost.id,
      title: mockPost.title.substring(0, 50),
      content_length: mockPost.content.length
    });
    
    // Analyze the post with OpenAI
    console.log('🧠 Analyzing post with OpenAI...');
    const analyzedPosts = await openaiService.batchAnalyzeRedditPosts([mockPost]);
    
    console.log(`✅ Generated ${analyzedPosts.length} business ideas`);
    
    if (analyzedPosts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No business ideas generated from this post',
        post: {
          id: mockPost.id,
          title: mockPost.title,
          content_preview: mockPost.content.substring(0, 200)
        }
      });
    }
    
    // Format the results
    const businessIdeas = analyzedPosts.map((idea, index) => ({
      id: index + 1,
      business_idea_name: idea.business_idea_name,
      niche: idea.niche,
      category: idea.category,
      opportunity_points: idea.opportunity_points,
      problems_solved: idea.problems_solved,
      target_customers: idea.target_customers,
      market_size: idea.market_size,
      marketing_strategy: idea.marketing_strategy,
      full_analysis: idea.full_analysis
    }));
    
    return NextResponse.json({
      success: true,
      message: `Successfully generated ${businessIdeas.length} business ideas from post 93`,
      original_post: {
        id: mockPost.id,
        title: mockPost.title,
        subreddit: mockPost.subreddit,
        content_preview: mockPost.content.substring(0, 300) + '...'
      },
      business_ideas: businessIdeas
    });
    
  } catch (error) {
    console.error('❌ Error analyzing post 93:', error);
    return NextResponse.json({
      success: false,
      message: 'Error analyzing post 93',
      error: String(error)
    }, { status: 500 });
  }
}
