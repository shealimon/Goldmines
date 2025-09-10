import { NextRequest, NextResponse } from 'next/server';
import { openaiService } from '@/lib/openai';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// Case study prompt template (same as single generation)
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

// JSON Schema (same as single generation)
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
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Process a single case study
async function processCaseStudy(personName: string, companyName: string, cofounders: string[] = []) {
  try {
    console.log(`🚀 Processing: ${personName} at ${companyName}`);
    
    // Handle multiple cofounders
    const allFounders = [personName];
    if (cofounders && cofounders.length > 0) {
      allFounders.push(...cofounders);
    }
    
    const foundersText = allFounders.length > 1 
      ? `${personName} and ${cofounders?.join(', ') || ''}`
      : personName;

    // Build prompt
    const prompt = CASE_STUDY_PROMPT
      .replace(/\{\{person_name\}\}/g, foundersText)
      .replace(/\{\{company_name\}\}/g, companyName);

    // Call OpenAI
    const openaiResponse = await openaiService.generateStructuredOutput({
      prompt,
      schema: CASE_STUDY_SCHEMA,
      model: 'gpt-4o-mini',
      temperature: 0.7
    });

    if (!openaiResponse.success || !openaiResponse.data) {
      throw new Error(`OpenAI API error: ${openaiResponse.error}`);
    }

    // Validate JSON response
    const validation = validateCaseStudyData(openaiResponse.data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const caseStudyData = openaiResponse.data;

    // Generate unique slug
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

    // Save to database
    const { data: caseStudy, error: caseStudyError } = await supabaseAdmin
      .from('case_studies')
      .upsert({
        slug: finalSlug,
        title: caseStudyData.title,
        subtitle: caseStudyData.subtitle,
        category: caseStudyData.category,
        cover_image_url: null, // No logo for bulk generation
        current_revenue: formatMonetaryValue(caseStudyData.current_revenue),
        valuation: formatMonetaryValue(caseStudyData.valuation),
        starting_income: formatMonetaryValue(caseStudyData.starting_income),
        lifetime_revenue: formatMonetaryValue(caseStudyData.current_revenue),
        users_count: caseStudyData.users_count,
        market_context: caseStudyData.competitors?.join(', ') || '',
        raw_output: caseStudyData,
        sources: caseStudyData.sources || [],
        confidence: caseStudyData.confidence,
        company_url: caseStudyData.company_url || '',
        founder_name: foundersText,
        app_name: companyName
      })
      .select()
      .single();

    if (caseStudyError) {
      throw new Error(`Database error: ${caseStudyError.message}`);
    }

    const caseStudyId = caseStudy.id;

    // Insert sections
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
        console.error(`❌ Error saving sections for ${personName}:`, sectionsError);
      }
    }

    // Insert funding rounds
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
        console.error(`❌ Error saving funding for ${personName}:`, fundingError);
      }
    }

    // Insert quotes
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
        console.error(`❌ Error saving quotes for ${personName}:`, quotesError);
      }
    }

    // Insert tags
    if (caseStudyData.tags && caseStudyData.tags.length > 0) {
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

        const caseStudyTagsData = tagIds.map(tagId => ({
          case_study_id: caseStudyId,
          tag_id: tagId
        }));

        const { error: tagsError } = await supabaseAdmin
          .from('case_study_tags')
          .insert(caseStudyTagsData);

        if (tagsError) {
          console.error(`❌ Error saving tags for ${personName}:`, tagsError);
        }
      }
    }

    console.log(`✅ Successfully processed: ${personName} at ${companyName} (ID: ${caseStudyId})`);
    return { success: true, id: caseStudyId, slug: finalSlug, title: caseStudyData.title };

  } catch (error) {
    console.error(`❌ Error processing ${personName} at ${companyName}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      personName,
      companyName
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('csvFile') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'No CSV file provided'
      }, { status: 400 });
    }

    // Read and parse CSV file
    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({
        success: false,
        message: 'CSV file must have at least a header row and one data row'
      }, { status: 400 });
    }

    // Helper function to parse CSV row properly (handles quoted fields with commas)
    function parseCSVRow(row: string): string[] {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    }

    // Parse CSV header and data
    const headers = parseCSVRow(lines[0]).map(h => h.trim().toLowerCase());
    const dataRows = lines.slice(1);

    // Validate headers
    const requiredHeaders = ['person_name', 'company_name'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    
    if (missingHeaders.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Missing required headers: ${missingHeaders.join(', ')}`
      }, { status: 400 });
    }

    const results = [];
    const totalRows = dataRows.length;

    console.log(`📊 Starting bulk processing of ${totalRows} case studies...`);

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      const row = parseCSVRow(dataRows[i]);
      
      if (row.length < 2) {
        console.log(`⚠️ Skipping empty row ${i + 1}`);
        continue; // Skip empty rows
      }

      const personName = row[headers.indexOf('person_name')];
      const companyName = row[headers.indexOf('company_name')];
      const cofounders = row[headers.indexOf('cofounders')] 
        ? row[headers.indexOf('cofounders')].split(',').map(name => name.trim()).filter(name => name)
        : [];

      if (!personName || !companyName) {
        console.log(`⚠️ Skipping row ${i + 1}: missing required data (person: ${personName}, company: ${companyName})`);
        continue; // Skip rows with missing required data
      }

      console.log(`📝 Processing ${i + 1}/${totalRows}: ${personName} at ${companyName}${cofounders.length > 0 ? ` (cofounders: ${cofounders.join(', ')})` : ''}`);
      
      const result = await processCaseStudy(personName, companyName, cofounders);
      results.push(result);

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`🎉 Bulk processing complete! ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Bulk processing complete! ${successful} successful, ${failed} failed`,
      data: {
        total: totalRows,
        successful,
        failed,
        results
      }
    });

  } catch (error) {
    console.error('❌ Error in bulk case study generation:', error);
    return NextResponse.json({
      success: false,
      message: 'Bulk processing failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
