//components/Navbar.tsx
'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser, useClerk, SignInButton } from '@clerk/nextjs'
import { 
  GraduationCap, 
  LogOut,
  BookOpen,
  Phone,
  Info,
  Menu,
  X
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CartIcon } from '@/components/CartIcon'
import { CartDropdown } from '@/components/CartDropdown'

export function Navbar() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  
  const handleLogout = async () => {
    await signOut()
    router.push('/')
    setIsProfileOpen(false)
    setIsMobileMenuOpen(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Close profile dropdown if clicking outside
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false)
      }
      
      // Close mobile menu if clicking outside (but not on the hamburger button)
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        const hamburgerButton = document.querySelector('[data-hamburger-button]')
        if (hamburgerButton && !hamburgerButton.contains(target)) {
          setIsMobileMenuOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Prevent body scroll when mobile menu or cart is open
  useEffect(() => {
    const shouldLockScroll = isMobileMenuOpen || isCartOpen
    
    if (shouldLockScroll) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen, isCartOpen])

  return (
    <>
      <header className="fixed top-4 left-4 right-4 z-50">
        <div className="mx-auto max-w-6xl backdrop-blur-3xl bg-gradient-to-r from-purple-50/20 via-white/30 to-purple-50/20 border border-purple-200/40 rounded-full shadow-lg shadow-purple-100/50 hover:shadow-xl hover:shadow-purple-200/40 hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            
            {/* Left Side - Logo */}
            <Link 
              href="/" 
              className="text-xl sm:text-2xl font-bold text-gray-900 hover:text-purple-700 transition-colors duration-200 truncate font-[family-name:var(--font-pacifico)]"
            >
              immigreat.ai
            </Link>

            {/* Center - Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
              <Link href="/courses">
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-purple-50/50 font-medium transition-all duration-200 hover:scale-105"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Courses</span>
                </Button>
              </Link>
              <Link href="/contact">
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-purple-50/50 font-medium transition-all duration-200 hover:scale-105"
                >
                  <Phone className="h-4 w-4" />
                  <span>Contact</span>
                </Button>
              </Link>
              <Link href="/about">
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-purple-50/50 font-medium transition-all duration-200 hover:scale-105"
                >
                  <Info className="h-4 w-4" />
                  <span>About</span>
                </Button>
              </Link>
            </nav>

            {/* Right Side - Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Shopping Cart with Dropdown */}
              <div className="relative">
                <CartIcon onClick={() => setIsCartOpen(!isCartOpen)} />
                {isCartOpen && <CartDropdown isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-gray-600 hover:text-gray-900 hover:bg-purple-50/50 rounded-full w-9 h-9 sm:w-10 sm:h-10 transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                data-hamburger-button
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>

              {/* Auth & Profile */}
              {!isLoaded ? (
                <div className="h-9 w-16 sm:h-10 sm:w-20 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-full" />
              ) : !isSignedIn ? (
                <SignInButton mode="modal">
                  <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-3 sm:px-6 text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg">
                    Log In
                  </Button>
                </SignInButton>
              ) : (
                <div className="relative" ref={profileRef}>
                  {/* Profile Avatar */}
                  <div className="relative group">
                    <Avatar 
                      className="h-9 w-9 sm:h-10 sm:w-10 cursor-pointer hover:ring-2 hover:ring-purple-300 hover:ring-offset-2 transition-all duration-200 hover:scale-110"
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                    >
                      <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white font-semibold text-xs sm:text-sm">
                        {getInitials(user.fullName || user.username || 'U')}
                      </AvatarFallback>
                    </Avatar>

                    {/* Hover tooltip - Hidden on mobile */}
                    <div className="hidden sm:block absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {user.fullName || user.username}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                    </div>
                  </div>
                  
                  {/* Profile Popup */}
                  {isProfileOpen && (
                    <div className={`absolute right-0 top-12 w-72 sm:w-80 z-[100] bg-white/95 backdrop-blur-xl border border-purple-200/60 rounded-2xl shadow-2xl shadow-purple-100/50 
                      ${isProfileOpen ? 'animate-in slide-in-from-top-2 fade-in-0 zoom-in-95 duration-200' : 'animate-out slide-out-to-top-2 fade-out-0 zoom-out-95 duration-150'}`}>
                      
                      {/* Profile Header */}
                      <div className="p-4 border-b border-purple-100/60">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12 ring-2 ring-purple-100">
                            <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white font-semibold">
                              {getInitials(user.fullName || user.username || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {user.fullName || user.username}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user.primaryEmailAddress?.emailAddress}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="p-2">
                        <Link href="/my-courses" onClick={() => setIsProfileOpen(false)}>
                          <div className="flex items-center px-3 py-2.5 rounded-xl cursor-pointer hover:bg-purple-50 transition-all duration-200 group hover:translate-x-1">
                            <GraduationCap className="mr-3 h-4 w-4 text-purple-600 group-hover:scale-110 transition-transform duration-200" />
                            <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900">My Courses</span>
                          </div>
                        </Link>
                        
                        <div className="my-2 border-t border-purple-100/60"></div>
                        
                        <div 
                          className="flex items-center px-3 py-2.5 rounded-xl cursor-pointer hover:bg-red-50 transition-all duration-200 text-red-600 group hover:translate-x-1"
                          onClick={handleLogout}
                        >
                          <LogOut className="mr-3 h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                          <span className="text-sm font-medium group-hover:text-red-700">Logout</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in-0 duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Mobile Menu */}
          <div 
            ref={mobileMenuRef}
            className={`fixed top-24 left-4 right-4 bg-white/95 backdrop-blur-xl border border-purple-200/60 rounded-2xl shadow-2xl shadow-purple-100/50 overflow-hidden
              ${isMobileMenuOpen ? 'animate-in slide-in-from-top-4 fade-in-0 zoom-in-95 duration-300' : 'animate-out slide-out-to-top-4 fade-out-0 zoom-out-95 duration-200'}`}
          >
            {/* Navigation Items */}
            <div className="p-4 space-y-2">
              <Link href="/courses" onClick={closeMobileMenu}>
                <div className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-purple-50 transition-all duration-200 group">
                  <BookOpen className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-base font-medium text-gray-700 group-hover:text-gray-900">Courses</span>
                </div>
              </Link>
              
              <Link href="/contact" onClick={closeMobileMenu}>
                <div className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-purple-50 transition-all duration-200 group">
                  <Phone className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-base font-medium text-gray-700 group-hover:text-gray-900">Contact</span>
                </div>
              </Link>
              
              <Link href="/about" onClick={closeMobileMenu}>
                <div className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-purple-50 transition-all duration-200 group">
                  <Info className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-base font-medium text-gray-700 group-hover:text-gray-900">About</span>
                </div>
              </Link>

              {/* Mobile Auth Section */}
              {isSignedIn && (
                <>
                  <div className="my-4 border-t border-purple-100/60"></div>
                  
                  <Link href="/my-courses" onClick={closeMobileMenu}>
                    <div className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-purple-50 transition-all duration-200 group">
                      <GraduationCap className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-base font-medium text-gray-700 group-hover:text-gray-900">My Courses</span>
                    </div>
                  </Link>
                  
                  <div 
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-all duration-200 text-red-600 group cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-base font-medium group-hover:text-red-700">Logout</span>
                  </div>
                </>
              )}
              
              {!isSignedIn && (
                <>
                  <div className="my-4 border-t border-purple-100/60"></div>
                  <div className="px-4">
                    <SignInButton mode="modal">
                      <Button 
                        className="w-full bg-black text-white hover:bg-gray-800 rounded-xl py-3 transition-all duration-200 hover:scale-105"
                        onClick={closeMobileMenu}
                      >
                        Log In
                      </Button>
                    </SignInButton>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}