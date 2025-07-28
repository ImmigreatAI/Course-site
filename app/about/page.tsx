import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Eye, 
  Heart, 
  Users, 
  Globe, 
  Award, 
  BookOpen, 
  Shield, 
  CheckCircle,
  Star,
  Calendar,
  TrendingUp
} from 'lucide-react';

export default function AboutPage() {
  const stats = [
    { number: '10,000+', label: 'Successful Cases', icon: CheckCircle },
    { number: '50+', label: 'Countries Served', icon: Globe },
    { number: '15+', label: 'Years Experience', icon: Calendar },
    { number: '98%', label: 'Success Rate', icon: TrendingUp },
  ];

  const teamMembers = [
    {
      name: 'Sarah Chen',
      role: 'CEO & Lead Immigration Consultant',
      image: '/team/sarah.jpg',
      initials: 'SC',
      bio: 'With 15+ years in immigration law, Sarah has helped thousands achieve their dreams of living abroad.',
      specialties: ['Business Visas', 'Family Reunification', 'Investor Programs']
    },
    {
      name: 'Michael Rodriguez',
      role: 'Senior Visa Specialist',
      image: '/team/michael.jpg',
      initials: 'MR',
      bio: 'Michael specializes in student visas and skilled worker programs across North America and Europe.',
      specialties: ['Student Visas', 'Work Permits', 'Express Entry']
    },
    {
      name: 'Dr. Priya Patel',
      role: 'Legal Affairs Director',
      image: '/team/priya.jpg',
      initials: 'PP',
      bio: 'Former immigration officer with deep knowledge of policy changes and legal requirements.',
      specialties: ['Legal Compliance', 'Policy Analysis', 'Complex Cases']
    },
    {
      name: 'James Wilson',
      role: 'Client Relations Manager',
      image: '/team/james.jpg',
      initials: 'JW',
      bio: 'Ensures every client receives personalized attention and support throughout their journey.',
      specialties: ['Client Support', 'Case Management', 'Document Review']
    }
  ];

  const values = [
    {
      icon: Heart,
      title: 'Compassionate Service',
      description: 'We understand that immigration is deeply personal. Every client receives empathetic, personalized support tailored to their unique situation.'
    },
    {
      icon: Shield,
      title: 'Ethical Excellence',
      description: 'We maintain the highest ethical standards, providing honest advice and transparent processes without false promises.'
    },
    {
      icon: BookOpen,
      title: 'Continuous Learning',
      description: 'Immigration laws evolve constantly. We stay ahead of changes to provide the most current and effective strategies.'
    },
    {
      icon: Users,
      title: 'Collaborative Approach',
      description: 'Success comes from teamwork. We partner with clients, legal experts, and institutions to achieve the best outcomes.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-6">
            About Immigreat.ai
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Empowering dreams through expert immigration guidance. We're not just consultants—
            we're your partners in building a brighter future across borders.
          </p>
        </div>



      </div>
    </div>
  );
}