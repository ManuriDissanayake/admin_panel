"use client"

import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { BarChart3, FileText, Home, LogOut, Package, Settings, ShoppingCart, Star, Users, Menu, X } from "lucide-react"
import "./sidebar.css"

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true)
  const location = useLocation()

  const menuItems = [
    { title: "Dashboard", path: "/dashboard", icon: <Home size={20} /> },
    { title: "Products", path: "/products", icon: <Package size={20} /> },
    { title: "Orders", path: "/orders", icon: <ShoppingCart size={20} /> },
    { title: "Customers", path: "/customers", icon: <Users size={20} /> },
    { title: "Reviews", path: "/reviews", icon: <Star size={20} /> },
    { title: "Analytics", path: "/analytics", icon: <BarChart3 size={20} /> },
    { title: "Reports", path: "/reports", icon: <FileText size={20} /> },
    { title: "Settings", path: "/settings", icon: <Settings size={20} /> },
  ]

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      // Clear authentication data
      localStorage.removeItem("isAuthenticated")
      localStorage.removeItem("user")
      
      // Force full page reload to reset all state
      window.location.href = "/login"
    }
  }

  function toggleSidebar() {
    setIsOpen(!isOpen)
    // Dispatch a custom event that the layout can listen for
    const event = new CustomEvent("sidebarToggle", { detail: { isOpen: !isOpen } })
    window.dispatchEvent(event)
  }

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <div className="sidebar-header">
        <h2 className={`logo ${!isOpen && "hidden"}`}>Admin Panel</h2>
        <button className="toggle-btn" onClick={toggleSidebar}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`menu-item ${location.pathname === item.path ? "active" : ""}`}
          >
            <span className="icon">{item.icon}</span>
            <span className={`title ${!isOpen && "hidden"}`}>{item.title}</span>
          </Link>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="menu-item" onClick={handleLogout} style={{ cursor: 'pointer' }}>
          <span className="icon">
            <LogOut size={20} />
          </span>
          <span className={`title ${!isOpen && "hidden"}`}>Logout</span>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
