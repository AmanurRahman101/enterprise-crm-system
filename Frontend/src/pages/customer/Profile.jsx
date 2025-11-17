import React, { useState, useMemo } from 'react'
import toast from 'react-hot-toast'

const CustomerProfile = () => {
  const customer = useMemo(() => {
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : null
  }, [])

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    fullName: customer?.full_name || '',
    email: customer?.email || '',
    phone: customer?.phone || ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/rpc/updateCustomerProfile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Profile updated successfully!')
        localStorage.setItem('user', JSON.stringify(data.customer))
        setIsEditing(false)
      } else {
        toast.error(data.message || 'Update failed')
      }
    } catch (error) {
      toast.error('Something went wrong')
      console.error('Update error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-sm md:text-base text-gray-600 mt-2">Manage your personal information</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm md:text-base"
            >
              Edit Profile
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 lg:p-8">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 md:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600 text-sm md:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600 text-sm md:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-600 text-sm md:text-base"
                  placeholder="Optional"
                />
              </div>

              <div className="border-t border-gray-200 pt-4 md:pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <p className="text-xs md:text-sm text-gray-600">Account Created</p>
                    <p className="text-sm md:text-base font-medium text-gray-900">
                      {customer?.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-gray-600">Customer ID</p>
                    <p className="text-sm md:text-base font-medium text-gray-900">#{customer?.id}</p>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-2 md:py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:bg-teal-400 disabled:cursor-not-allowed text-sm md:text-base"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        fullName: customer?.full_name || '',
                        email: customer?.email || '',
                        phone: customer?.phone || ''
                      })
                    }}
                    className="flex-1 px-6 py-2 md:py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm md:text-base"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="mt-6 bg-teal-50 border border-teal-200 rounded-lg p-4 md:p-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-teal-600 mr-3 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <h3 className="text-sm md:text-base font-medium text-teal-800 mb-1">
                Your Information is Secure
              </h3>
              <p className="text-xs md:text-sm text-teal-700">
                All your personal information is encrypted and stored securely. We never share your data with third parties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerProfile
