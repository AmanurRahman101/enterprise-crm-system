import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const Analytics = () => {
  const [analytics, setAnalytics] = useState({
    totalCustomers: 0,
    totalLeads: 0,
    convertedLeads: 0,
    conversionRate: 0,
    leadsByStatus: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/rpc/getCompanyAnalytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setAnalytics(data.analytics)
      } else {
        toast.error(data.message || 'Failed to fetch analytics')
      }
    } catch (error) {
      toast.error('Error loading analytics')
      console.error('Analytics error:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    qualified: 'bg-purple-100 text-purple-800',
    proposal: 'bg-indigo-100 text-indigo-800',
    negotiation: 'bg-orange-100 text-orange-800',
    converted: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">Business insights and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs md:text-sm font-medium text-gray-600">Total Customers</h3>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{analytics.totalCustomers}</div>
          <div className="text-xs md:text-sm text-green-600">Active relationships</div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs md:text-sm font-medium text-gray-600">Total Leads</h3>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{analytics.totalLeads}</div>
          <div className="text-xs md:text-sm text-gray-500">In pipeline</div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs md:text-sm font-medium text-gray-600">Converted Leads</h3>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{analytics.convertedLeads}</div>
          <div className="text-xs md:text-sm text-gray-500">Success stories</div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs md:text-sm font-medium text-gray-600">Conversion Rate</h3>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{analytics.conversionRate}%</div>
          <div className="text-xs md:text-sm text-gray-500">Lead to customer</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Leads by Status</h3>
        {analytics.leadsByStatus.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {analytics.leadsByStatus.map((item) => (
              <div key={item.status} className="border border-gray-200 rounded-lg p-3 md:p-4">
                <div className={`inline-block px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium mb-2 ${statusColors[item.status]}`}>
                  {item.status}
                </div>
                <div className="text-xl md:text-2xl font-bold text-gray-900">{item.count}</div>
                <div className="text-xs md:text-sm text-gray-500">
                  {((item.count / analytics.totalLeads) * 100).toFixed(1)}% of total
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No leads data available yet
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Performance Summary</h3>
          <div className="space-y-3 md:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm md:text-base text-gray-600">Active Customers</span>
              <span className="text-base md:text-lg font-semibold text-gray-900">{analytics.totalCustomers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm md:text-base text-gray-600">Total Leads</span>
              <span className="text-base md:text-lg font-semibold text-gray-900">{analytics.totalLeads}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm md:text-base text-gray-600">Successful Conversions</span>
              <span className="text-base md:text-lg font-semibold text-green-600">{analytics.convertedLeads}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm md:text-base text-gray-600">Conversion Rate</span>
              <span className="text-base md:text-lg font-semibold text-purple-600">{analytics.conversionRate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Quick Insights</h3>
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 shrink-0"></div>
              <div>
                <p className="text-sm md:text-base text-gray-900 font-medium">Strong Performance</p>
                <p className="text-xs md:text-sm text-gray-600">You have {analytics.totalCustomers} active customer relationships</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 shrink-0"></div>
              <div>
                <p className="text-sm md:text-base text-gray-900 font-medium">Pipeline Health</p>
                <p className="text-xs md:text-sm text-gray-600">{analytics.totalLeads} leads currently in your pipeline</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 shrink-0"></div>
              <div>
                <p className="text-sm md:text-base text-gray-900 font-medium">Conversion Success</p>
                <p className="text-xs md:text-sm text-gray-600">{analytics.conversionRate}% of leads converted to customers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
