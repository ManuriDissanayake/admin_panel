"use client"

import { useState, useEffect } from "react"
import { Bell, User, LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"
import "./header.css"

const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [userData, setUserData] = useState({ name: "Admin User", role: "Super Admin" })
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    // Get user data from localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    if (user.name && user.role) {
      setUserData(user)
    }

    return () => clearInterval(timer)
  }, [])

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(currentTime)

  const handleLogout = async () => {
    try {
      // Optional: Call backend logout endpoint if you have one
      // await fetch("http://localhost:8080/api/admins/logout", { method: "POST" });
      
      // Clear authentication data
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("user");
      
      // Force full page reload to reset all state
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      // Still proceed with local cleanup
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="page-title">Dashboard</h1>
        <p className="current-date">{formattedDate}</p>
      </div>

      <div className="header-right">
        <button className="notification-btn">
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button>

        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <LogOut size={20} />
        </button>

        <div className="user-profile">
          <div className="avatar">
            <User size={20} />
          </div>
          <div className="user-info">
            <p className="user-name">{userData.name}</p>
            <p className="user-role">{userData.role}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
