// test-db.ts
import { createAdminClient } from './lib/supabase/admin'

async function testDatabase() {
  const supabase = createAdminClient()
  
  // Test users table exists
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Success! Users table exists')
    console.log('Sample data:', data)
  }
}

testDatabase()