import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const MyCompanies = () => {
  const [myCompanies, setMyCompanies] = useState([])
  const [allCompanies, setAllCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchMyCompanies()
    fetchAllCompanies()
  }, [])

  const fetchMyCompanies = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/rpc/getCustomerCompanies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setMyCompanies(data.companies)
      } else {
        toast.error(data.message || 'Failed to fetch companies')
      }
    } catch (error) {
      toast.error('Error loading companies')
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllCompanies = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/rpc/getAllCompanies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setAllCompanies(data.companies)
      }
    } catch (error) {
      console.error('Fetch all companies error:', error)
    }
  }

  const handleAddCompany = async (companyId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/rpc/addCompanyToCustomer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ companyId })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Company added successfully!')
        fetchMyCompanies()
        setShowAddModal(false)
        setSearchTerm('')
      } else {
        toast.error(data.message || 'Failed to add company')
      }
    } catch (error) {
      toast.error('Error adding company')
      console.error('Add error:', error)
    }
  }

  const handleRemoveCompany = async (companyId, companyName) => {
    if (!window.confirm(`Are you sure you want to remove ${companyName} from your list?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/rpc/removeCompanyFromCustomer/${companyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Company removed successfully!')
        fetchMyCompanies()
      } else {
        toast.error(data.message || 'Failed to remove company')
      }
    } catch (error) {
      toast.error('Error removing company')
      console.error('Remove error:', error)
    }
  }

  const myCompanyIds = myCompanies.map(c => c.id)
  const availableCompanies = allCompanies.filter(c => !myCompanyIds.includes(c.id))
  
  const filteredAvailableCompanies = availableCompanies.filter(company =>
    company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading companies...</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Companies</h1>
          <p className="text-sm md:text-base text-gray-600 mt-2">Companies you're getting services from</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Company
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border-l-4 border-teal-500">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Total Companies</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{myCompanies.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border-l-4 border-green-500">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Active Services</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">
            {myCompanies.filter(c => c.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border-l-4 border-blue-500">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Available to Add</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{availableCompanies.length}</p>
        </div>
      </div>

      {/* Companies List */}
      {myCompanies.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 text-center">
          <svg className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">No Companies Yet</h3>
          <p className="text-sm md:text-base text-gray-600 mb-4">Start by adding companies you're getting services from</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm md:text-base"
          >
            Add Your First Company
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {myCompanies.map((company) => (
            <div key={company.id} className="bg-white rounded-lg shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1">{company.company_name}</h3>
                  <span className={`inline-block px-2 md:px-3 py-1 rounded-full text-xs font-medium ${
                    company.status === 'active' ? 'bg-green-100 text-green-800' :
                    company.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {company.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-xs md:text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="truncate">{company.email}</span>
                </div>
                {company.phone && (
                  <div className="flex items-center text-xs md:text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {company.phone}
                  </div>
                )}
                <div className="flex items-center text-xs md:text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Since {new Date(company.relationship_started).toLocaleDateString()}
                </div>
              </div>

              <button
                onClick={() => handleRemoveCompany(company.id, company.company_name)}
                className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Add Company</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setSearchTerm('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search companies by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm md:text-base"
                />
              </div>

              <div className="max-h-96 overflow-y-auto">
                {filteredAvailableCompanies.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {availableCompanies.length === 0 
                      ? 'All companies are already in your list'
                      : 'No companies found matching your search'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAvailableCompanies.map((company) => (
                      <div key={company.id} className="border border-gray-200 rounded-lg p-3 md:p-4 hover:border-teal-500 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm md:text-base mb-1">{company.company_name}</h3>
                            <p className="text-xs md:text-sm text-gray-600 truncate">{company.email}</p>
                            {company.phone && (
                              <p className="text-xs md:text-sm text-gray-600">{company.phone}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleAddCompany(company.id)}
                            className="px-3 md:px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shrink-0 text-sm md:text-base"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyCompanies
