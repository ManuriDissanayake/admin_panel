"use client"

import { useState, useEffect } from "react"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, X, Eye, XCircle, Star, MessageSquare } from 'lucide-react'
import "./reviews.css"

const Reviews = () => {
  const [reviews, setReviews] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "descending" })
  const [currentPage, setCurrentPage] = useState(1)
  const [viewingReview, setViewingReview] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState(null)

  const itemsPerPage = 5

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/admin/feedbacks');
        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }
        const data = await response.json();
        
        // Ensure all reviews have the expected structure
        const validatedReviews = data.map(review => ({
          ...review,
          product: review.product || { name: 'N/A' },
          user: review.user || { name: 'N/A' },
          comment: review.comment || 'No comment',
          rating: review.rating || 0,
          createdAt: review.createdAt || new Date().toISOString()
        }));
        
        setReviews(validatedReviews);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, []);

  // Filter reviews based on search term
  const filteredReviews = reviews.filter((review) => {
    return (
      review.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Sort reviews
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Handle date sorting
    if (sortConfig.key === "createdAt") {
      try {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      } catch (e) {
        console.error("Error parsing dates for sorting:", e);
        return 0;
      }
    }

    if (aValue < bValue) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedReviews.length / itemsPerPage)
  const paginatedReviews = sortedReviews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Handle sort
  const requestSort = (key) => {
    let direction = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Handle view review details
  const handleViewReview = (review) => {
    setViewingReview(review)
    setIsModalOpen(true)
  }

  // Handle delete review
  const handleDeleteReview = async (reviewId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/admin/feedbacks/${reviewId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete review')
      }
      
      setReviews(reviews.filter(review => review.id !== reviewId))
      if (viewingReview && viewingReview.id === reviewId) {
        setIsModalOpen(false)
      }
      setDeleteConfirmation(null) // Close confirmation dialog after deletion
    } catch (err) {
      setError(err.message)
    }
  }


  // Format date
  const formatDate = (dateString) => {
    try {
      // Handle both ISO format with milliseconds and without
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Fallback for invalid dates
        return dateString;
      }
      const options = { year: "numeric", month: "long", day: "numeric" };
      return date.toLocaleDateString(undefined, options);
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString; // Return the original string if parsing fails
    }
  }

  // Render stars based on rating
  const renderStars = (rating) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={i <= rating ? "star-filled" : "star-empty"}
          fill={i <= rating ? "currentColor" : "none"}
        />
      )
    }
    return <div className="star-rating">{stars}</div>
  }

  if (isLoading) {
    return <div className="reviews-container">Loading reviews...</div>
  }

  if (error) {
    return <div className="reviews-container">Error: {error}</div>
  }

  return (
    <div className="reviews-container">
      <div className="reviews-header">
        <h1>Reviews</h1>
      </div>

      <div className="filters-container">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="reviews-table-container">
        <table className="reviews-table">
          <thead>
            <tr>
              <th onClick={() => requestSort("product.name")}>
                <div className="th-content">
                  Product
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th onClick={() => requestSort("user.name")}>
                <div className="th-content">
                  Customer
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th onClick={() => requestSort("rating")}>
                <div className="th-content">
                  Rating
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th onClick={() => requestSort("comment")}>
                <div className="th-content">
                  Comment
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th onClick={() => requestSort("createdAt")}>
                <div className="th-content">
                  Date
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedReviews.map((review) => (
              <tr key={review.id}>
                <td>{review.product?.name || 'N/A'}</td>
                <td>{review.user?.name || 'N/A'}</td>
                <td>{renderStars(review.rating)}</td>
                <td className="review-comment-cell">{review.comment || 'No comment'}</td>
                <td>{formatDate(review.createdAt)}</td>
                <td>
                  <div className="action-buttons">
                    <button className="view-btn" onClick={() => handleViewReview(review)} title="View Review">
                      <Eye size={16} />
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => setDeleteConfirmation(review.id)}
                      title="Delete Review"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {paginatedReviews.length === 0 && (
              <tr>
                <td colSpan="6" className="no-reviews">
                  No reviews found.
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

      {/* Review Details Modal */}
      {isModalOpen && viewingReview && (
        <div className="modal-overlay">
          <div className="modal review-modal">
            <div className="modal-header">
              <h2>Review Details</h2>
              <button className="close-modal" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="review-details">
                <div className="review-product-info">
                  <h3>{viewingReview.product?.name || 'N/A'}</h3>
                  <div className="review-meta">
                    <div className="review-rating">
                      {renderStars(viewingReview.rating)}
                      <span className="rating-text">{viewingReview.rating}/5</span>
                    </div>
                    <div className="review-date">{formatDate(viewingReview.createdAt)}</div>
                  </div>
                </div>

                <div className="review-content">
                  <div className="review-comment">
                    <MessageSquare size={16} />
                    <p>{viewingReview.comment}</p>
                  </div>
                </div>

                <div className="review-customer">
                  <div className="customer-avatar">
                    <span className="avatar-initials">
                      {viewingReview.user?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || 'NA'}
                    </span>
                  </div>
                  <div className="customer-info">
                    <div className="customer-name">{viewingReview.user?.name || 'N/A'}</div>
                    <div className="customer-type">Verified Buyer</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="deletee-btn"
                onClick={() => setDeleteConfirmation(viewingReview.id)} // Change this to open confirmation
              >
                <XCircle size={16} />
                Delete Review
              </button>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                Close
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
              <p>Are you sure you want to delete this review? This action cannot be undone.</p>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setDeleteConfirmation(null)}>
                Cancel
              </button>
              <button 
                className="delete-confirm-btn" 
                onClick={() => handleDeleteReview(deleteConfirmation)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reviews