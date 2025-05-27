"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import Layout from "./components/layout/layout"
import Login from "./pages/login/login"
import Dashboard from "./pages/dashboard/dashboard"
import Products from "./pages/products/products"
import Orders from "./pages/orders/orders"
import Customers from "./pages/customers/customers"
import Reviews from "./pages/reviews/reviews"
import AdminManagement from "./pages/admin-management/admin-management"
import Analytics from "./pages/analytics/analytics"
import Reports from "./pages/reports/reports"
import "./app.css"

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null) // Initialize as null to indicate loading state
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    const auth = localStorage.getItem("isAuthenticated")
    if (auth === "true") {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
    }
    setIsLoading(false)
  }, [])

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (isLoading) {
      return <div>Loading...</div> // Or a loading spinner
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />
    }

    return children
  }

  // Public route component
  const PublicRoute = ({ children }) => {
    if (isLoading) {
      return <div>Loading...</div>
    }

    if (isAuthenticated) {
      return <Navigate to="/dashboard" replace />
    }

    return children
  }

  if (isLoading) {
    return <div>Loading...</div> // Or a loading spinner
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
          <Route path="customers" element={<Customers />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="settings" element={<AdminManagement />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App