import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import toast from 'react-hot-toast'

const CustomerOverview = () => {
  const navigate = useNavigate()
  const [incomingCall, setIncomingCall] = useState(null)
  const [jitsiModal, setJitsiModal] = useState({ open: false, room: '' })

  const customer = useMemo(() => {
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : null
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userType = localStorage.getItem('userType')

    if (!token || userType !== 'customer') {
      toast.error('Please sign in as a customer')
      navigate('/auth/signin-customer')
    }
  }, [navigate])

  // Poll for incoming Jitsi calls
  useEffect(() => {
    if (!customer?.id) return;

    console.log('Customer listening for calls. Customer ID:', customer.id, 'Email:', customer.email);

    const checkIncomingCalls = () => {
      const callData = localStorage.getItem('jitsi_call_invitation')
      if (callData) {
        try {
          const call = JSON.parse(callData)
          console.log('Call invitation found:', call);
          console.log('Checking: call.customerId =', call.customerId, 'customer.id =', customer.id);
          console.log('Call age:', Date.now() - call.timestamp, 'ms');
          
          // Check if call is for this customer and is recent (within 60 seconds)
          if (call.customerId == customer.id && Date.now() - call.timestamp < 60000) {
            console.log('Call is for this customer! Showing notification.');
            setIncomingCall(call)
            toast.success(`Incoming call from ${call.companyName}!`);
          }
        } catch (e) {
          console.error('Error parsing call invitation:', e);
        }
      }
    }

    // Listen for storage changes (works across tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'jitsi_call_invitation') {
        console.log('Storage event detected for call invitation');
        checkIncomingCalls();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(checkIncomingCalls, 1000)
    checkIncomingCalls() // Check immediately

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange);
    }
  }, [customer])

  const acceptCall = () => {
    if (incomingCall) {
      console.log('Customer accepting call:', incomingCall);
      toast.success('Joining call...');
      setJitsiModal({ open: true, room: incomingCall.roomName })
      setIncomingCall(null)
      localStorage.removeItem('jitsi_call_invitation')
    }
  }

  const declineCall = () => {
    console.log('Customer declining call:', incomingCall);
    setIncomingCall(null)
    localStorage.removeItem('jitsi_call_invitation')
    toast.error('Call declined')
  }

  const closeJitsiCall = () => {
    setJitsiModal({ open: false, room: '' })
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Welcome back, {customer?.full_name}!
        </h1>
        <p className="text-sm md:text-base text-gray-600 mt-2">Here's your customer dashboard overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-teal-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600 mb-1">My Companies</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">0</p>
            </div>
            <div className="p-2 md:p-3 bg-teal-100 rounded-lg">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600 mb-1">Active Tickets</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">0</p>
            </div>
            <div className="p-2 md:p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600 mb-1">Messages</p>
              <p className="text-2xl md:text-3xl font-bold text-gray-900">0</p>
            </div>
            <div className="p-2 md:p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/dashboard/customer/companies')}
              className="w-full flex items-center p-3 md:p-4 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors text-left"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-teal-600 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div>
                <p className="font-medium text-gray-900 text-sm md:text-base">View My Companies</p>
                <p className="text-xs md:text-sm text-gray-600">Manage your company relationships</p>
              </div>
            </button>

            <button 
              onClick={() => navigate('/dashboard/customer/tickets')}
              className="w-full flex items-center p-3 md:p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <div>
                <p className="font-medium text-gray-900 text-sm md:text-base">My Support Tickets</p>
                <p className="text-xs md:text-sm text-gray-600">View and manage your tickets</p>
              </div>
            </button>

            <button 
              onClick={() => navigate('/dashboard/customer/messages')}
              className="w-full flex items-center p-3 md:p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-600 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <div>
                <p className="font-medium text-gray-900 text-sm md:text-base">Messages</p>
                <p className="text-xs md:text-sm text-gray-600">Check your messages</p>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 mr-3 shrink-0"></div>
              <div>
                <p className="text-sm md:text-base font-medium text-gray-900">Full Name</p>
                <p className="text-xs md:text-sm text-gray-600">{customer?.full_name}</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 shrink-0"></div>
              <div>
                <p className="text-sm md:text-base font-medium text-gray-900">Email</p>
                <p className="text-xs md:text-sm text-gray-600">{customer?.email}</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 shrink-0"></div>
              <div>
                <p className="text-sm md:text-base font-medium text-gray-900">Phone</p>
                <p className="text-xs md:text-sm text-gray-600">{customer?.phone || 'Not provided'}</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate('/dashboard/customer/profile')}
                className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm md:text-base"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-teal-50 border border-teal-200 rounded-lg p-4 md:p-6">
        <div className="flex items-start">
          <svg className="w-5 h-5 md:w-6 md:h-6 text-teal-600 mr-3 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm md:text-base font-medium text-teal-800 mb-1">
              Welcome to Tawasol CRM Customer Portal
            </h3>
            <p className="text-xs md:text-sm text-teal-700">
              Manage your relationships with companies, create support tickets, and stay connected through our messaging system. 
              Explore the navigation menu to access all features.
            </p>
          </div>
        </div>
      </div>

      {/* Incoming Call Notification */}
      {incomingCall && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl p-6 max-w-sm z-50 border-2 border-green-500 animate-pulse">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Incoming Call</h3>
              <p className="text-sm text-gray-600">{incomingCall.companyName}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={acceptCall}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
            >
              Accept
            </button>
            <button
              onClick={declineCall}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Jitsi Meet Modal */}
      {jitsiModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">Jitsi Call: {jitsiModal.room}</h2>
              <button onClick={closeJitsiCall} className="text-red-600 hover:text-red-900 font-bold text-2xl">&times;</button>
            </div>
            <div className="flex-1">
              <iframe
                src={`https://meet.jit.si/${encodeURIComponent(jitsiModal.room)}`}
                allow="camera; microphone; fullscreen; display-capture"
                style={{ width: '100%', height: '600px', border: 'none' }}
                title="Jitsi Meet"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerOverview
