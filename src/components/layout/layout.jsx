"use client"

import { useState, useEffect } from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "../sidebar/sidebar"
import Header from "../header/header"
import "./layout.css"

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false)
      } else {
        setIsSidebarOpen(true)
      }
    }

    // Listen for the custom sidebar toggle event
    const handleSidebarToggle = (event) => {
      setIsSidebarOpen(event.detail.isOpen)
    }

    // Initial check
    handleResize()

    window.addEventListener("resize", handleResize)
    window.addEventListener("sidebarToggle", handleSidebarToggle)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("sidebarToggle", handleSidebarToggle)
    }
  }, [])

  return (
    <div className="layout">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={`main-content ${!isSidebarOpen ? "sidebar-closed" : ""}`}>
        <Header />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
