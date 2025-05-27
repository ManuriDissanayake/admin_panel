"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
} from "lucide-react"
import "./orders.css"

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "descending" })
  const [currentPage, setCurrentPage] = useState(1)
  const [viewingOrder, setViewingOrder] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const itemsPerPage = 5
  const statusOptions = ["ALL", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]

  // Fetch orders from backend
  useEffect(() => {
    const fetchOrders = async () => {
      if (searchTerm.length > 0 && searchTerm.length < 3) return
      try {
        setLoading(true)
        const response = await fetch(
          `http://localhost:8080/admin/orders?search=${searchTerm}&status=${statusFilter === "All" ? "" : statusFilter}`
        )
        const data = await response.json()
        setOrders(data)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching orders:", error)
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(() => {
      fetchOrders()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm, statusFilter])

  // Update order status
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:8080/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (response.ok) {
        const updatedOrder = await response.json()
        setOrders(orders.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        ))
        
        if (viewingOrder && viewingOrder.id === orderId) {
          setViewingOrder(updatedOrder)
        }
      }
    } catch (error) {
      console.error("Error updating order status:", error)
    }
  }

  // View order details
  const handleViewOrder = async (order) => {
    try {
      const response = await fetch(`http://localhost:8080/admin/orders/${order.id}`)
      const data = await response.json()
      setViewingOrder(data)
      setIsModalOpen(true)
    } catch (error) {
      console.error("Error fetching order details:", error)
    }
  }

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "PROCESSING":
        return <Package size={16} />
      case "SHIPPED":
        return <Truck size={16} />
      case "DELIVERED":
        return <CheckCircle size={16} />
      case "CANCELLED":
        return <XCircle size={16} />
      default:
        return <Package size={16} />
    }
  }

  // Sort orders
  const sortedOrders = [...orders].sort((a, b) => {
    if (!sortConfig.key) return 0

    let aValue = a[sortConfig.key]
    let bValue = b[sortConfig.key]

    // Handle date sorting
    if (sortConfig.key === "orderDate") {
      aValue = new Date(a.orderDate)
      bValue = new Date(b.orderDate)
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
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage)
  const paginatedOrders = sortedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Handle sort
  const requestSort = (key) => {
    let direction = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>Orders</h1>
      </div>

      <div className="filters-container">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="status-filter">
          <Filter size={18} className="filter-icon" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="status-select">
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th onClick={() => requestSort("orderNumber")}>
                <div className="th-content">
                  Order ID
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th onClick={() => requestSort("customerName")}>
                <div className="th-content">
                  Customer
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th onClick={() => requestSort("orderDate")}>
                <div className="th-content">
                  Date
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th onClick={() => requestSort("total")}>
                <div className="th-content">
                  Total
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
            {loading ? (
              <tr>
                <td colSpan="6" className="loading">
                  Loading orders...
                </td>
              </tr>
            ) : paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-orders">
                  No orders found.
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>
                    <div className="customer-info">
                      <span className="customer-name">{order.customerName}</span>
                      <span className="customer-email">{order.customerEmail}</span>
                    </div>
                  </td>
                  <td>{formatDate(order.orderDate)}</td>
                  <td>LKR{order.total.toFixed(2)}</td>
                  <td>
                    <select
                      className={`status-dropdown ${order.status.toLowerCase()}`}
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    >
                      {statusOptions
                        .filter((status) => status !== "All")
                        .map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="view-btn" onClick={() => handleViewOrder(order)} title="View Order">
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
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

      {/* Order Details Modal */}
      {isModalOpen && viewingOrder && (
        <div className="modal-overlay">
          <div className="modal order-modal">
            <div className="modal-header">
              <h2>Order Details - {viewingOrder.orderNumber}</h2>
              <button className="close-modal" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="order-details-grid">
                <div className="order-info-section">
                  <h3>Order Information</h3>
                  <div className="info-row">
                    <span className="info-label">Date:</span>
                    <span className="info-value">{formatDate(viewingOrder.orderDate)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Status:</span>
                    <span className={`info-value status-text ${viewingOrder.status.toLowerCase()}`}>
                      {getStatusIcon(viewingOrder.status)}
                      {viewingOrder.status}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Payment Method:</span>
                    <span className="info-value">{viewingOrder.paymentMethod?.cardType || "Unknown"}</span>
                  </div>
                </div>

                <div className="customer-info-section">
                  <h3>Customer Information</h3>
                  <div className="info-row">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{viewingOrder.customerName}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{viewingOrder.customerEmail}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Phone:</span>
                    <span className="info-value">{viewingOrder.customerPhone || "Not provided"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Address:</span>
                    <span className="info-value">
                      {viewingOrder.shippingAddress?.addressLine1}, {viewingOrder.shippingAddress?.city}, {viewingOrder.shippingAddress?.state} {viewingOrder.shippingAddress?.postcode}
                    </span>
                  </div>
                </div>
              </div>

              <div className="order-items-section">
                <h3>Order Items</h3>
                <table className="order-items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingOrder.items?.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {item.imageUrl && (
                              <img 
                                src={item.imageUrl} 
                                alt={item.productName} 
                                style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '10px' }}
                              />
                            )}
                            <div>
                              <div>{item.productName}</div>
                              {item.size && <div style={{ fontSize: '0.8rem', color: '#666' }}>Size: {item.size}</div>}
                            </div>
                          </div>
                        </td>
                        <td>LKR{item.price.toFixed(2)}</td>
                        <td>{item.quantity}</td>
                        <td>LKR{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="order-total-label">
                        Subtotal
                      </td>
                      <td className="order-total-value">LKR{viewingOrder.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="order-total-label">
                        Shipping
                      </td>
                      <td className="order-total-value">LKR{viewingOrder.shippingCost.toFixed(2)}</td>
                    </tr>
                    <tr className="order-grand-total">
                      <td colSpan="3" className="order-total-label">
                        Total
                      </td>
                      <td className="order-total-value">
                        LKR{viewingOrder.total.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="order-status-section">
                <h3>Update Status</h3>
                <div className="status-update-container">
                  <select
                    className={`status-update-dropdown ${viewingOrder.status.toLowerCase()}`}
                    value={viewingOrder.status}
                    onChange={(e) => handleStatusChange(viewingOrder.id, e.target.value)}
                  >
                    {statusOptions
                      .filter((status) => status !== "All")
                      .map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                  </select>
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

export default Orders