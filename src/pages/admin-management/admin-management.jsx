"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  Shield,
  ShieldAlert,
  User,
  Eye,
  EyeOff,
} from "lucide-react"
import "./admin-management.css"

const AdminManagement = () => {
  const [admins, setAdmins] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState(null)
  const [currentUserRole, setCurrentUserRole] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false) // Add this line for password visibility toggle

  const itemsPerPage = 5
  const roles = ["Super Admin", "Admin", "Product Manager", "Order Manager", "Customer Support"]

  // Get current user role from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    setCurrentUserRole(user.role || "")
  }, [])

  // Fetch admins when currentUserRole changes
  useEffect(() => {
    const fetchAdmins = async () => {
      setIsLoading(true)
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}")
        const response = await fetch("http://localhost:8080/api/admins", {
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Role": user.role || "",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
        })
        
        if (!response.ok) {
          throw new Error("Failed to fetch admins")
        }
        
        const data = await response.json()
        setAdmins(data)
      } catch (error) {
        console.error("Failed to fetch admins:", error)
        alert("Failed to fetch admins. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    if (currentUserRole) {
      fetchAdmins()
    }
  }, [currentUserRole])

  // Check if current user is super admin
  const isSuperAdmin = currentUserRole === "Super Admin"

  // Filter admins based on search term
  const filteredAdmins = admins.filter((admin) => {
    return (
      admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.role?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Sort admins
  const sortedAdmins = [...filteredAdmins].sort((a, b) => {
    if (!sortConfig.key) return 0

    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (aValue < bValue) {
      return sortConfig.direction === "ascending" ? -1 : 1
    }
    if (aValue > bValue) {
      return sortConfig.direction === "ascending" ? 1 : -1
    }
    return 0
  })

  // Pagination
  const totalPages = Math.ceil(sortedAdmins.length / itemsPerPage)
  const paginatedAdmins = sortedAdmins.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Handle sort
  const requestSort = (key) => {
    let direction = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Handle edit admin
  const handleEditAdmin = (admin) => {
    setEditingAdmin({ ...admin })
    setIsModalOpen(true)
    setShowPassword(false) // Reset password visibility when editing
  }

  // Handle add new admin
  const handleAddAdmin = () => {
    setEditingAdmin({
      name: "",
      email: "",
      password: "",
      role: "Admin",
      status: "Active",
    })
    setIsModalOpen(true)
    setShowPassword(false) // Reset password visibility when adding
  }

  // Handle save admin
  const handleSaveAdmin = async () => {
    try {
      // Add password validation for new admins
      if (!editingAdmin.id && (!editingAdmin.password || editingAdmin.password.length < 6)) {
        throw new Error("Password is required and must be at least 6 characters")
      }

      const user = JSON.parse(localStorage.getItem("user") || {})
      const url = editingAdmin.id 
        ? `http://localhost:8080/api/admins/${editingAdmin.id}`
        : "http://localhost:8080/api/admins"
      
      const method = editingAdmin.id ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Role": user.role || "",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(editingAdmin),
      })
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save admin");
      }
  
      const updatedAdmin = await response.json();
      if (editingAdmin.id) {
        setAdmins(admins.map(a => a.id === updatedAdmin.id ? updatedAdmin : a));
      } else {
        setAdmins([...admins, updatedAdmin]);
      }
      setIsModalOpen(false);
      setEditingAdmin(null);
    } catch (error) {
      console.error("Error saving admin:", error);
      alert(error.message || "Failed to save admin");
    }
  };

  // Handle delete admin
  const handleDeleteAdmin = async (adminId) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || {})
      const response = await fetch(`http://localhost:8080/api/admins/${adminId}`, {
        method: "DELETE",
        headers: {
          "X-Admin-Role": user.role || "",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to delete admin")
      }

      setAdmins(admins.filter(a => a.id !== adminId))
      setDeleteConfirmation(null)
    } catch (error) {
      console.error("Error deleting admin:", error)
      alert(error.message || "Failed to delete admin")
    }
  }

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case "Super Admin":
        return <ShieldAlert size={16} className="role-icon super-admin" />
      case "Admin":
        return <Shield size={16} className="role-icon admin" />
      default:
        return <User size={16} className="role-icon" />
    }
  }

  if (isLoading) {
    return <div className="loading-container">Loading admins...</div>
  }

  return (
    <div className="admin-management-container">
      <div className="admin-header">
        <h1>Admin Management</h1>
        {isSuperAdmin && (
          <button className="add-admin-btn" onClick={handleAddAdmin}>
            <Plus size={16} />
            Add Admin
          </button>
        )}
      </div>

      <div className="filters-container">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search admins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="admins-table-container">
        <table className="admins-table">
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
              <th onClick={() => requestSort("role")}>
                <div className="th-content">
                  Role
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th onClick={() => requestSort("lastLogin")}>
                <div className="th-content">
                  Last Login
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
            {paginatedAdmins.map((admin) => (
              <tr key={admin.id}>
                <td>{admin.name}</td>
                <td>{admin.email}</td>
                <td>
                  <div className="role-container">
                    {getRoleIcon(admin.role)}
                    <span>{admin.role}</span>
                  </div>
                </td>
                <td>{admin.lastLogin}</td>
                <td>
                  <span className={`status-badge ${admin.status.toLowerCase()}`}>{admin.status}</span>
                </td>
                <td>
                  <div className="action-buttons">
                    {isSuperAdmin && (
                      <button className="edit-btn" onClick={() => handleEditAdmin(admin)} title="Edit Admin">
                        <Edit size={16} />
                      </button>
                    )}
                    {isSuperAdmin && admin.role !== "Super Admin" && (
                      <button
                        className="delete-btn"
                        onClick={() => setDeleteConfirmation(admin.id)}
                        title="Delete Admin"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {paginatedAdmins.length === 0 && (
              <tr>
                <td colSpan="6" className="no-admins">
                  No admins found.
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

      {/* Admin Edit/Add Modal */}
      {isModalOpen && editingAdmin && (
        <div className="modall-overlay">
          <div className="modall">
            <div className="modal-header">
              <h2>{editingAdmin.id ? "Edit Admin" : "Add New Admin"}</h2>
              <button className="close-modal" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="adminName">Name</label>
                <input
                  type="text"
                  id="adminName"
                  value={editingAdmin.name}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
                  placeholder="Enter admin name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="adminEmail">Email</label>
                <input
                  type="email"
                  id="adminEmail"
                  value={editingAdmin.email}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                  placeholder="Enter your email"
                />
              </div>

              {/* Updated password field with visibility toggle */}
              {!editingAdmin.id && (
                <div className="form-group">
                  <label htmlFor="adminPassword">Password</label>
                  <div className="password-input-container">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="adminPassword"
                      value={editingAdmin.password}
                      onChange={(e) => setEditingAdmin({ ...editingAdmin, password: e.target.value })}
                      placeholder="Enter password (min 6 characters)"
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="adminRole">Role</label>
                <select
                  id="adminRole"
                  value={editingAdmin.role}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, role: e.target.value })}
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="adminStatus">Status</label>
                <select
                  id="adminStatus"
                  value={editingAdmin.status}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleSaveAdmin}>
                Save Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="modal-overlay">
          <div className="modal delete-modal">
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button className="close-modal" onClick={() => setDeleteConfirmation(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p>Are you sure you want to delete this admin? This action cannot be undone.</p>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setDeleteConfirmation(null)}>
                Cancel
              </button>
              <button className="delete-confirm-btn" onClick={() => handleDeleteAdmin(deleteConfirmation)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminManagement