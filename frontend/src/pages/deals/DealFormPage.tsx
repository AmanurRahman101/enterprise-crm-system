import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import dealService from '../../services/dealService';
import { contactService } from '../../services/contactService';
import companyService from '../../services/companyService';
import { dealStageService, DealStage } from '../../services/dealStageService';
import { DealFormData, DEAL_PRIORITIES } from '../../types/deal';

const DealFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [stages, setStages] = useState<DealStage[]>([]);
  const [formData, setFormData] = useState<DealFormData>({
    title: '',
    value: 0,
    currency: 'USD',
    stageId: '',
    probability: 10,
    priority: 'MEDIUM',
    source: '',
    description: '',
    expectedCloseDate: '',
    contactId: '',
    companyId: '',
    lostReason: '',
  });

  // Load stages from API
  const loadStages = useCallback(async () => {
    try {
      const response = await dealStageService.getStages();
      const stagesData = response.data || [];
      stagesData.sort((a, b) => a.order - b.order);
      setStages(stagesData);
      
      // Set default stage if creating new deal
      if (!isEditMode && stagesData.length > 0) {
        const defaultStage = stagesData.find(s => s.isDefault) || stagesData[0];
        setFormData(prev => ({ ...prev, stageId: defaultStage.id }));
      }
    } catch (err) {
      console.error('Error loading stages:', err);
    }
  }, [isEditMode]);

  // Load contacts and companies for dropdowns
  const loadOptions = useCallback(async () => {
    try {
      const [contactsRes, companiesRes] = await Promise.all([
        contactService.getContacts(1, 100),
        companyService.getCompanies(1, 100),
      ]);
      setContacts(contactsRes.contacts || []);
      setCompanies(companiesRes.data || []);
    } catch (err) {
      console.error('Error loading options:', err);
    }
  }, []);

  const loadDeal = useCallback(async () => {
    try {
      setLoading(true);
      const data = await dealService.getDeal(id!);
      setFormData({
        title: data.title,
        value: data.value,
        currency: data.currency || 'USD',
        stageId: data.stageId,
        probability: data.probability,
        priority: data.priority,
        source: data.source || '',
        description: data.description || '',
        expectedCloseDate: data.expectedCloseDate 
          ? new Date(data.expectedCloseDate).toISOString().split('T')[0] 
          : '',
        contactId: data.contactId,
        companyId: data.companyId || '',
        lostReason: data.lostReason || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load deal');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadStages();
    loadOptions();
  }, [loadStages, loadOptions]);

  useEffect(() => {
    if (isEditMode && id) {
      loadDeal();
    }
  }, [isEditMode, id, loadDeal]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    
    if (type === 'number') {
      processedValue = value ? Number(value) : 0;
    }
    
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError('Deal title is required');
      return;
    }
    if (!formData.contactId) {
      setError('Contact is required');
      return;
    }
    if (formData.value <= 0) {
      setError('Deal value must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare data
      const submitData: DealFormData = {
        ...formData,
        companyId: formData.companyId || undefined,
        source: formData.source || undefined,
        description: formData.description || undefined,
        expectedCloseDate: formData.expectedCloseDate || undefined,
        lostReason: formData.lostReason || undefined,
      };

      if (isEditMode) {
        await dealService.updateDeal(id!, submitData);
      } else {
        await dealService.createDeal(submitData);
      }
      navigate('/deals');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save deal');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode && !formData.title) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading deal...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            {isEditMode ? 'Edit Deal' : 'New Deal'}
          </h1>
          <p className="mt-1 text-sm text-secondary-600">
            {isEditMode ? 'Update deal information' : 'Add a new deal to your pipeline'}
          </p>
        </div>
        <button
          onClick={() => navigate('/deals')}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Cancel
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert-danger mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Deal Information */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-secondary-900">
              Deal Information
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-secondary-700">
                  Deal Title <span className="text-danger-600">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enterprise License Deal"
                />
              </div>

              <div>
                <label htmlFor="value" className="block text-sm font-medium text-secondary-700">
                  Value <span className="text-danger-600">*</span>
                </label>
                <input
                  type="number"
                  id="value"
                  name="value"
                  required
                  min="0"
                  step="0.01"
                  value={formData.value}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="50000"
                />
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-secondary-700">
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="AED">AED - UAE Dirham</option>
                  <option value="SAR">SAR - Saudi Riyal</option>
                </select>
              </div>

              <div>
                <label htmlFor="stage" className="block text-sm font-medium text-secondary-700">
                  Stage <span className="text-danger-600">*</span>
                </label>
                <select
                  id="stage"
                  name="stageId"
                  required
                  value={formData.stageId}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Stage</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="probability" className="block text-sm font-medium text-secondary-700">
                  Win Probability (%)
                </label>
                <input
                  type="number"
                  id="probability"
                  name="probability"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-secondary-700">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  {DEAL_PRIORITIES.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="expectedCloseDate" className="block text-sm font-medium text-secondary-700">
                  Expected Close Date
                </label>
                <input
                  type="date"
                  id="expectedCloseDate"
                  name="expectedCloseDate"
                  value={formData.expectedCloseDate}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="source" className="block text-sm font-medium text-secondary-700">
                  Source
                </label>
                <input
                  type="text"
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Website, Referral, Cold Call"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-secondary-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Deal details and notes..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Company */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-secondary-900">
              Contact & Company
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contactId" className="block text-sm font-medium text-secondary-700">
                  Contact <span className="text-danger-600">*</span>
                </label>
                <select
                  id="contactId"
                  name="contactId"
                  required
                  value={formData.contactId}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Contact</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                      {contact.email && ` (${contact.email})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="companyId" className="block text-sm font-medium text-secondary-700">
                  Company
                </label>
                <select
                  id="companyId"
                  name="companyId"
                  value={formData.companyId}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Company (Optional)</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Lost Reason (only show if stage is CLOSED_LOST) */}
        {formData.stageId && stages.find(s => s.id === formData.stageId)?.isLost && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-secondary-900">
                Lost Reason
              </h2>
            </div>
            <div className="card-body">
              <div>
                <label htmlFor="lostReason" className="block text-sm font-medium text-secondary-700">
                  Why was this deal lost?
                </label>
                <textarea
                  id="lostReason"
                  name="lostReason"
                  rows={3}
                  value={formData.lostReason}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Explain why this deal was lost..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/deals')}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : isEditMode ? (
              'Update Deal'
            ) : (
              'Create Deal'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DealFormPage;
