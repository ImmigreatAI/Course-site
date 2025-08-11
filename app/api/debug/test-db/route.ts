// Create: app/api/debug/test-db/route.ts

import { databaseService } from '@/lib/services/database.service'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  console.log('🔧 === DATABASE CONNECTION TEST ===')
  
  try {
    // 1. Check environment variables
    const envCheck = {
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌',
      SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌'
    }
    
    console.log('Environment Variables:', envCheck)
    
    // 2. Test direct Supabase connection
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const directClient = createClient(supabaseUrl, supabaseAnonKey)
    
    // 3. Test basic query
    const { data: testData, error: testError } = await directClient
      .from('users')
      .select('clerk_user_id, email')
      .limit(5)
    
    console.log('Direct client test:', { testData, testError })
    
    // 4. Test your specific user
    const testClerkId = 'user_30sXzQMonc16u3QTmJZXujRhb2H'
    
    const { data: specificUser, error: specificError } = await directClient
      .from('users')
      .select('*')
      .eq('clerk_user_id', testClerkId)
      .single()
    
    console.log('Specific user test:', { specificUser, specificError })
    
    // 5. Test through your service
    const serviceUser = await databaseService.getUserByClerkId(testClerkId)
    console.log('Service test result:', serviceUser)
    
    // 6. Compare results
    const comparison = {
      directQuery: specificUser,
      serviceQuery: serviceUser,
      match: JSON.stringify(specificUser) === JSON.stringify(serviceUser)
    }
    
    console.log('Comparison:', comparison)
    
    return Response.json({
      success: true,
      envCheck,
      directTest: { data: testData, error: testError },
      specificTest: { data: specificUser, error: specificError },
      serviceTest: serviceUser,
      comparison
    })
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

// Visit: http://localhost:3000/api/debug/test-db to run this test