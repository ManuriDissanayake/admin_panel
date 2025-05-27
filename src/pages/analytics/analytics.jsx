"use client"

import { useState, useEffect } from "react"
import { DollarSign, Package, ShoppingCart, Users, ArrowUp, ArrowDown } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import "./analytics.css"

const Analytics = () => {
  const [stats, setStats] = useState([])
  const [weeklySales, setWeeklySales] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [productStats, setProductStats] = useState(null)
  const [categoryDistribution, setCategoryDistribution] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedMainCategory, setSelectedMainCategory] = useState(null)
  const [mainCategories, setMainCategories] = useState([])

  // Fetch all analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch summary stats
        const statsResponse = await fetch('http://localhost:8080/admin/orders/summary')
        if (!statsResponse.ok) throw new Error('Failed to fetch summary stats')
        const statsData = await statsResponse.json()
        
        // Fetch weekly sales
        const weeklyResponse = await fetch('http://localhost:8080/admin/orders/analytics/weekly')
        if (!weeklyResponse.ok) throw new Error('Failed to fetch weekly sales')
        const weeklyData = await weeklyResponse.json()

        // Fetch top products
        const productsResponse = await fetch('http://localhost:8080/admin/orders/analytics/products')
        if (!productsResponse.ok) throw new Error('Failed to fetch top products')
        const productsData = await productsResponse.json()

        // Fetch product statistics
        const productStatsResponse = await fetch('http://localhost:8080/api/admin/products/stats')
        if (!productStatsResponse.ok) throw new Error('Failed to fetch product stats')
        const productStatsData = await productStatsResponse.json()

        // Fetch main categories
        const categoriesResponse = await fetch('http://localhost:8080/api/admin/products/categories')
        if (!categoriesResponse.ok) throw new Error('Failed to fetch categories')
        const categoriesData = await categoriesResponse.json()

        // Extract main categories (those that have children)
        const mainCats = categoriesData.filter(cat => cat.children && cat.children.length > 0)
        setMainCategories(mainCats)

        // Fetch category distribution
        const categoryResponse = await fetch('http://localhost:8080/api/admin/products/category-distribution')
        if (!categoryResponse.ok) throw new Error('Failed to fetch category distribution')
        const categoryData = await categoryResponse.json()

        // Set stats
        setStats([
          {
            title: "Total Revenue",
            value: `$${statsData.totalRevenue.toFixed(2)}`,
            change: `${statsData.revenueChange >= 0 ? '+' : ''}${statsData.revenueChange.toFixed(1)}%`,
            isIncrease: statsData.revenueChange >= 0,
            icon: <DollarSign size={24} />,
            color: "#2563eb",
          },
          {
            title: "Total Orders",
            value: statsData.totalOrders,
            change: `${statsData.ordersChange >= 0 ? '+' : ''}${statsData.ordersChange.toFixed(1)}%`,
            isIncrease: statsData.ordersChange >= 0,
            icon: <ShoppingCart size={24} />,
            color: "#8b5cf6",
          },
          {
            title: "Avg. Order Value",
            value: `⁠ $${statsData.avgOrderValue.toFixed(2)}`,
            change: `⁠ ${statsData.avgOrderValueChange >= 0 ? '+' : ''}${statsData.avgOrderValueChange.toFixed(1)}% `,
            isIncrease: statsData.avgOrderValueChange >= 0,
            icon: <DollarSign size={24} />,
            color: "#2563eb",
          },
          {
            title: "Total Products",
            value: productStatsData.totalProducts,
            change: `${productStatsData.productsChange >= 0 ? '+' : ''}${productStatsData.productsChange.toFixed(1)}%`,
            isIncrease: productStatsData.productsChange >= 0,
            icon: <Package size={24} />,
            color: "#f59e0b",
          },
          {
            title: "Total Customers",
            value: statsData.totalCustomers,
            change: `${statsData.customersChange >= 0 ? '+' : ''}${statsData.customersChange.toFixed(1)}%`,
            isIncrease: statsData.customersChange >= 0,
            icon: <Users size={24} />,
            color: "#10b981",
          },
        ])

        // Transform weekly sales data to match expected format
        const getDateRangeFromWeek = (week, year = new Date().getFullYear()) => {
          const date = new Date(year, 0, 1 + (week - 1) * 7)
          const dayOfWeek = date.getDay()
          const startDate = new Date(date.setDate(date.getDate() - dayOfWeek + 1))
          const endDate = new Date(startDate)
          endDate.setDate(startDate.getDate() + 6)
          
          return {
            start: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            end: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          }
        }

        const formattedWeeklySales = weeklyData.map(item => {
          const range = getDateRangeFromWeek(item.week)
          return {
            ...item,
            label: `Week ${item.week} (${range.start}-${range.end})`,
            week: item.week.toString()
          }
        })
        setWeeklySales(formattedWeeklySales)

        // Set top products
        setTopProducts(productsData)

        // Set product stats
        setProductStats(productStatsData)

        // Set category distribution
        setCategoryDistribution(categoryData)

        setLoading(false)
      } catch (error) {
        console.error("Error fetching analytics data:", error)
        setError(error.message)
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [])

  const handleMainCategoryChange = async (categoryId) => {
    try {
      setSelectedMainCategory(categoryId)
      
      let data
      if (categoryId) {
        const response = await fetch(`http://localhost:8080/api/admin/products/category-distribution?parentId=${categoryId}`)
        if (!response.ok) throw new Error('Failed to fetch filtered category distribution')
        data = await response.json()
      } else {
        const response = await fetch('http://localhost:8080/api/admin/products/category-distribution')
        if (!response.ok) throw new Error('Failed to fetch category distribution')
        data = await response.json()
      }
      
      setCategoryDistribution(data)
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
    }
  }

  const COLORS = ["#2563eb", "#8b5cf6", "#f59e0b", "#10b981", "#64748b", "#ec4899", "#14b8a6"]

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading">Loading analytics data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="error">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
      </div>

      <div className="stats-grid-container">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div className="stat-card" key={index}>
              <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-content">
                <h3 className="stat-title">{stat.title}</h3>
                <p className="stat-value">{stat.value}</p>
                <div className={`stat-change ${stat.isIncrease ? "increase" : "decrease"}`}>
                  {stat.isIncrease ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  <span>{stat.change}</span>
                  <span className="period">vs last period</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Weekly Sales</h3>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklySales}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="label"
                  axisLine={false} 
                  tickLine={false}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  label={{ value: 'Sales ($)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Total Sales']}
                />
                <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Top Selling Products</h3>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topProducts}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="quantity"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [`${value} units`, props.payload.name]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Stock Levels</h3>
          </div>
          <div className="chart-content">
            {productStats && (
              <div className="stock-levels">
                <div className="stock-metric">
                  <span className="metric-label">Low Stock Products:</span>
                  <span className="metric-value">{productStats.lowStockProducts}</span>
                </div>
                <div className="stock-metric">
                  <span className="metric-label">Out of Stock:</span>
                  <span className="metric-value">{productStats.outOfStockProducts}</span>
                </div>
                <div className="stock-metric">
                  <span className="metric-label">Average Stock:</span>
                  <span className="metric-value">{productStats.averageStock.toFixed(1)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Product Category Distribution</h3>
              <select className="selecttt"
                onChange={(e) => handleMainCategoryChange(e.target.value === "" ? null : e.target.value)}
                value={selectedMainCategory || ''}
              >
                <option value="">All Categories</option>
                {mainCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="chart-content">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="categoryName"
                  axisLine={false} 
                  tickLine={false}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  label={{ value: 'Number of Products', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value, name, props) => [
                    value, 
                    props.payload.parentCategoryName 
                      ? `Subcategory of ${props.payload.parentCategoryName}`
                      : 'Main Category'
                  ]}
                />
                <Bar dataKey="productCount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics