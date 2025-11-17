import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Outlet } from 'react-router'
import { Toaster } from 'react-hot-toast'

const MainLayout = () => {
  return (
  <div className="flex flex-col min-h-screen">
            <header>
                <Navbar></Navbar>
            </header>
<Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            color: "#333",
            borderRadius: "8px",
            fontSize: "15px",
          },
          success: {
            iconTheme: {
              primary: "#4ade80", // green
              secondary: "#fff",
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
