import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';

const STATUS_META = {
  linked: { label: 'Linked', color: 'text-green-600 bg-green-50' },
  pending: { label: 'Pending Verification', color: 'text-amber-600 bg-amber-50' },
  not_linked: { label: 'Not Linked', color: 'text-gray-600 bg-gray-100' }
};

const TelegramLink = () => {
  const [statusPayload, setStatusPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getTelegramLinkStatus();
      setStatusPayload(response);
    } catch (error) {
      toast.error(error.message || 'Failed to load Telegram status');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    setGenerating(true);
    try {
      const response = await ApiService.generateTelegramLinkCode();
      setStatusPayload(response);
      toast.success('Verification code generated');
    } catch (error) {
      toast.error(error.message || 'Failed to generate verification code');
    } finally {
      setGenerating(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm('Are you sure you want to disconnect your Telegram account? You will need to re-link it to use the bot again.')) {
      return;
    }
    setUnlinking(true);
    try {
      const response = await ApiService.unlinkTelegram();
      setStatusPayload(response);
      toast.success('Telegram account disconnected');
    } catch (error) {
      toast.error(error.message || 'Failed to disconnect Telegram account');
    } finally {
      setUnlinking(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const currentStatus = statusPayload?.status || 'not_linked';
  const statusMeta = STATUS_META[currentStatus] || STATUS_META.not_linked;
  const verificationCode = statusPayload?.link?.verificationCode || null;
  const generatedAt = statusPayload?.link?.generatedAt
    ? new Date(statusPayload.link.generatedAt).toLocaleString()
    : null;
  const verifiedAt = statusPayload?.link?.verifiedAt
    ? new Date(statusPayload.link.verifiedAt).toLocaleString()
    : null;
  const botHandle = statusPayload?.botUsername
    ? `@${statusPayload.botUsername.replace('@', '')}`
    : 'your CRM Telegram bot';

  const handleCopyCode = async () => {
    if (!verificationCode) {
      return;
    }
    try {
      await navigator.clipboard.writeText(verificationCode);
      toast.success('Code copied to clipboard');
    } catch (error) {
      toast.error('Unable to copy code');
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Telegram Assistant</h1>
              <p className="text-gray-600 mt-1">
                Link your CRM account with Telegram to chat with the MCP-powered assistant directly from
                your phone.
              </p>
            </div>
            <span
              className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold ${statusMeta.color}`}
            >
              {statusMeta.label}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="animate-pulse h-24 bg-gray-100 rounded-xl" />
            ) : (
              <>
                {currentStatus === 'linked' && (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <h2 className="text-lg font-semibold text-green-800">Linked to Telegram</h2>
                    <p className="text-sm text-green-700 mt-1">
                      Your CRM account is linked to Telegram chat ID{' '}
                      <span className="font-mono">{statusPayload?.link?.telegramChatId}</span>.
                    </p>
                    {verifiedAt && (
                      <p className="text-sm text-green-700 mt-1">Linked on {verifiedAt}</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={handleGenerateCode}
                        className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-green-700 bg-white border border-green-200 hover:bg-green-100 transition disabled:opacity-50"
                        disabled={generating || unlinking}
                      >
                        {generating ? 'Generating…' : 'Generate new pairing code'}
                      </button>
                      <button
                        onClick={handleUnlink}
                        className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 transition disabled:opacity-50"
                        disabled={generating || unlinking}
                      >
                        {unlinking ? 'Disconnecting…' : 'Disconnect Telegram'}
                      </button>
                    </div>
                  </div>
                )}

                {currentStatus !== 'linked' && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-indigo-900">
                          Your pairing code
                        </h2>
                        <p className="text-sm text-indigo-700">
                          Send this code to {botHandle} in Telegram to finish linking.
                        </p>
                      </div>
                      <button
                        onClick={handleGenerateCode}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50"
                        disabled={generating}
                      >
                        {generating ? 'Generating…' : verificationCode ? 'Regenerate code' : 'Generate code'}
                      </button>
                    </div>
                    {verificationCode ? (
                      <div className="mt-4 bg-white rounded-xl border border-indigo-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Verification Code
                          </p>
                          <p className="text-3xl font-mono font-bold text-gray-900">{verificationCode}</p>
                          {generatedAt && (
                            <p className="text-xs text-gray-500 mt-1">Generated on {generatedAt}</p>
                          )}
                        </div>
                        <button
                          onClick={handleCopyCode}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
                        >
                          Copy code
                        </button>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-indigo-700">
                        Click “Generate code” to create a new 6-digit verification code.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How to link Telegram</h2>
          <ol className="space-y-4 text-gray-700">
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                1
              </span>
              <div>
                <p className="font-medium text-gray-900">Generate or view your pairing code.</p>
                <p className="text-sm text-gray-600">
                  Use the button above to create a fresh 6-digit verification code.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                2
              </span>
              <div>
                <p className="font-medium text-gray-900">
                  Open {botHandle} in the Telegram app.
                </p>
                <p className="text-sm text-gray-600">
                  If you don’t know the bot handle, ask your administrator for the bot username.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                3
              </span>
              <div>
                <p className="font-medium text-gray-900">Send the 6-digit code to the bot.</p>
                <p className="text-sm text-gray-600">
                  The bot will confirm the link immediately. Once linked, every message you send in Telegram
                  will be scoped to your current organization.
                </p>
              </div>
            </li>
          </ol>
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-800 mb-1">Security tips</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Codes expire once used or when you generate a new one.</li>
              <li>Never share your code outside of Telegram—treat it like a password.</li>
              <li>You can regenerate a code at any time to revoke previously shared codes.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramLink;


