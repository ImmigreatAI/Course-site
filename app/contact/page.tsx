import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, Users, Globe } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-6">
            Get in Touch
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Ready to start your immigration journey? We're here to guide you every step of the way. 
            Reach out to our expert team for personalized assistance.
          </p>
        </div>

      </div>
    </div>
  );
}