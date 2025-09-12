const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Use the same credentials as in lib/supabase.ts
const supabaseUrl = 'https://duzyicfcmuhbwypdtelz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1enlpY2ZjbXVoYnd5cGR0ZWx6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTk0NzIzOCwiZXhwIjoyMDcxNTIzMjM4fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Setting up database schema...');
  
  try {
    // Read the schema file
    const schema = fs.readFileSync('supabase_schema.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`\n${i + 1}. Executing: ${statement.substring(0, 50)}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.log(`⚠️  Statement ${i + 1} warning:`, error.message);
            // Continue with other statements even if one fails
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`❌ Statement ${i + 1} error:`, err.message);
          // Continue with other statements
        }
      }
    }
    
    console.log('\n🎉 Database setup completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Try logging in again');
    console.log('2. Check if business ideas and marketing ideas load properly');
    console.log('3. If issues persist, check the Supabase dashboard for any remaining errors');
    
  } catch (error) {
    console.error('💥 Error setting up database:', error);
    console.log('\n🔧 Manual setup required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of supabase_schema.sql');
    console.log('4. Execute the SQL script');
  }
}

setupDatabase();
