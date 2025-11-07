// Company type definitions
export interface Company {
  id: string;
  tenantId: string;
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  description?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
  // Relations (optional, populated based on includes)
  contacts?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    jobTitle?: string;
  }[];
  deals?: {
    id: string;
    title: string;
    value: number;
    status: string;
  }[];
  _count?: {
    contacts: number;
    deals: number;
  };
}

// Form data for creating/updating a company
export interface CompanyFormData {
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  description?: string;
  logo?: string;
}

// Filters for company list
export interface CompanyFilters {
  search?: string;
  industry?: string;
  size?: string;
}

// Paginated company list response
export interface CompanyListResponse {
  data: Company[];
  total: number;
  page: number;
  totalPages: number;
}
