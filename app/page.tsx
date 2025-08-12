// app/page.tsx
// ============================================
// Responsive minimalist home page with a11y & design fixes
// Fix: guard all window access for SSR, remove styled-jsx dependency that could
// trigger "Cannot read properties of null (reading '_')" in some setups.
// Added tiny runtime tests for the breakpoint logic.

'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, BookOpen, Clock, BarChart3, DollarSign, Star, ChevronLeft, ChevronRight } from 'lucide-react'

// small dev-only component to run assertions without exporting anything from the page
function DevAsserts() {
  useEffect(() => {
    try {
      console.assert(slidesPerViewFromWidth(360) === 1, 'slidesPerViewFromWidth(360) should be 1')
      console.assert(slidesPerViewFromWidth(800) === 2, 'slidesPerViewFromWidth(800) should be 2')
      console.assert(slidesPerViewFromWidth(1200) === 3, 'slidesPerViewFromWidth(1200) should be 3')
    } catch (e) {
      console.error('Breakpoint tests failed', e)
    }
  }, [])
  return null
}

// --- pure util for tests & hook
function slidesPerViewFromWidth(w: number): 1 | 2 | 3 {
  if (w >= 1024) return 3
  if (w >= 768) return 2
  return 1
}

// --- hook to read responsive breakpoints safely in SSR
function useSlidesPerView() {
  const [spv, setSpv] = useState<1 | 2 | 3>(1) // never reference window during initial render

  useEffect(() => {
    if (typeof window === 'undefined') return
    const compute = () => setSpv(slidesPerViewFromWidth(window.innerWidth))
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  return spv
}

function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="relative w-4 h-4 mr-0.5">
          <Star
            className={`absolute inset-0 w-4 h-4 ${i < full ? 'text-yellow-400' : 'text-gray-300'}`}
            aria-hidden
            fill={i < full ? 'currentColor' : 'none'}
          />
          {half && i === full && (
            <Star
              className="absolute inset-0 w-4 h-4 text-yellow-400"
              aria-hidden
              fill="currentColor"
              // inline style to avoid styled-jsx; clip to half
              style={{ clipPath: 'inset(0 50% 0 0)' }}
            />
          )}
        </div>
      ))}
      <span className="ml-2 text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
    </div>
  )
}

function TestimonialCarousel() {
  const testimonials = [
    {
      name: 'Sarah Chen',
      location: 'San Francisco, CA',
      rating: 4.5,
      content:
        'The EB-1A course was incredibly detailed and helped me understand exactly what I needed for my petition. The step-by-step guidance made the complex process manageable.',
    },
    {
      name: 'Ahmed Hassan',
      location: 'Austin, TX',
      rating: 4.5,
      content:
        'immigreat.ai provided the clarity I needed for my green card journey. The courses are well-structured and the content is always up-to-date with current policies.',
    },
    {
      name: 'Maria Rodriguez',
      location: 'Miami, FL',
      rating: 4.5,
      content:
        'As someone who was completely new to the immigration process, these courses gave me the confidence to navigate my application successfully. Highly recommended!',
    },
    {
      name: 'David Rodriguez',
      location: 'Miami, FL',
      rating: 4.5,
      content:
        'As someone who was completely new to the immigration process, these courses gave me the confidence to navigate my application successfully.',
    },
    {
      name: 'Lisa Wang',
      location: 'Seattle, WA',
      rating: 4.5,
      content:
        'The comprehensive coverage and practical examples helped me prepare my documents efficiently. The course structure is excellent.',
    },
  ]

  // responsive slides per view
  const itemsPerSlide = useSlidesPerView()

  const totalSlides = useMemo(
    () => Math.max(1, Math.ceil(testimonials.length / itemsPerSlide)),
    [testimonials.length, itemsPerSlide]
  )
  const [currentSlide, setCurrentSlide] = useState(0)

  // keep currentSlide in range when itemsPerSlide changes (e.g., on resize)
  useEffect(() => {
    setCurrentSlide((prev) => Math.min(prev, totalSlides - 1))
  }, [totalSlides])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  const goToSlide = (i: number) => setCurrentSlide(i)

  return (
    <section
      className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-20 overflow-hidden"
      role="region"
      aria-labelledby="testimonials-heading"
    >
      {/* Background glows */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-400 -translate-x-48 -translate-y-48 rotate-45 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-400 to-indigo-400 translate-x-48 translate-y-48 -rotate-45 animate-pulse" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-br from-indigo-400 to-purple-400 -translate-y-32 rotate-12 opacity-60" />
        <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-gradient-to-br from-pink-400 to-purple-400 translate-y-16 -rotate-12 opacity-40" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 id="testimonials-heading" className="text-3xl md:text-4xl font-bold text-white mb-2">
            Trusted by Thousands of
          </h2>
          <h3 className="text-2xl md:text-3xl font-semibold text-purple-200">Happy Customers</h3>
        </div>

        {/* Track */}
        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                <div key={slideIndex} className="w-full flex-shrink-0">
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {testimonials
                      .slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide)
                      .map((t, idx) => (
                        <Card
                          key={`${slideIndex}-${idx}`}
                          className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] h-full"
                        >
                          <CardContent className="p-6 h-full flex flex-col">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                {t.name.charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-gray-900 text-lg truncate">{t.name}</h4>
                                <p className="text-gray-500 text-sm truncate">{t.location}</p>
                                <div className="mt-2">
                                  <RatingStars rating={t.rating} />
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-700 leading-relaxed line-clamp-6 sm:line-clamp-5 md:line-clamp-4 lg:line-clamp-6">“{t.content}”</p>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nav Arrows */}
          <Button
            onClick={prevSlide}
            variant="outline"
            size="icon"
            aria-label="Previous testimonials"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-8 rounded-full border-white/30 hover:border-white hover:bg-white/20 bg-white/10 text-white shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 focus-visible:ring-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            onClick={nextSlide}
            variant="outline"
            size="icon"
            aria-label="Next testimonials"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-8 rounded-full border-white/30 hover:border-white hover:bg-white/20 bg-white/10 text-white shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 focus-visible:ring-white"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Dots */}
          <div className="flex justify-center gap-3 mt-8">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === currentSlide}
                className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 ${
                  i === currentSlide ? 'bg-white shadow-lg' : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Your Path to
            <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Immigration Success
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Expert-curated courses designed to guide you through your green card journey with confidence and clarity.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/courses">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl px-8 py-4 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <BookOpen className="w-5 h-5 mr-2" />
                Browse Courses
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/about">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 rounded-xl px-8 py-4 text-lg font-medium transition-all duration-300 hover:scale-105"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose immigreat.ai?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We make immigration education accessible, practical, and effective for your self-paced journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Self-Paced */}
          <Card className="backdrop-blur-xl bg-white/60 border border-purple-200/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mx-auto mb-4">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Self-Paced</h3>
              <p className="text-gray-600 leading-relaxed">Learn at your own pace with flexible scheduling that fits your busy lifestyle.</p>
            </CardContent>
          </Card>

          {/* In-Depth */}
          <Card className="backdrop-blur-xl bg-white/60 border border-purple-200/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">In-Depth & Detailed</h3>
              <p className="text-gray-600 leading-relaxed">Comprehensive coverage of every aspect with detailed explanations and practical examples.</p>
            </CardContent>
          </Card>

          {/* Data-Backed */}
          <Card className="backdrop-blur-xl bg-white/60 border border-purple-200/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Data-Backed</h3>
              <p className="text-gray-600 leading-relaxed">Content based on real success stories and current immigration data and trends.</p>
            </CardContent>
          </Card>

          {/* Affordable */}
          <Card className="backdrop-blur-xl bg-white/60 border border-purple-200/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Affordable Plans</h3>
              <p className="text-gray-600 leading-relaxed">Cost-effective pricing options to support your immigration journey without breaking the bank.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialCarousel />

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="backdrop-blur-xl bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-200/40 shadow-2xl shadow-purple-100/50">
          <CardContent className="p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Ready to Start Your Journey?</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of successful applicants who have achieved their immigration goals with our comprehensive courses.
            </p>
            <Link href="/courses">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl px-10 py-4 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <BookOpen className="w-5 h-5 mr-2" />
                Explore Courses
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
