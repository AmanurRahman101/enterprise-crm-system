import {
  createBrowserRouter,

} from "react-router";
import MainLayout from "../layout/MainLayot";
import Home from "../pages/Home";
import SignupCompany from "../pages/SignupCompany";
import SignupCustomer from "../pages/SignupCustomer";
import SigninCompany from "../pages/SigninCompany";
import SigninCustomer from "../pages/SigninCustomer";


// Dashboard Layout
import DashboardLayout from "../layout/DashboardLayout";

// Company Dashboard Pages
import Overview from "../pages/company/Overview";
import Profile from "../pages/company/Profile";
import Customers from "../pages/company/Customers";
import Leads from "../pages/company/Leads";
import Analytics from "../pages/company/Analytics";
import Email from "../pages/company/Email";
import Support from "../pages/company/Support";

// Customer Dashboard Pages
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
      {
        path: '/auth/signup-company',
        Component: SignupCompany
      },
      {
        path: '/auth/signup-customer',
        Component: SignupCustomer
      },
      {
        path: '/auth/signin-company',
        Component: SigninCompany
      },
      {
        path: '/auth/signin-customer',
        Component: SigninCustomer
      }
    ]
  },
  {
    path: "/dashboard/company",
    Component: DashboardLayout,
    children: [
      {
        path: '/dashboard/company',
        Component: Overview
      },
      {
        path: '/dashboard/company/profile',
        Component: Profile
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
  {
    path: "/dashboard/customer",
    Component: DashboardLayout ,
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