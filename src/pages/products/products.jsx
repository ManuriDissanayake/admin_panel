"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Filter, Edit, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, X } from "lucide-react"
import "./products.css"

const Products = () => {
  // State for products
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Hardcoded categories data
  const categoriesData = {
    mainCategories: [
      { id: 1, name: "Men" },
      { id: 2, name: "Women" },
      { id: 3, name: "Accessories" }
    ],
    subCategories: {
      1: [ // Men
        { id: 7, name: "T-Shirts" },
        { id: 8, name: "Jeans" },
        { id: 11, name: "Polo Shirts" },
        { id: 12, name: "Hoodies" },
        { id: 13, name: "Chinos" },
        { id: 14, name: "Shirts" }
      ],
      2: [ // Women
        { id: 4, name: "Dresses" },
        { id: 5, name: "Blouses" },
        { id: 6, name: "Pants" },
        { id: 15, name: "Cardigans" },
        { id: 16, name: "Skirts" }
      ],
      3: [ // Accessories
        { id: 9, name: "Wallets" },
        { id: 10, name: "Belts" },
        { id: 17, name: "Handbags" },
        { id: 18, name: "Watches" },
        { id: 19, name: "Sunglasses" },
        { id: 20, name: "Jewelry" }
      ]
    }
  }

  // Size options for different categories
  const sizeOptions = {
    // Men's clothing sizes
    "T-Shirts": ["XS", "S", "M", "L", "XL", "XXL"],
    "Jeans": ["28", "30", "32", "34", "36", "38"],
    "Polo Shirts": ["XS", "S", "M", "L", "XL", "XXL"],
    "Hoodies": ["XS", "S", "M", "L", "XL", "XXL"],
    "Chinos": ["28", "30", "32", "34", "36", "38"],
    "Shirts": ["XS", "S", "M", "L", "XL", "XXL"],
    
    // Women's clothing sizes
    "Dresses": ["XXS", "XS", "S", "M", "L", "XL"],
    "Blouses": ["XXS", "XS", "S", "M", "L", "XL"],
    "Pants": ["24", "26", "28", "30", "32", "34"],
    "Cardigans": ["XXS", "XS", "S", "M", "L", "XL"],
    "Skirts": ["XXS", "XS", "S", "M", "L", "XL"],
    
    // Accessories - most are free size
    "Wallets": ["Free Size"],
    "Belts": ["Free Size"],
    "Handbags": ["Free Size"],
    "Watches": ["Free Size"],
    "Sunglasses": ["Free Size"],
    "Jewelry": ["Free Size"]
  }

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedSubcategory, setSelectedSubcategory] = useState("All")
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null })
  const [currentPage, setCurrentPage] = useState(1)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState(null)
  const [imageUrl, setImageUrl] = useState("")
  const [transparentImageUrl, setTransparentImageUrl] = useState("")
  const [sizeStocks, setSizeStocks] = useState({})
  const [availableSizes, setAvailableSizes] = useState([])
  const [isSaving, setIsSaving] = useState(false)

  const itemsPerPage = 5

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsRes = await fetch('http://localhost:8080/api/admin/products/with-category-names')
        if (!productsRes.ok) throw new Error('Failed to fetch products')
        const productsData = await productsRes.json()
        setProducts(productsData)
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Get available sizes when subcategory changes in edit mode
  useEffect(() => {
    if (editingProduct?.subcategory) {
      const sizes = sizeOptions[editingProduct.subcategory] || ["Free Size"]
      setAvailableSizes(sizes)
      
      // Initialize size stocks if adding new product
      if (!editingProduct.id) {
        const initialStocks = {}
        sizes.forEach(size => {
          initialStocks[size] = 0
        })
        setSizeStocks(initialStocks)
      }
    }
  }, [editingProduct?.subcategory])

  // Filter products based on search term and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         product.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === "All" || 
                          product.mainCategoryName === selectedCategory
    
    const matchesSubcategory = selectedSubcategory === "All" || 
                              product.categoryName === selectedSubcategory
                              
    return matchesSearch && matchesCategory && matchesSubcategory
  })

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
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
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage)
  const paginatedProducts = sortedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Handle sort
  const requestSort = (key) => {
    let direction = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Handle edit product
  const handleEditProduct = async (product) => {
    try {
      // Fetch variants to get size stocks
      const res = await fetch(`http://localhost:8080/api/products/${product.id}/variants`)
      if (!res.ok) throw new Error('Failed to fetch variants')
      
      const variants = await res.json()
      const stocks = {}
      variants.forEach(variant => {
        stocks[variant.size] = variant.stock
      })
      
      setSizeStocks(stocks)
      
      setEditingProduct({
        ...product,
        mainCategory: product.mainCategoryName, // Store main category name
        category: product.mainCategoryName,    // For dropdown display
        subcategory: product.categoryName      // For dropdown display
      })
      setImageUrl(product.imageUrl)
      setTransparentImageUrl(product.transparentImageUrl || "")
      setIsModalOpen(true)
    } catch (err) {
      console.error("Error fetching variants:", err)
    }
  }

  const handleAddProduct = () => {
    setEditingProduct({
      id: null,
      name: "",
      mainCategory: "Men", // Store main category name
      category: "Men",     // For dropdown display
      subcategory: "T-Shirts", // Default to first subcategory of Men
      price: 0,
      stock: 0,
      description: "",
      imageUrl: "",
      transparentImageUrl: ""
    })
    setImageUrl("")
    setTransparentImageUrl("")
    setIsModalOpen(true)
  }

  // Handle size stock change
  const handleSizeStockChange = (size, value) => {
    const numValue = parseInt(value)
    if (isNaN(numValue) || numValue < 0) return
    
    setSizeStocks(prev => ({
      ...prev,
      [size]: numValue
    }))
  }

  // Handle save product
  const handleSaveProduct = async () => {
    setIsSaving(true)
    try {
      // Calculate total stock from size variants
      const totalStock = Object.values(sizeStocks).reduce((sum, stock) => sum + (parseInt(stock) || 0), 0)
      
      const productData = {
        name: editingProduct.name,
        description: editingProduct.description,
        price: parseFloat(editingProduct.price) || 0,
        stock: totalStock,
        imageUrl: imageUrl || "/placeholder.svg",
        transparentImageUrl: transparentImageUrl || "/placeholder-transparent.svg",
        categoryName: editingProduct.subcategory // Using subcategory name as category name
      }

      // Validate required fields
      if (!productData.name || !productData.categoryName) {
        throw new Error('Product name and category are required')
      }

      let response
      if (editingProduct.id) {
        // Update existing product - include all variants, even with 0 stock
        response = await fetch(`http://localhost:8080/api/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            product: productData,
            variants: Object.entries(sizeStocks).map(([size, stock]) => ({
              size,
              stock: parseInt(stock) || 0
            }))
          })
        })
      } else {
        // Add new product
        response = await fetch('http://localhost:8080/api/admin/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            product: productData,
            variants: Object.entries(sizeStocks)
              .filter(([_, stock]) => stock > 0)
              .map(([size, stock]) => ({
                size,
                stock: parseInt(stock) || 0
              }))
          })
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save product')
      }

      // Refresh products
      const productsRes = await fetch('http://localhost:8080/api/admin/products/with-category-names')
      if (!productsRes.ok) throw new Error('Failed to fetch products')
      setProducts(await productsRes.json())

      setIsModalOpen(false)
      setEditingProduct(null)
      setImageUrl("")
    } catch (err) {
      console.error("Error saving product:", err)
      alert("Failed to save product: " + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete product
  const handleDeleteProduct = async (productId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/admin/products/${productId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete product')
      }

      // Refresh products
      const productsRes = await fetch('http://localhost:8080/api/admin/products/with-category-names')
      if (!productsRes.ok) throw new Error('Failed to fetch products')
      setProducts(await productsRes.json())

      setDeleteConfirmation(null)
    } catch (err) {
      console.error("Error deleting product:", err)
      alert("Failed to delete product: " + err.message)
    }
  }

  if (loading) return <div className="loading">Loading products...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="products-container">
      <div className="products-header">
        <h1>Products</h1>
        <button className="add-product-btn" onClick={handleAddProduct}>
          <Plus size={16} />
          Add Product
        </button>
      </div>

      <div className="filters-container">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="category-filter">
          <Filter size={18} className="filter-icon" />
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              setSelectedSubcategory("All") // Reset subcategory when main category changes
            }}
            className="category-select"
          >
            <option value="All">All Categories</option>
            {categoriesData.mainCategories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCategory !== "All" && (
          <div className="category-filter">
            <Filter size={18} className="filter-icon" />
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="category-select"
            >
              <option value="All">All Subcategories</option>
              {categoriesData.mainCategories
                .find(c => c.name === selectedCategory)
                ?.id && categoriesData.subCategories[categoriesData.mainCategories.find(c => c.name === selectedCategory).id]?.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.name}>
                    {subcategory.name}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Image</th>
              <th onClick={() => requestSort("name")}>
                <div className="th-content">
                  Product Name
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th>Description</th>
              <th onClick={() => requestSort("mainCategoryName")}>
                <div className="th-content">
                  Main Category
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th onClick={() => requestSort("categoryName")}>
                <div className="th-content">
                  Subcategory
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th>Sizes</th>
              <th onClick={() => requestSort("price")}>
                <div className="th-content">
                  Price
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th onClick={() => requestSort("stock")}>
                <div className="th-content">
                  Stock
                  <ArrowUpDown size={14} />
                </div>
              </th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((product) => {
              const status = product.stock === 0 ? 'Out of Stock' : 
                           product.stock <= 10 ? 'Low Stock' : 'In Stock'
              
              return (
                <tr key={product.id}>
                  <td>
                    <img src={product.imageUrl || "/placeholder.svg"} alt={product.name} className="product-image" />
                  </td>
                  <td>{product.name}</td>
                  <td className="description-cell">{product.description}</td>
                  <td>{product.mainCategoryName}</td>
                  <td>{product.categoryName}</td>
                  <td>
                    {product.variants?.map(v => v.size).join(", ") || "N/A"}
                  </td>
                  <td>LKR{product.price.toFixed(2)}</td>
                  <td>{product.stock}</td>
                  <td>
                    <span className={`status-badge ${status.toLowerCase().replace(/\s+/g, "-")}`}>
                      {status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="edit-btn" onClick={() => handleEditProduct(product)} title="Edit Product">
                        <Edit size={16} />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => setDeleteConfirmation(product.id)}
                        title="Delete Product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}

            {paginatedProducts.length === 0 && (
              <tr>
                <td colSpan="10" className="no-products">
                  No products found.
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

      {/* Product Edit/Add Modal */}
      {isModalOpen && editingProduct && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>{editingProduct.id ? "Edit Product" : "Add New Product"}</h2>
              <button className="close-modal" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="productName">Product Name</label>
                <input
                  type="text"
                  id="productName"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="mainCategory">Main Category</label>
                  <select
                    id="mainCategory"
                    value={editingProduct.category}
                    onChange={(e) => {
                      const newCategory = e.target.value
                      const mainCategory = categoriesData.mainCategories.find(c => c.name === newCategory)
                      const newSubcategory = categoriesData.subCategories[mainCategory.id]?.[0]?.name || ""
                      
                      setEditingProduct({
                        ...editingProduct,
                        mainCategory: newCategory,
                        category: newCategory,
                        subcategory: newSubcategory
                      })
                    }}
                  >
                    {categoriesData.mainCategories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="subcategory">Subcategory</label>
                  <select
                    id="subcategory"
                    value={editingProduct.subcategory}
                    onChange={(e) => {
                      setEditingProduct({ 
                        ...editingProduct, 
                        subcategory: e.target.value
                      })
                    }}
                  >
                    {editingProduct.category && categoriesData.mainCategories.find(c => c.name === editingProduct.category)?.id && (
                      categoriesData.subCategories[categoriesData.mainCategories.find(c => c.name === editingProduct.category).id]?.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.name}>
                          {subcategory.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="imageUrl">Image URL</label>
                <input
                  type="text"
                  id="imageUrl"
                  placeholder="Enter image URL or leave empty for placeholder"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              {imageUrl && (
                <div className="image-preview">
                  <img src={imageUrl || "/placeholder.svg"} alt="Product preview" className="preview-image" />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="transparentImageUrl">Transparent Image URL</label>
                <input
                  type="text"
                  id="transparentImageUrl"
                  placeholder="Enter transparent image URL or leave empty for placeholder"
                  value={transparentImageUrl}
                  onChange={(e) => setTransparentImageUrl(e.target.value)}
                />
              </div>

              {transparentImageUrl && (
                <div className="image-preview">
                  <img src={transparentImageUrl || "/placeholder-transparent.svg"} alt="Transparent product preview" className="preview-image" />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">Price (LKR)</label>
                  <input
                    type="number"
                    id="price"
                    min="0"
                    step="0.01"
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct({ 
                      ...editingProduct, 
                      price: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>
              </div>

              {availableSizes.length > 0 && (
                <div className="size-stocks-container">
                  <h4>Size Stocks</h4>
                  <div className="size-stocks-grid">
                    {availableSizes.map(size => (
                      <div key={size} className="size-stock-input">
                        <label>{size}</label>
                        <input
                          type="number"
                          min="0"
                          value={sizeStocks[size] || 0}
                          onChange={(e) => handleSizeStockChange(size, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="total-stock">
                    Total Stock: {Object.values(sizeStocks).reduce((sum, stock) => sum + (parseInt(stock) || 0), 0)}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button 
                className="save-btn" 
                onClick={handleSaveProduct}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Product'}
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
              <p>Are you sure you want to delete this product? This action cannot be undone.</p>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setDeleteConfirmation(null)}>
                Cancel
              </button>
              <button className="delete-confirm-btn" onClick={() => handleDeleteProduct(deleteConfirmation)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products