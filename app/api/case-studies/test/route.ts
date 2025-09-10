import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { person_name, company_name, image_url, cofounders } = body;

    if (!person_name || !company_name) {
      return NextResponse.json({
        success: false,
        message: 'person_name and company_name are required'
      }, { status: 400 });
    }

    console.log(`🧪 Testing case study generation for ${person_name} at ${company_name}`);

    // Call the case study generation API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/case-studies/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        person_name,
        company_name,
        image_url,
        cofounders
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: 'Case study generation failed',
        error: result
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Case study generation test completed',
      data: result
    });

  } catch (error) {
    console.error('❌ Error in test:', error);
    return NextResponse.json({
      success: false,
      message: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
