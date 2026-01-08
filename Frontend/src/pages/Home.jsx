import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import ApiService from '../services/api'

const Home = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is already logged in
    const token = ApiService.getToken()
    const user = ApiService.getUser()
    
    if (token && user) {
      // User is logged in - redirect to client portal (default)
      navigate('/dashboard/client')
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Hero Section */}
      <section className="px-6 py-20 text-center animate-fade-in-up">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-100 mb-6 drop-shadow-2xl">
            Welcome to <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-lg">Tawassul CRM</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Manage your customer relationships effortlessly. Connect with your customers, 
            track interactions, and grow your business with our powerful multi-tenant CRM platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/auth/signup" 
              className="px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg font-semibold hover:shadow-2xl hover:shadow-teal-500/50 transition-all transform hover:-translate-y-1"
            >
              Get Started
            </Link>
            <Link 
              to="/auth/signin" 
              className="px-8 py-3 bg-gray-900/70 backdrop-blur-xl border-2 border-teal-500 text-teal-400 rounded-lg font-semibold hover:bg-gray-800/80 hover:border-teal-400 transition-all transform hover:-translate-y-1"
            >
              Sign In
            </Link>
          </div>

            <div className="mt-6 text-sm text-gray-400">
            <p>Already have an account?{' '}
              <Link to="/auth/signin" className="text-teal-400 hover:text-teal-300 hover:underline font-medium transition-colors">
                Sign In
              </Link>
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Use the same login for both Internal Users (Organization Dashboard) and Client Portal access
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16 bg-gradient-to-b from-gray-950 to-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-100 mb-12">
            Why Choose Tawassul CRM?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-900/70 backdrop-blur-xl border border-teal-500/20 rounded-xl shadow-2xl shadow-teal-500/10 p-6 hover:shadow-teal-500/30 hover:border-teal-500/40 transition-all transform hover:-translate-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-teal-500/50">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-2">Multi-Tenant Architecture</h3>
              <p className="text-gray-300">
                Customers can belong to multiple companies. Seamlessly manage relationships across organizations.
              </p>
            </div>

            <div className="bg-gray-900/70 backdrop-blur-xl border border-teal-500/20 rounded-xl shadow-2xl shadow-teal-500/10 p-6 hover:shadow-teal-500/30 hover:border-teal-500/40 transition-all transform hover:-translate-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-teal-500/50">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-2">Secure Authentication</h3>
              <p className="text-gray-300">
                JWT-based authentication ensures your data is protected. Unified authentication with organization-aware access control.
              </p>
            </div>

            <div className="bg-gray-900/70 backdrop-blur-xl border border-teal-500/20 rounded-xl shadow-2xl shadow-teal-500/10 p-6 hover:shadow-teal-500/30 hover:border-teal-500/40 transition-all transform hover:-translate-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-teal-500/50">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-2">Powerful Dashboard</h3>
              <p className="text-gray-300">
                Get insights at a glance. Customized dashboards for companies and customers with role-based access.
              </p>
            </div>

            <div className="bg-gray-900/70 backdrop-blur-xl border border-teal-500/20 rounded-xl shadow-2xl shadow-teal-500/10 p-6 hover:shadow-teal-500/30 hover:border-teal-500/40 transition-all transform hover:-translate-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-teal-500/50">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-2">Future Integrations</h3>
              <p className="text-gray-300">
                Ready for Jira, VoIP, Gmail API, and Telegram chatbot integrations. Expandable architecture for growth.
              </p>
            </div>

            <div className="bg-gray-900/70 backdrop-blur-xl border border-teal-500/20 rounded-xl shadow-2xl shadow-teal-500/10 p-6 hover:shadow-teal-500/30 hover:border-teal-500/40 transition-all transform hover:-translate-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-teal-500/50">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-2">Mobile Ready</h3>
              <p className="text-gray-300">
                Backend designed to support both web and Android applications. One API for all platforms.
              </p>
            </div>

            <div className="bg-gray-900/70 backdrop-blur-xl border border-teal-500/20 rounded-xl shadow-2xl shadow-teal-500/10 p-6 hover:shadow-teal-500/30 hover:border-teal-500/40 transition-all transform hover:-translate-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-teal-500/50">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-2">Fast & Lightweight</h3>
              <p className="text-gray-300">
                Built with React and Express.js for optimal performance. Clean code and beginner-friendly structure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 bg-gradient-to-r from-teal-600 to-emerald-600 shadow-2xl shadow-teal-500/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
            Ready to Transform Your Customer Relationships?
          </h2>
          <p className="text-xl text-teal-100 mb-8">
            Join hundreds of companies and customers already using Tawassul CRM.
          </p>
          <Link 
            to="/auth/signup" 
            className="inline-block px-8 py-3 bg-white text-teal-600 rounded-lg font-semibold hover:bg-gray-100 hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
