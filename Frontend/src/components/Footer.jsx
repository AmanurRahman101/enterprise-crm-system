import React from 'react'
import { Link } from 'react-router'

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-950 to-black text-gray-300 border-t border-teal-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center mb-4">
              <span className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-lg">Tawassul</span>
              <span className="text-2xl font-light text-gray-400 ml-1">CRM</span>
            </div>
            <p className="text-sm text-gray-400">
              Multi-tenant CRM system for modern businesses. Manage customers, track interactions, and grow together.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-teal-400 font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/features" className="text-gray-400 hover:text-teal-300 transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="text-gray-400 hover:text-teal-300 transition-colors">Pricing</Link></li>
              <li><Link to="/integrations" className="text-gray-400 hover:text-teal-300 transition-colors">Integrations</Link></li>
              <li><Link to="/updates" className="text-gray-400 hover:text-teal-300 transition-colors">What's New</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-teal-400 font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-gray-400 hover:text-teal-300 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-teal-300 transition-colors">Contact</Link></li>
              <li><Link to="/careers" className="text-gray-400 hover:text-teal-300 transition-colors">Careers</Link></li>
              <li><Link to="/blog" className="text-gray-400 hover:text-teal-300 transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-teal-400 font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/help" className="text-gray-400 hover:text-teal-300 transition-colors">Help Center</Link></li>
              <li><Link to="/docs" className="text-gray-400 hover:text-teal-300 transition-colors">Documentation</Link></li>
              <li><Link to="/api" className="text-gray-400 hover:text-teal-300 transition-colors">API Reference</Link></li>
              <li><Link to="/status" className="text-gray-400 hover:text-teal-300 transition-colors">System Status</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Tawassul CRM. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link to="/privacy" className="text-sm text-gray-400 hover:text-teal-300 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-gray-400 hover:text-teal-300 transition-colors">
              Terms of Service
            </Link>
            <Link to="/cookies" className="text-sm text-gray-400 hover:text-teal-300 transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
