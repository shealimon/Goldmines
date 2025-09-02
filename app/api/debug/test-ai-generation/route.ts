import { NextRequest, NextResponse } from 'next/server';
import { openaiService } from '@/lib/openai';

export async function GET() {
  try {
    console.log('🔍 Testing AI generation directly...');
    
    // Create a simple test post
    const testPost = {
      id: 'test_ai_generation',
      title: 'Test Business Post',
      content: 'This is a test post about starting a SaaS business. I want to create a tool that helps small businesses manage their inventory.',
      author: 'TestUser',
      subreddit: 'entrepreneur',
      score: 10,
      num_comments: 5,
      url: 'https://reddit.com/test',
      permalink: '/r/entrepreneur/test',
      created_utc: Date.now() / 1000
    };
    
    console.log('📝 Test post created:', {
      id: testPost.id,
      title: testPost.title,
      content_length: testPost.content.length
    });
    
    // Test AI generation
    console.log('🧠 Testing AI generation...');
    const analyzedPosts = await openaiService.batchAnalyzeRedditPosts([testPost]);
    
    console.log(`✅ Generated ${analyzedPosts.length} business ideas`);
    
    if (analyzedPosts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No business ideas generated from test post'
      });
    }
    
    // Check each generated idea
    const validatedIdeas = analyzedPosts.map((idea, index) => {
      const fullAnalysisLength = idea.full_analysis?.length || 0;
      const businessIdeaNameLength = idea.business_idea_name?.length || 0;
      
      return {
        id: index + 1,
        business_idea_name: idea.business_idea_name,
        business_idea_name_length: businessIdeaNameLength,
        full_analysis_length: fullAnalysisLength,
        full_analysis_preview: idea.full_analysis?.substring(0, 100) + '...',
        niche: idea.niche,
        category: idea.category,
        validation: {
          full_analysis_valid: fullAnalysisLength >= 50,
          business_idea_name_valid: businessIdeaNameLength >= 5,
          overall_valid: fullAnalysisLength >= 50 && businessIdeaNameLength >= 5
        }
      };
    });
    
    return NextResponse.json({
      success: true,
      message: `Generated ${validatedIdeas.length} business ideas from test post`,
      test_post: {
        id: testPost.id,
        title: testPost.title,
        content: testPost.content
      },
      generated_ideas: validatedIdeas,
      summary: {
        total_generated: analyzedPosts.length,
        valid_ideas: validatedIdeas.filter(idea => idea.validation.overall_valid).length,
        invalid_ideas: validatedIdeas.filter(idea => !idea.validation.overall_valid).length
      }
    });
    
  } catch (error) {
    console.error('❌ Error testing AI generation:', error);
    return NextResponse.json({
      success: false,
      message: 'Error testing AI generation',
      error: String(error)
    }, { status: 500 });
  }
}
