import { useState } from 'react';

const Email = () => {
  const [selectedEmail, setSelectedEmail] = useState(null);

  // Placeholder data for demonstration
  const placeholderEmails = [
    {
      id: 1,
      from: 'john.doe@example.com',
      subject: 'Project Update Request',
      preview: 'Hi, I wanted to get an update on the current project status...',
      date: '2024-01-15',
      read: false
    },
    {
      id: 2,
      from: 'sarah.smith@company.com',
      subject: 'Meeting Tomorrow',
      preview: 'Just confirming our meeting scheduled for tomorrow at 2 PM...',
      date: '2024-01-15',
      read: true
    },
    {
      id: 3,
      from: 'support@service.com',
      subject: 'Your Invoice for January',
      preview: 'Please find attached your invoice for the month of January...',
      date: '2024-01-14',
      read: true
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Email</h1>
        <p className="text-gray-600 mt-1">Gmail integration coming soon</p>
      </div>

      {/* Integration Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">
              Gmail API Integration Coming Soon
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                This page will be integrated with Gmail API to allow you to:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Send and receive emails directly from your dashboard</li>
                <li>Manage customer communications in one place</li>
                <li>Track email conversations with leads and customers</li>
                <li>Create email templates for common responses</li>
                <li>Schedule emails and set up automated follow-ups</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Email Interface Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <button className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Compose
              </button>
            </div>
            
            <div className="divide-y divide-gray-200">
              {placeholderEmails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedEmail?.id === email.id ? 'bg-indigo-50' : ''
                  } ${!email.read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className={`text-sm ${!email.read ? 'font-semibold' : 'font-medium'} text-gray-900 truncate`}>
                      {email.from}
                    </div>
                    <div className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {new Date(email.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className={`text-sm ${!email.read ? 'font-semibold' : ''} text-gray-700 mb-1 truncate`}>
                    {email.subject}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {email.preview}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 text-center text-sm text-gray-500 border-t border-gray-200">
              Gmail integration will show real emails here
            </div>
          </div>
        </div>

        {/* Email Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm">
            {selectedEmail ? (
              <div className="p-6">
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {selectedEmail.subject}
                  </h2>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-gray-700">From:</span>{' '}
                      <span className="text-gray-600">{selectedEmail.from}</span>
                    </div>
                    <div className="text-gray-500">
                      {new Date(selectedEmail.date).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="text-gray-700 leading-relaxed mb-6">
                  {selectedEmail.preview}
                  <br /><br />
                  <span className="text-gray-500 italic">
                    [Full email content will be displayed here when Gmail API is integrated]
                  </span>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Reply
                  </button>
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                    Forward
                  </button>
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                    Archive
                  </button>
                  <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors ml-auto">
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-lg">Select an email to view</p>
                <p className="text-sm mt-2">Or compose a new message</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Preview */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Unified Inbox</h3>
          <p className="text-sm text-gray-600">All your emails in one place</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Email Templates</h3>
          <p className="text-sm text-gray-600">Save time with templates</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Scheduled Emails</h3>
          <p className="text-sm text-gray-600">Send emails at the right time</p>
        </div>
      </div>
    </div>
  );
};

export default Email;
