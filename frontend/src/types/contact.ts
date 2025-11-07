export interface Contact {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  language?: string;
  avatar?: string;
  isCustomer: boolean;
  tags: string[];
  customFields?: Record<string, any>;
  companyId?: string;
  ownerId: string;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  company?: {
    id: string;
    name: string;
  };
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  language?: string;
  isCustomer?: boolean;
  tags?: string[];
  companyId?: string;
}

export interface ContactFilters {
  search?: string;
  isCustomer?: boolean;
  companyId?: string;
  ownerId?: string;
  tags?: string[];
}

export interface ContactListResponse {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
