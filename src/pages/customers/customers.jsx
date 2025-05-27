"use client"

import { useState, useEffect } from "react"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, X, Eye, Mail, Phone, MapPin, ShoppingBag } from 'lucide-react'
import "./customers.css"

const Customers = () => {
  const [customers, setCustomers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "lastOrder", direction: "descending" })
  const [currentPage, setCurrentPage] = useState(1)
  const [viewingCustomer, setViewingCustomer] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showAllOrders, setShowAllOrders] = useState(false)
  
  const itemsPerPage = 5

  // Filter customers based on search term
  const filteredCustomers = customers.filter((customer) => {
    return (
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.status?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Fetch customers on component mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`http://localhost:8080/admin/customers`)
        if (!response.ok) {
          throw new Error('Failed to fetch customers')
        }
        const data = await response.json()
        setCustomers(data)
        setError(null)
      } catch (err) {
        setError(err.message)
        console.error("Error fetching customers:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomers()
  }, [])

  const fetchCustomerDetails = async (customerId) => {
    try {
      setIsLoading(true)
      // Fetch customer details
      const customerResponse = await fetch(`http://localhost:8080/admin/customers/${customerId}`)
      if (!customerResponse.ok) {
        throw new Error('Failed to fetch customer details')
      }
      const customerData = await customerResponse.json()
      
      // Fetch all orders for this customer
      const ordersResponse = await fetch(`http://localhost:8080/orders/user/${customerId}`)
      if (!ordersResponse.ok) {
        throw new Error('Failed to fetch customer orders')
      }
      const ordersData = await ordersResponse.json()
      
      // Process the data to include recent orders and stats
      const recentOrders = ordersData.slice(0, 10) // Get first 10 orders for display
      const totalSpent = ordersData.reduce((sum, order) => sum + order.total, 0)
      const avgOrderValue = ordersData.length > 0 ? totalSpent / ordersData.length : 0
      
      return {
        customer: customerData,
        recentOrders,
        stats: {
          totalOrders: ordersData.length,
          totalSpent,
          avgOrderValue
        }
      }
    } catch (err) {
      console.error("Error fetching customer details:", err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Sort customers
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (!sortConfig.key) return 0

    let aValue = a[sortConfig.key]
    let bValue = b[sortConfig.key]

    // Handle date sorting
    if (sortConfig.key === "lastOrder") {
      aValue = aValue ? new Date(aValue) : new Date(0)
      bValue = bValue ? new Date(bValue) : new Date(0)
    }

    if (aValue < bValue) {
      return sortConfig.direction === "ascending" ? -1 : 1
    }
    if (aValue > bValue) {
      return sortConfig.direction === "ascending" ? 1 : -1
    }
    return 0
  })

  // Pagination
  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage)
  const paginatedCustomers = sortedCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Handle sort
  const requestSort = (key) => {
    let direction = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Handle view customer details
  const handleViewCustomer = async (customer) => {
    const details = await fetchCustomerDetails(customer.id)
    if (details) {
      setViewingCustomer({
        ...customer,
        details
      })
      setShowAllOrders(false) // Reset to show only recent orders
      setIsModalOpen(true)
    }
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "No orders yet"
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  if (isLoading) {
    return <div className="customers-container">Loading customers...</div>
  }

  if (error) {
    return <div className="customers-container">Error: {error}</div>
  }

  return (
    <div className="customers-container">
      <div className="customers-header">
        <h1>Customers</h1>
      </div>

      <div className="filters-container">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="customers-table-container">
        <table className="customers-table">
          <thead>
            <tr>
              <th onClick={() => requestSort("name")}>
                <div className="th-content">
                  Name
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th onClick={() => requestSort("email")}>
                <div className="th-content">
                  Email
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th onClick={() => requestSort("orders")}>
                <div className="th-content">
                  Orders
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th onClick={() => requestSort("totalSpent")}>
                <div className="th-content">
                  Total Spent
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th onClick={() => requestSort("lastOrder")}>
                <div className="th-content">
                  Last Order
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th onClick={() => requestSort("status")}>
                <div className="th-content">
                  Status
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.email}</td>
                <td>{customer.orders}</td>
                <td>LKR{customer.totalSpent.toFixed(2)}</td>
                <td>{formatDate(customer.lastOrder)}</td>
                <td>
                  <span className={`status-badge ${customer.status.toLowerCase()}`}>{customer.status}</span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="view-btn" onClick={() => handleViewCustomer(customer)} title="View Customer">
                      <Eye size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {paginatedCustomers.length === 0 && (
              <tr>
                <td colSpan="7" className="no-customers">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            <ChevronLeft size={16} />
          </button>

          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>

          <button
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Customer Details Modal */}
      {isModalOpen && viewingCustomer && (
        <div className="modal-overlay">
          <div className="modal customer-modal">
            <div className="modal-header">
              <h2>Customer Details</h2>
              <button className="close-modal" onClick={() => {
                setIsModalOpen(false)
                setShowAllOrders(false)
              }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="customer-details-grid">
                <div className="customer-profile-section">
                  <div className="customer-avatar">
                    <span className="avatar-initials">
                      {viewingCustomer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <h3 className="customer-name">{viewingCustomer.name}</h3>
                  <p className={`customer-status ${viewingCustomer.status.toLowerCase()}`}>
                    {viewingCustomer.status}
                  </p>
                </div>

                <div className="customer-info-section">
                  <h3>Contact Information</h3>
                  <div className="info-item">
                    <Mail size={16} />
                    <span>{viewingCustomer.email}</span>
                  </div>
                  <div className="info-item">
                    <Phone size={16} />
                    <span>{viewingCustomer.phone || "Not provided"}</span>
                  </div>
                  {viewingCustomer.details?.customer?.address && (
                    <div className="info-item">
                      <MapPin size={16} />
                      <span>
                        {viewingCustomer.details.customer.address.addressLine1}, 
                        {viewingCustomer.details.customer.address.city}, 
                        {viewingCustomer.details.customer.address.state}
                      </span>
                    </div>
                  )}
                </div>

                <div className="customer-stats-section">
                  <h3>Customer Statistics</h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-value">{viewingCustomer.details?.stats?.totalOrders || 0}</span>
                      <span className="stat-label">Total Orders</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">
                        LKR{(viewingCustomer.details?.stats?.totalSpent || 0).toFixed(2)}
                      </span>
                      <span className="stat-label">Total Spent</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">
                        LKR{(viewingCustomer.details?.stats?.avgOrderValue || 0).toFixed(2)}
                      </span>
                      <span className="stat-label">Avg. Order Value</span>
                    </div>
                  </div>
                </div>

                <div className="recent-orders-section">
                  <div className="section-header">
                    <h3>Recent Orders</h3>
                    {viewingCustomer.details?.recentOrders?.length > 0 && (
                      <button 
                        className="view-all-btn"
                        onClick={() => setShowAllOrders(!showAllOrders)}
                      >
                        {showAllOrders ? 'Hide' : 'View All'}
                      </button>
                    )}
                  </div>
                  <div className="recent-orders-list">
                  {viewingCustomer.details?.recentOrders?.length > 0 ? (
                    <>
                      {/* Always show the first 3 orders */}
                      {viewingCustomer.details.recentOrders.slice(0, 3).map((order) => (
                        <div className="order-item" key={order.id}>
                          <div className="order-icon">
                            <ShoppingBag size={16} />
                          </div>
                          <div className="order-details">
                            <div className="order-top">
                              <span className="order-number">#{order.orderNumber || order.id}</span>
                              <span className="order-date">{formatDate(order.orderDate)}</span>
                            </div>
                            <div className="order-bottom">
                              <span className="order-total">LKR{order.total.toFixed(2)}</span>
                              <span className={`order-status ${order.status.toLowerCase()}`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {/* Show remaining orders when showAllOrders is true */}
                      {showAllOrders && viewingCustomer.details.recentOrders.slice(3).map((order) => (
                        <div className="order-item" key={order.id}>
                          <div className="order-icon">
                            <ShoppingBag size={16} />
                          </div>
                          <div className="order-details">
                            <div className="order-top">
                              <span className="order-number">#{order.orderNumber || order.id}</span>
                              <span className="order-date">{formatDate(order.orderDate)}</span>
                            </div>
                            <div className="order-bottom">
                              <span className="order-total">LKR{order.total.toFixed(2)}</span>
                              <span className={`order-status ${order.status.toLowerCase()}`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                   </>
                    ) : (
                      <p className="no-orders">No recent orders</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Customers