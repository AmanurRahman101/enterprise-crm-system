import React, { useState } from 'react'
import { Link } from 'react-router'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gray-950/95 backdrop-blur-xl shadow-2xl z-50 border-b border-teal-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-lg">Tawassul</span>
            <span className="text-2xl font-light text-gray-300 ml-1">CRM</span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-300 hover:text-teal-400 transition-all">
              Home
            </Link>
            <Link to="/features" className="text-gray-300 hover:text-teal-400 transition-all">
              Features
            </Link>
            <Link to="/pricing" className="text-gray-300 hover:text-teal-400 transition-all">
              Pricing
            </Link>
            <Link to="/about" className="text-gray-300 hover:text-teal-400 transition-all">
              About
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <Link 
                to="/auth/signin" 
                className="px-4 py-2 text-teal-400 hover:text-teal-300 transition-all font-medium"
              >
                Sign In
              </Link>
              <Link 
                to="/auth/signup" 
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg hover:shadow-lg hover:shadow-teal-500/50 transition-all font-medium transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-300 hover:text-teal-400 hover:bg-gray-800/50 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-950/98 backdrop-blur-xl border-t border-teal-500/20 py-4 animate-fade-in">
          <div className="px-4 space-y-3">
            <Link to="/" className="block text-gray-300 hover:text-teal-400 transition-all py-2 px-3 rounded-lg hover:bg-gray-700/50">
              Home
            </Link>
            <Link to="/features" className="block text-gray-300 hover:text-teal-400 transition-all py-2 px-3 rounded-lg hover:bg-gray-700/50">
              Features
            </Link>
            <Link to="/pricing" className="block text-gray-300 hover:text-teal-400 transition-all py-2 px-3 rounded-lg hover:bg-gray-700/50">
              Pricing
            </Link>
            <Link to="/about" className="block text-gray-300 hover:text-teal-400 transition-all py-2 px-3 rounded-lg hover:bg-gray-700/50">
              About
            </Link>
            <div className="pt-2 space-y-2">
              <Link to="/auth/signin" className="block text-center text-teal-400 hover:text-teal-300 transition-all py-2 px-3 rounded-lg hover:bg-gray-700/50 font-medium">
                Sign In
              </Link>
              <Link to="/auth/signup" className="block text-center bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-2 px-3 rounded-lg hover:shadow-lg hover:shadow-teal-500/50 transition-all font-medium">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
