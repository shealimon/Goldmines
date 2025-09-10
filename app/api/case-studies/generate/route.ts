import { NextRequest, NextResponse } from 'next/server';
import { openaiService } from '@/lib/openai';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// Case study prompt template
const CASE_STUDY_PROMPT = `Write a motivational, storytelling-style case study about the company {{company_name}} and its founder(s) {{person_name}}.

The case study should read like an inspiring journey, not just a dry report. Use a clear narrative voice that mixes data (funding, valuation, users, competitors) with storytelling (struggles, turning points, lessons). Make it engaging and educational so readers feel motivated.

Structure the case study into the following sections with emojis:

🌱 The Beginning – Founding story, early life/career of founders, what problem they noticed.  
⚡ The Leap of Faith – The risky decision (dropping out, quitting jobs, investing savings), personal sacrifices.  
📈 The Rise – Early wins, product launches, growth milestones, community/user adoption, product-market fit.  
🌪 The Struggles – Challenges, failures, technical hurdles, financial roadblocks, competition, self-doubt.  
🔥 The Turning Point – The big breakthrough (viral moment, investor backing, Series A, key partnership).  
💰 Earnings & Growth – Revenue model, subscription plans, funding timeline, valuation, user/customer growth, founder equity/net worth. 

CRITICAL REQUIREMENTS:
1. Use ONLY REAL, ACCURATE financial data - do not make up numbers
2. Research the actual company's valuation, revenue, and funding history
3. If you cannot find accurate data, use "Not disclosed" or "Private" instead of guessing
4. All monetary values MUST be formatted as strings with proper abbreviations:
   - Use "$470M" for 470 million (NOT "$470.00M" or "470000000")
   - Use "$1.2B" for 1.2 billion (NOT "$1200M") 
   - Use "$50K" for 50 thousand (NOT "$50000")
   - Use "$2.5M" for 2.5 million (NOT "$2500000")
   - Examples: "$470M", "$1.2B", "$50K", "$2.5M"
🎯 Competitors & Market Context – List major competitors (big tech + startups) and how this company differentiates itself.  
🧠 Founder's Mindset & Quotes – Direct quotes (if available) or paraphrased vision/philosophy.  
🚀 Future Vision – What's next? Long-term mission, goals, dreams for the company/industry.  
🌟 Lessons We Can Learn – 3–5 actionable takeaways for entrepreneurs (bet on yourself, community-first growth, solve your own problems, iterate fast).  
🔑 Final Inspiration – End with a powerful emotional note that makes the reader believe they can achieve success too.

Tone: Motivational, storytelling, and insightful. Avoid dry corporate language.  
Audience: Entrepreneurs, startup founders, and readers seeking inspiration.  
Length: 1,000–1,500 words, detailed but engaging.  

OUTPUT INSTRUCTIONS:
Return ONLY valid JSON in this structure:

{
  "title":"string",
  "subtitle":"string",
  "slug":"string",
  "category":"string",
  "cover_image_url": null,
  "sections":[{"name":"string","emoji":"string","heading":"string","body":"string"}],
  "funding":[{"round":"string","amount":"string","date":"YYYY-MM-DD or null","investors":["string"],"source":"string"}],
  "starting_income": "string",
  "current_revenue": "string", 
  "valuation": "string",
  "users_count": number,
  "competitors":["string"],
    "quotes":[{"who":"string","quote":"string"}],
    "company_url":"string",
  "tags":["string"],
  "confidence":{"funding":0.0,"revenue":0.0,"overall":0.0}
}`;

// JSON Schema from your specification
const CASE_STUDY_SCHEMA = {
  "type": "object",
  "properties": {
    "title": {"type": "string"},
    "subtitle": {"type": ["string","null"]},
    "slug": {"type": "string"},
    "category": {"type": ["string","null"]},
    "cover_image_url": {"type": ["string","null"]},
    "sections": {
      "type": "array",
      "items": {
        "type":"object",
        "properties": {
          "name":{"type":"string"},
          "emoji":{"type":"string"},
          "heading":{"type":"string"},
          "body":{"type":"string"}
        },
        "required":["name","emoji","heading","body"],
        "additionalProperties": false
      }
    },
    "funding": {
      "type":"array",
      "items": {
        "type":"object",
        "properties": {
          "round":{"type":"string"},
          "amount":{"type":["string","null"]},
          "date":{"type":["string","null"]},
          "investors":{"type":"array","items":{"type":"string"}},
          "source":{"type":"string"}
        },
        "required":["round","amount","date","investors","source"],
        "additionalProperties": false
      }
    },
    "starting_income":{"type":["string","null"]},
    "current_revenue":{"type":["string","null"]},
    "valuation":{"type":["string","null"]},
    "users_count":{"type":["number","null"]},
    "competitors":{"type":"array","items":{"type":"string"}},
    "quotes":{"type":"array","items":{"type":"object","properties":{"who":{"type":"string"},"quote":{"type":"string"}},"required":["who","quote"],"additionalProperties": false}},
    "company_url":{"type":"string"},
    "tags":{"type":"array","items":{"type":"string"}},
    "confidence":{"type":"object","properties":{"funding":{"type":"number"},"revenue":{"type":"number"},"overall":{"type":"number"}},"required":["funding","revenue","overall"],"additionalProperties": false}
  },
  "required":["title","subtitle","slug","category","cover_image_url","sections","funding","starting_income","current_revenue","valuation","users_count","competitors","quotes","company_url","tags","confidence"],
  "additionalProperties": false
};

// Helper function to validate JSON against schema
function validateCaseStudyData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  const requiredFields = ['title', 'slug', 'sections', 'funding', 'confidence'];
  
  for (const field of requiredFields) {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Check sections structure
  if (data.sections && Array.isArray(data.sections)) {
    data.sections.forEach((section: any, index: number) => {
      const sectionRequired = ['name', 'heading', 'body'];
      sectionRequired.forEach(field => {
        if (!(field in section)) {
          errors.push(`Section ${index} missing required field: ${field}`);
        }
      });
    });
  }
  
  // Check funding structure
  if (data.funding && Array.isArray(data.funding)) {
    data.funding.forEach((funding: any, index: number) => {
      const fundingRequired = ['round', 'source'];
      fundingRequired.forEach(field => {
        if (!(field in funding)) {
          errors.push(`Funding ${index} missing required field: ${field}`);
        }
      });
    });
  }
  
  // Validate financial data makes sense
  if (data.valuation && data.current_revenue) {
    const valuation = parseMonetaryValue(data.valuation);
    const revenue = parseMonetaryValue(data.current_revenue);
    
    if (valuation > 0 && revenue > 0) {
      // Valuation should be at least 5x revenue for most companies
      if (revenue > valuation * 0.2) {
        errors.push(`Financial data seems inconsistent: Revenue (${data.current_revenue}) is too high compared to Valuation (${data.valuation})`);
      }
      // Revenue should be reasonable for the valuation
      if (valuation > 1000000000 && revenue < 1000000) { // $1B+ valuation but <$1M revenue
        errors.push(`Financial data seems inconsistent: High valuation (${data.valuation}) but very low revenue (${data.current_revenue})`);
      }
    }
  }
  
  // Basic validation - just check if arrays are arrays
  if (data.competitors && !Array.isArray(data.competitors)) {
    errors.push('Competitors must be an array');
  }
  
  if (data.quotes && !Array.isArray(data.quotes)) {
    errors.push('Quotes must be an array');
  }
  
  if (data.resources && !Array.isArray(data.resources)) {
    errors.push('Resources must be an array');
  }
  
  if (data.tags && !Array.isArray(data.tags)) {
    errors.push('Tags must be an array');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper function to parse monetary values for validation
function parseMonetaryValue(value: any): number {
  if (!value) return 0;
  
  if (typeof value === 'number') return value;
  
  const str = String(value).toLowerCase();
  const numMatch = str.match(/[\d.]+/);
  if (!numMatch) return 0;
  
  const num = parseFloat(numMatch[0]);
  
  if (str.includes('billion') || str.includes('b')) {
    return num * 1000000000;
  } else if (str.includes('million') || str.includes('m')) {
    return num * 1000000;
  } else if (str.includes('thousand') || str.includes('k')) {
    return num * 1000;
  }
  
  return num;
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Helper function to format monetary values properly
function formatMonetaryValue(value: any): string {
  if (!value) return '';
  
  console.log('🔍 Formatting value:', value, 'Type:', typeof value);
  
  // If it's already a string with proper format, return as is
  if (typeof value === 'string' && /^\$[\d.]+[KMB]?$/.test(value)) {
    console.log('✅ Already properly formatted:', value);
    return value;
  }
  
  // If it's a number, convert to proper format
  if (typeof value === 'number') {
    let formatted;
    if (value >= 1000000000) {
      formatted = `$${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      formatted = `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      formatted = `$${(value / 1000).toFixed(1)}K`;
    } else {
      formatted = `$${value}`;
    }
    console.log('🔢 Converted number:', value, '→', formatted);
    return formatted;
  }
  
  // If it's a string but not properly formatted, try to extract number and format
  const str = String(value).toLowerCase();
  const numMatch = str.match(/[\d.]+/);
  if (numMatch) {
    const num = parseFloat(numMatch[0]);
    let formatted;
    
    if (str.includes('billion') || str.includes('b')) {
      formatted = `$${num.toFixed(1)}B`;
    } else if (str.includes('million') || str.includes('m')) {
      formatted = `$${num.toFixed(1)}M`;
    } else if (str.includes('thousand') || str.includes('k')) {
      formatted = `$${num.toFixed(1)}K`;
    } else if (num >= 1000000000) {
      formatted = `$${(num / 1000000000).toFixed(1)}B`;
    } else if (num >= 1000000) {
      formatted = `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      formatted = `$${(num / 1000).toFixed(1)}K`;
    } else {
      formatted = `$${num}`;
    }
    console.log('📝 Converted string:', value, '→', formatted);
    return formatted;
  }
  
  console.log('⚠️ Could not format, returning as string:', String(value));
  return String(value);
}

// Helper function to upload logo to Supabase Storage
async function uploadLogo(slug: string, imageUrl?: string): Promise<string | null> {
  if (!imageUrl) {
    console.log('📸 No image URL provided for logo upload');
    return null;
  }
  
  try {
    console.log(`📸 Starting logo upload for ${slug}: ${imageUrl}`);
    
    // First, check if the bucket exists
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return null;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'case-study-logos');
    if (!bucketExists) {
      console.log('📦 Creating case-study-logos bucket...');
      const { data: bucket, error: createError } = await supabaseAdmin.storage.createBucket('case-study-logos', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError);
        return null;
      }
      console.log('✅ Bucket created successfully');
    }
    
    // Download the image
    console.log('⬇️ Downloading image...');
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    
    const imageBuffer = await response.arrayBuffer();
    const imageData = new Uint8Array(imageBuffer);
    console.log(`📏 Image size: ${imageData.length} bytes`);
    
    // Upload to Supabase Storage
    const fileName = `${slug}.png`;
    const filePath = `logos/${fileName}`;
    
    console.log(`⬆️ Uploading to storage: ${filePath}`);
    const { data, error } = await supabaseAdmin.storage
      .from('case-study-logos')
      .upload(filePath, imageData, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (error) {
      console.error('❌ Error uploading to Supabase Storage:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name
      });
      return null;
    }
    
    console.log('✅ Upload successful, getting public URL...');
    
    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('case-study-logos')
      .getPublicUrl(filePath);
    
    console.log(`✅ Logo uploaded successfully: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
    
  } catch (error) {
    console.error('❌ Error uploading logo:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}

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

    // Handle multiple cofounders
    const allFounders = [person_name];
    if (cofounders && Array.isArray(cofounders) && cofounders.length > 0) {
      allFounders.push(...cofounders);
    }
    
    const foundersText = allFounders.length > 1 
      ? `${person_name} and ${cofounders?.join(', ') || ''}`
      : person_name;

    console.log(`🚀 Generating case study for ${foundersText} at ${company_name}`);

    // Step 1: Build prompt with template variables
    const prompt = CASE_STUDY_PROMPT
      .replace(/\{\{person_name\}\}/g, foundersText)
      .replace(/\{\{company_name\}\}/g, company_name);

    console.log('📝 Prompt built, calling OpenAI...');

    // Step 2: Call OpenAI
    const openaiResponse = await openaiService.generateStructuredOutput({
      prompt,
      schema: CASE_STUDY_SCHEMA,
      model: 'gpt-4o-mini',
      temperature: 0.7
    });

    if (!openaiResponse.success || !openaiResponse.data) {
      console.error('❌ OpenAI API error:', openaiResponse.error);
      return NextResponse.json({
        success: false,
        message: 'Failed to generate case study content',
        error: openaiResponse.error
      }, { status: 500 });
    }

    console.log('✅ OpenAI response received, validating...');

    // Step 3: Validate JSON response
    const validation = validateCaseStudyData(openaiResponse.data);
    if (!validation.isValid) {
      console.error('❌ JSON validation failed:', validation.errors);
      return NextResponse.json({
        success: false,
        message: 'Generated content failed validation',
        errors: validation.errors
      }, { status: 400 });
    }

    const caseStudyData = openaiResponse.data;
    console.log('✅ JSON validation passed');
    
    // Debug: Log the monetary values from OpenAI
    console.log('🔍 OpenAI returned monetary values:');
    console.log('Current Revenue:', caseStudyData.current_revenue);
    console.log('Valuation:', caseStudyData.valuation);
    console.log('Starting Income:', caseStudyData.starting_income);
    if (caseStudyData.funding && Array.isArray(caseStudyData.funding) && caseStudyData.funding.length > 0) {
      console.log('Funding amounts:', caseStudyData.funding.map((f: any) => f.amount));
    } else {
      console.log('Funding data:', caseStudyData.funding);
    }

    // Step 4: Generate unique slug
    let slug = generateSlug(caseStudyData.title);
    let slugCounter = 1;
    let finalSlug = slug;

    // Check if slug exists and make it unique
    while (true) {
      const { data: existing } = await supabase
        .from('case_studies')
        .select('id')
        .eq('slug', finalSlug)
        .single();

      if (!existing) break;
      
      finalSlug = `${slug}-${slugCounter}`;
      slugCounter++;
    }

    // Step 5: Upload logo if available
    const logoUrl = await uploadLogo(finalSlug, image_url || caseStudyData.cover_image_url);
    
    // If upload failed, use the original image URL as fallback
    const finalLogoUrl = logoUrl || image_url || caseStudyData.cover_image_url;
    console.log('🖼️ Final logo URL:', finalLogoUrl);

    console.log('💾 Saving to Supabase...');
    
    // Debug: Log the formatted monetary values
    console.log('🔍 Formatted monetary values:');
    console.log('Current Revenue:', formatMonetaryValue(caseStudyData.current_revenue));
    console.log('Valuation:', formatMonetaryValue(caseStudyData.valuation));
    console.log('Starting Income:', formatMonetaryValue(caseStudyData.starting_income));

    // Step 6: Upsert main case study using your exact SQL query
    const { data: caseStudy, error: caseStudyError } = await supabaseAdmin
      .from('case_studies')
      .upsert({
        slug: finalSlug,
        title: caseStudyData.title,
        subtitle: caseStudyData.subtitle,
        category: caseStudyData.category,
        cover_image_url: finalLogoUrl,
        current_revenue: formatMonetaryValue(caseStudyData.current_revenue),
        valuation: formatMonetaryValue(caseStudyData.valuation),
        starting_income: formatMonetaryValue(caseStudyData.starting_income),
        lifetime_revenue: formatMonetaryValue(caseStudyData.current_revenue), // Using current_revenue as lifetime for now
        users_count: caseStudyData.users_count,
        market_context: caseStudyData.competitors?.join(', ') || '',
        raw_output: caseStudyData,
        sources: caseStudyData.sources || [],
        confidence: caseStudyData.confidence,
        company_url: caseStudyData.company_url || '',
        founder_name: foundersText,
        app_name: company_name
      })
      .select()
      .single();

    if (caseStudyError) {
      console.error('❌ Error saving case study:', caseStudyError);
      return NextResponse.json({
        success: false,
        message: 'Failed to save case study',
        error: caseStudyError.message
      }, { status: 500 });
    }

    const caseStudyId = caseStudy.id;
    console.log(`✅ Case study saved with ID: ${caseStudyId}`);

    // Step 7: Insert sections
    if (caseStudyData.sections && caseStudyData.sections.length > 0) {
      const sectionsData = caseStudyData.sections.map((section: any, index: number) => ({
        case_study_id: caseStudyId,
        sort_order: index,
        name: section.name || '',
        emoji: section.emoji || '',
        heading: section.heading,
        body: section.body
      }));

      const { error: sectionsError } = await supabaseAdmin
        .from('case_study_sections')
        .insert(sectionsData);

      if (sectionsError) {
        console.error('❌ Error saving sections:', sectionsError);
      } else {
        console.log(`✅ Saved ${sectionsData.length} sections`);
      }
    }

    // Step 8: Insert funding rounds
    if (caseStudyData.funding && caseStudyData.funding.length > 0) {
      const fundingData = caseStudyData.funding.map((funding: any) => ({
        case_study_id: caseStudyId,
        round_name: funding.round,
        amount: formatMonetaryValue(funding.amount),
        raised_at: funding.date || null,
        investors: funding.investors || [],
        source: funding.source,
        note: ''
      }));

      const { error: fundingError } = await supabaseAdmin
        .from('case_study_funding')
        .insert(fundingData);

      if (fundingError) {
        console.error('❌ Error saving funding:', fundingError);
      } else {
        console.log(`✅ Saved ${fundingData.length} funding rounds`);
      }
    }

    // Step 9: Insert quotes
    if (caseStudyData.quotes && caseStudyData.quotes.length > 0) {
      const quotesData = caseStudyData.quotes.map((quote: any) => ({
        case_study_id: caseStudyId,
        who: quote.who || '',
        quote: quote.quote || ''
      }));

      const { error: quotesError } = await supabaseAdmin
        .from('case_study_quotes')
        .insert(quotesData);

      if (quotesError) {
        console.error('❌ Error saving quotes:', quotesError);
      } else {
        console.log(`✅ Saved ${quotesData.length} quotes`);
      }
    }


    // Step 10: Insert tags
    if (caseStudyData.tags && caseStudyData.tags.length > 0) {
      // First, upsert tags
      const { data: existingTags } = await supabase
        .from('tags')
        .select('id, name')
        .in('name', caseStudyData.tags);

      const existingTagNames = existingTags?.map(tag => tag.name) || [];
      const newTags = caseStudyData.tags.filter((tag: string) => !existingTagNames.includes(tag));

      if (newTags.length > 0) {
        const { data: insertedTags } = await supabaseAdmin
          .from('tags')
          .insert(newTags.map((name: string) => ({ name })))
          .select();

        const allTags = [...(existingTags || []), ...(insertedTags || [])];
        const tagIds = allTags
          .filter(tag => caseStudyData.tags.includes(tag.name))
          .map(tag => tag.id);

        // Insert case study tags
        const caseStudyTagsData = tagIds.map(tagId => ({
          case_study_id: caseStudyId,
          tag_id: tagId
        }));

        const { error: tagsError } = await supabaseAdmin
          .from('case_study_tags')
          .insert(caseStudyTagsData);

        if (tagsError) {
          console.error('❌ Error saving tags:', tagsError);
        } else {
          console.log(`✅ Saved ${caseStudyTagsData.length} tags`);
        }
      }
    }

    console.log(`🎉 Case study generation complete! ID: ${caseStudyId}, Slug: ${finalSlug}`);

    return NextResponse.json({
      success: true,
      message: 'Case study generated and saved successfully',
      data: {
        id: caseStudyId,
        slug: finalSlug,
        title: caseStudyData.title
      }
    });

  } catch (error) {
    console.error('❌ Error in case study generation:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
