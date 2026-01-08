import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Outlet } from 'react-router'
import { Toaster } from 'react-hot-toast'
import RouteLoadingBar from '../components/RouteLoadingBar'
import ScrollToTop from '../components/ScrollToTop'

const MainLayout = () => {
  return (
  <div className="flex flex-col min-h-screen">
            <RouteLoadingBar />
            <ScrollToTop />
            <header>
                <Navbar></Navbar>
            </header>
<Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          className: 'toast-notification',
          style: {
            background: "rgba(17, 24, 39, 0.95)",
            backdropFilter: "blur(16px)",
            color: "#ffffff",
            borderRadius: "12px",
            fontSize: "14px",
            border: "1px solid rgba(20, 184, 166, 0.3)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.6), 0 0 20px rgba(20, 184, 166, 0.15)",
            padding: "16px",
            maxWidth: "400px",
          },
          success: {
            duration: 3000,
            style: {
              borderLeft: "4px solid #10b981",
            },
            iconTheme: {
              primary: "#10b981",
              secondary: "#ffffff",
            },
          },
          error: {
            duration: 5000,
            style: {
              borderLeft: "4px solid #ef4444",
            },
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
          loading: {
            style: {
              borderLeft: "4px solid #14b8a6",
            },
            iconTheme: {
              primary: "#14b8a6",
              secondary: "#ffffff",
            },
          },
        }}
      />
            <main className="flex-grow max-w-[1200px] mx-auto w-full pt-16">
                <Outlet></Outlet>
            </main>

            <footer>
                <Footer></Footer>
            </footer>
        </div>
  )
}

export default MainLayout
