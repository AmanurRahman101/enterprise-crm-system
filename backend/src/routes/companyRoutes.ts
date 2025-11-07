import { Router } from 'express';
import { CompanyController } from '../controllers/companyController';
import { authenticate } from '../middleware/auth';
import { tenantMiddleware, requireTenant } from '../middleware/tenant';

const router = Router();

/**
 * Company Routes
 * Base path: /api/companies
 * All routes require authentication and tenant identification
 */

// Apply middleware to all routes
router.use(tenantMiddleware);
router.use(authenticate);
router.use(requireTenant);

// Company CRUD operations
router.post('/', CompanyController.createCompany);
router.get('/', CompanyController.getCompanies);
router.get('/stats', CompanyController.getCompanyStats);
router.get('/:id', CompanyController.getCompany);
router.put('/:id', CompanyController.updateCompany);
router.delete('/:id', CompanyController.deleteCompany);

export default router;
