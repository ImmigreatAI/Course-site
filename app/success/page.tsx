'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface SessionData {
  id: string;
  // Add other session properties as needed
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState<boolean>(true);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  useEffect(() => {
    if (sessionId) {
      // Optionally fetch session details for display
      setLoading(false);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing your enrollment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for your purchase! You've been successfully enrolled in the course. 
          You should receive a confirmation email shortly with access details.
        </p>
        
        <div className="space-y-3">
          <Link 
            href="/"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
          
          <p className="text-sm text-gray-500">
            Session ID: {sessionId}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}