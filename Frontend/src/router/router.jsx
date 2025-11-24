import {
  createBrowserRouter,
} from "react-router";
import MainLayout from "../layout/MainLayot";
import Home from "../pages/Home";

// Authentication Pages (Unified)
import Signup from "../pages/Signup";
import Signin from "../pages/Signin";

// Dashboard Layout
import DashboardLayout from "../layout/DashboardLayout";
import ProtectedRoute from "../components/ProtectedRoute";

// Organization Dashboard Pages (Internal Users)
import OrgOverview from "../pages/organization/Overview";
import Deals from "../pages/organization/Deals";
import Contacts from "../pages/organization/Contacts";
import Issues from "../pages/organization/Issues";
import Activities from "../pages/organization/Activities";
import Team from "../pages/organization/Team";
import CallHistory from "../pages/organization/CallHistory";

// Client Portal Pages
import ClientOverview from "../pages/client/Overview";
import MyDeals from "../pages/client/MyDeals";
import MyIssues from "../pages/client/MyIssues";

// Legacy Company Dashboard Pages (for backward compatibility)
import CompanyOverview from "../pages/company/Overview";
import CompanyProfile from "../pages/company/Profile";
import Customers from "../pages/company/Customers";
import Leads from "../pages/company/Leads";
import Analytics from "../pages/company/Analytics";
import Email from "../pages/company/Email";
import Support from "../pages/company/Support";

// Legacy Customer Dashboard Pages (for backward compatibility)
import CustomerOverview from "../pages/customer/Overview";
import CustomerProfile from "../pages/customer/Profile";
import MyCompanies from "../pages/customer/MyCompanies";

export let router = createBrowserRouter([
  {
    path: "/",
    Component: MainLayout,
    children: [
      { index: true, Component: Home },
    ]
  },
  {
    path: "/auth",
    children: [
      // Unified authentication routes (new system)
      {
        path: '/auth/signup',
        Component: Signup
      },
      {
        path: '/auth/signin',
        Component: Signin
      },
      // Legacy routes redirect to unified auth (for backward compatibility)
      {
        path: '/auth/signup-company',
        Component: Signup
      },
      {
        path: '/auth/signup-customer',
        Component: Signup
      },
      {
        path: '/auth/signin-company',
        Component: Signin
      },
      {
        path: '/auth/signin-customer',
        Component: Signin
      }
    ]
  },
  // ========== NEW ORGANIZATION-BASED ROUTES ==========
  {
    path: "/dashboard/organization",
    element: <ProtectedRoute />,
    children: [
      {
        Component: DashboardLayout,
        children: [
          {
            index: true,
            Component: OrgOverview
            },
          {
            path: 'deals',
            Component: Deals
          },
          {
            path: 'contacts',
            Component: Contacts
          },
          {
            path: 'issues',
            Component: Issues
          },
          {
            path: 'activities',
            Component: Activities
          },
          {
            path: 'team',
            Component: Team
          },
          {
            path: 'calls',
            Component: CallHistory
          }
        ]
      }
    ]
  },
  // ========== CLIENT PORTAL ROUTES ==========
  {
    path: "/dashboard/client",
    element: <ProtectedRoute />,
    children: [
      {
        Component: DashboardLayout,
        children: [
          {
            index: true,
            Component: ClientOverview
          },
          {
            path: 'deals',
            Component: MyDeals
          },
          {
            path: 'issues',
            Component: MyIssues
          }
        ]
      }
    ]
  },
  // ========== LEGACY COMPANY ROUTES (for backward compatibility) ==========
  {
    path: "/dashboard/company",
    Component: DashboardLayout,
    children: [
      {
        path: '/dashboard/company',
        Component: CompanyOverview
      },
      {
        path: '/dashboard/company/profile',
        Component: CompanyProfile
      },
      {
        path: '/dashboard/company/customers',
        Component: Customers
      },
      {
        path: '/dashboard/company/leads',
        Component: Leads
      },
      {
        path: '/dashboard/company/analytics',
        Component: Analytics
      },
      {
        path: '/dashboard/company/email',
        Component: Email
      },
      {
        path: '/dashboard/company/support',
        Component: Support
      }
    ]
  },
  // ========== LEGACY CUSTOMER ROUTES (for backward compatibility) ==========
  {
    path: "/dashboard/customer",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/dashboard/customer',
        Component: CustomerOverview
      },
      {
        path: '/dashboard/customer/profile',
        Component: CustomerProfile
      },
      {
        path: '/dashboard/customer/companies',
        Component: MyCompanies
      }
    ]
  }
]);
