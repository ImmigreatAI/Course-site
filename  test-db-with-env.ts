// test-db-with-env.ts
// import { config } from 'dotenv'
// import { resolve } from 'path'

// Load environment variables
//config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

async function testDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('Environment check:')
  console.log('- URL:', supabaseUrl)
  console.log('- Has Service Key:', !!supabaseKey)
  console.log('- URL format valid:', supabaseUrl?.startsWith('https://'))

  if (!supabaseUrl || !supabaseKey) {
    console.error('\n❌ Missing environment variables!')
    console.error('Please check your .env.local file')
    return
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    console.log('\n📊 Testing database connection...')
    
    // Test users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .single()
    
    if (usersError) {
      console.error('❌ Users table error:', usersError.message)
    } else {
      console.log('✅ Users table exists')
    }

    // Test other tables
    const tables = ['purchases', 'purchase_items', 'enrollments']
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('count')
        .single()
      
      if (error) {
        console.error(`❌ ${table} table error:`, error.message)
      } else {
        console.log(`✅ ${table} table exists`)
      }
    }

  } catch (err) {
    console.error('\n❌ Connection error:', err)
  }
}

testDatabase()