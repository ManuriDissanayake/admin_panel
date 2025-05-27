"use client"

import { useState, useEffect, useCallback } from "react"
import { FileText, Download, Calendar, Filter, BarChart3, LineChart, PieChart, TableIcon, Loader } from "lucide-react"
import { Bar, Pie } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js'
import "./reports.css"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState("sales")
  const [dateRange, setDateRange] = useState("last30")
  const [exportFormat, setExportFormat] = useState("pdf")
  const [isLoading, setIsLoading] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Report types
  const reportTypes = [
    { id: "sales", name: "Sales Report", icon: <BarChart3 size={18} /> },
    { id: "orders", name: "Order Report", icon: <TableIcon size={18} /> },
    { id: "customers", name: "Customer Report", icon: <PieChart size={18} /> },
    { id: "products", name: "Product Performance", icon: <LineChart size={18} /> },
  ]

  // Date range options
  const dateRanges = [
    { id: "today", name: "Today" },
    { id: "yesterday", name: "Yesterday" },
    { id: "last7", name: "Last 7 Days" },
    { id: "last30", name: "Last 30 Days" },
    { id: "thisMonth", name: "This Month" },
    { id: "lastMonth", name: "Last Month" },
    { id: "custom", name: "Custom Range" },
  ]

  // Export format options
  const exportFormats = [
    { id: "pdf", name: "PDF" },
    { id: "excel", name: "Excel" },
    { id: "csv", name: "CSV" },
  ]

  // Calculate date ranges
  const getDateRange = () => {
    const now = new Date()
    const result = { start: new Date(), end: new Date() }

    switch (dateRange) {
      case "today":
        result.start.setHours(0, 0, 0, 0)
        result.end.setHours(23, 59, 59, 999)
        break
      case "yesterday":
        result.start.setDate(now.getDate() - 1)
        result.start.setHours(0, 0, 0, 0)
        result.end.setDate(now.getDate() - 1)
        result.end.setHours(23, 59, 59, 999)
        break
      case "last7":
        result.start.setDate(now.getDate() - 7)
        result.start.setHours(0, 0, 0, 0)
        break
      case "last30":
        result.start.setDate(now.getDate() - 30)
        result.start.setHours(0, 0, 0, 0)
        break
      case "thisMonth":
        result.start = new Date(now.getFullYear(), now.getMonth(), 1)
        result.start.setHours(0, 0, 0, 0)
        break
      case "lastMonth":
        result.start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        result.start.setHours(0, 0, 0, 0)
        result.end = new Date(now.getFullYear(), now.getMonth(), 0)
        result.end.setHours(23, 59, 59, 999)
        break
      case "custom":
        if (startDate && endDate) {
          result.start = new Date(startDate)
          result.end = new Date(endDate)
          result.start.setHours(0, 0, 0, 0)
          result.end.setHours(23, 59, 59, 999)
        }
        break
      default:
        break
    }

    return {
      start: result.start.toISOString(),
      end: result.end.toISOString()
    }
  }

  // Fetch sales report data
  const fetchSalesReport = async () => {
    try {
      const { start, end } = getDateRange()
      const response = await fetch(`http://localhost:8080/admin/orders/analytics/weekly?start=${start}&end=${end}`)
      const weeklyData = await response.json()

      // Get dashboard summary for metrics
      const summaryResponse = await fetch('http://localhost:8080/admin/orders/summary')
      const summary = await summaryResponse.json()

      // Get recent orders for table
      const ordersResponse = await fetch('http://localhost:8080/admin/orders/recent?limit=10')
      const recentOrders = await ordersResponse.json()

      return {
        title: "Sales Report",
        description: "Overview of sales performance for the selected period.",
        metrics: [
          { name: "Total Sales", value: `LKR${summary.totalRevenue?.toFixed(2) || '0.00'}` },
          { name: "Average Order Value", value: `LKR${summary.avgOrderValue?.toFixed(2) || '0.00'}` },
          { name: "Total Orders", value: summary.totalOrders || '0' },
          { name: "Revenue Growth", value: `${summary.revenueChange?.toFixed(2) || '0.00'}%` },
        ],
        chartData: weeklyData,
        table: {
          headers: ["Order #", "Date", "Customer", "Status", "Total"],
          rows: recentOrders.map(order => [
            order.orderNumber,
            new Date(order.orderDate).toLocaleDateString(),
            order.customerName,
            order.status,
            `LKR${order.total.toFixed(2)}`
          ])
        }
      }
    } catch (error) {
      console.error("Error fetching sales report:", error)
      return null
    }
  }

  // Fetch orders report data
  const fetchOrdersReport = async () => {
    try {
      const { start, end } = getDateRange()
      const response = await fetch(`http://localhost:8080/admin/orders?start=${start}&end=${end}`)
      const orders = await response.json()

      // Calculate metrics
      const totalOrders = orders.length
      const completedOrders = orders.filter(o => o.status === "DELIVERED").length
      const cancelledOrders = orders.filter(o => o.status === "CANCELLED").length
      const pendingOrders = orders.filter(o => ["PROCESSING", "PENDING"].includes(o.status)).length

      return {
        title: "Order Report",
        description: "Detailed breakdown of orders for the selected period.",
        metrics: [
          { name: "Total Orders", value: totalOrders },
          { name: "Completed Orders", value: completedOrders },
          { name: "Cancelled Orders", value: cancelledOrders },
          { name: "Pending Orders", value: pendingOrders },
        ],
        table: {
          headers: ["Order #", "Date", "Customer", "Status", "Total"],
          rows: orders.map(order => [
            order.orderNumber,
            new Date(order.orderDate).toLocaleDateString(),
            order.customerName,
            order.status,
            `LKR${order.total.toFixed(2)}`
          ])
        }
      }
    } catch (error) {
      console.error("Error fetching orders report:", error)
      return null
    }
  }

  // Fetch customers report data
  const fetchCustomersReport = async () => {
    try {
      const response = await fetch('http://localhost:8080/admin/customers')
      const customers = await response.json()

      // Calculate metrics
      const totalCustomers = customers.length
      const activeCustomers = customers.filter(c => c.status === "Active").length
      const avgOrderValue = customers.reduce((sum, c) => sum + c.avgOrderValue, 0) / totalCustomers || 0

      return {
        title: "Customer Report",
        description: "Analysis of customer behavior and demographics.",
        metrics: [
          { name: "Total Customers", value: totalCustomers },
          { name: "Active Customers", value: activeCustomers },
          { name: "Avg. Order Value", value: `LKR${avgOrderValue.toFixed(2)}` },
          { name: "Top Spender", value: customers[0]?.name || "N/A" },
        ],
        table: {
          headers: ["Customer", "Email", "Orders", "Total Spent", "Last Order"],
          rows: customers.map(customer => [
            customer.name,
            customer.email,
            customer.orders,
            `LKR${customer.totalSpent?.toFixed(2) || '0.00'}`,
            customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString() : "N/A"
          ])
        }
      }
    } catch (error) {
      console.error("Error fetching customers report:", error)
      return null
    }
  }

  // Fetch products report data
  const fetchProductsReport = async () => {
    try {
      // Get product stats
      const statsResponse = await fetch('http://localhost:8080/api/admin/products/stats')
      const stats = await statsResponse.json()

      // Get top products
      const productsResponse = await fetch('http://localhost:8080/admin/orders/analytics/products')
      const topProducts = await productsResponse.json()

      // Get category distribution
      const categoryResponse = await fetch('http://localhost:8080/api/admin/products/category-distribution')
      const categories = await categoryResponse.json()

      return {
        title: "Product Performance Report",
        description: "Analysis of product sales and performance.",
        metrics: [
          { name: "Total Products", value: stats.totalProducts || 0 },
          { name: "Low Stock Products", value: stats.lowStockProducts || 0 },
          { name: "Out of Stock", value: stats.outOfStockProducts || 0 },
          { name: "Avg. Stock Level", value: Math.round(stats.averageStock) || 0 },
        ],
        chartData: categories,
        table: {
          headers: ["Product", "Units Sold", "Revenue"],
          rows: topProducts.map(product => [
            product.name,
            product.quantity,
            `LKR${((product.price || 0) * product.quantity).toFixed(2)}`
          ])
        }
      }
    } catch (error) {
      console.error("Error fetching products report:", error)
      return null
    }
  }

  // Generate report based on selection
  const generateReport = useCallback(async () => {
    setIsLoading(true)
    try {
      let data = null
      switch (selectedReport) {
        case "sales":
          data = await fetchSalesReport()
          break
        case "orders":
          data = await fetchOrdersReport()
          break
        case "customers":
          data = await fetchCustomersReport()
          break
        case "products":
          data = await fetchProductsReport()
          break
        default:
          break
      }
      setReportData(data)
    } catch (error) {
      console.error("Error generating report:", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedReport, dateRange, startDate, endDate]);

  // Handle report download
  const handleDownloadReport = async () => {
    if (!reportData) return;

    try {
      setIsGeneratingPDF(true);

      if (exportFormat === 'pdf') {
      const reportPreviewElement = document.querySelector('.report-preview');
      
      if (!reportPreviewElement) {
        throw new Error("Report preview element not found.");
      }

      // Temporarily hide elements that shouldn't be in PDF
      const downloadButtons = document.querySelectorAll('.download-report-btn, .generate-report-btn');
      downloadButtons.forEach(btn => btn.style.visibility = 'hidden');

      // Calculate the full height needed for the capture
      // Temporarily expand the reportPreviewElement fully
      const originalHeight = reportPreviewElement.style.height;
      reportPreviewElement.style.height = 'auto';
      await new Promise(resolve => setTimeout(resolve, 200));  // wait for height to adjust

      const fullHeight = reportPreviewElement.scrollHeight;
      reportPreviewElement.style.height = originalHeight;

      // Add delay to ensure DOM updates
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(reportPreviewElement, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        width: reportPreviewElement.scrollWidth,
        height: fullHeight
      });

      // Restore button visibility
      downloadButtons.forEach(btn => btn.style.visibility = 'visible');

      const imageData = canvas.toDataURL('image/png');

      const response = await fetch('http://localhost:8080/admin/reports/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: reportData.title,
          imageData: imageData,
          headers: reportData.table.headers,
          rows: reportData.table.rows,
          metrics: reportData.metrics.map(m => ({
            name: m.name,
            value: m.value.toString()
          })),
          dateRange: getDateRangeText()
        })
      });

      if (!response.ok) throw new Error(`Server responded with ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }  else if (exportFormat === 'csv') {
        // CSV Export
        const csvContent = [
          reportData.table.headers.join(','),
          ...reportData.table.rows.map(row => row.join(','))
        ].join('\n');

        const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvLink = document.createElement('a');
        csvLink.href = csvUrl;
        csvLink.download = `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(csvLink);
        csvLink.click();
        document.body.removeChild(csvLink);

      } else if (exportFormat === 'excel') {
        // Excel Export using SheetJS
        try {
          const XLSX = await import('xlsx');

          const ws = XLSX.utils.aoa_to_sheet([
            reportData.table.headers,
            ...reportData.table.rows
          ]);

          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

          XLSX.writeFile(wb, `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
          console.error("Error generating Excel file:", error);
          alert("Error generating Excel file. Please try again.");
        }

      } else {
        alert(`Format ${exportFormat} not supported`);
      }

    } catch (error) {
      console.error('Download error:', error);
      alert(`Download failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Get date range text
  const getDateRangeText = () => {
    const range = dateRanges.find((r) => r.id === dateRange)
    return range ? range.name : "Custom Range"
  }

  // Load report when component mounts or report type changes
  useEffect(() => {
    generateReport()
  }, [generateReport])

  // Render sales chart
  const renderSalesChart = () => {
    if (!reportData?.chartData) return null
    
    const data = {
      labels: reportData.chartData.map(item => `Week ${item.week}`),
      datasets: [
        {
          label: 'Sales (LKR)',
          data: reportData.chartData.map(item => item.total),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        }
      ]
    }

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Weekly Sales Performance',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Amount (LKR)'
          }
        }
      }
    }

    return <Bar data={data} options={options} />
  }

  // Render product category chart
  const renderProductCategoryChart = () => {
    if (!reportData?.chartData) return null
    
    // Group by parent category
    const categories = {}
    reportData.chartData.forEach(item => {
      if (!categories[item.parentCategoryName]) {
        categories[item.parentCategoryName] = 0
      }
      categories[item.parentCategoryName] += item.productCount
    })

    const data = {
      labels: Object.keys(categories),
      datasets: [
        {
          label: 'Products by Category',
          data: Object.values(categories),
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        }
      ]
    }

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Product Distribution by Category',
        },
      }
    }

    return <Pie data={data} options={options} />
  }

  // Render top products chart
  const renderTopProductsChart = () => {
    if (!reportData?.table?.rows) return null
    
    // Get top 5 products from the table data
    const topProducts = reportData.table.rows.slice(0, 5)
    
    const data = {
      labels: topProducts.map(row => row[0]),
      datasets: [
        {
          label: 'Units Sold',
          data: topProducts.map(row => row[1]),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
        {
          label: 'Revenue (LKR)',
          data: topProducts.map(row => parseFloat(row[2].replace('LKR', ''))),
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        }
      ]
    }

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Top Performing Products',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Value'
          }
        }
      }
    }

    return <Bar data={data} options={options} />
  }

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>Reports</h1>
      </div>

      <div className="reports-content">
        <div className="reports-sidebar">
          <div className="report-types">
            <h2>Report Types</h2>
            <ul className="report-type-list">
              {reportTypes.map((report) => (
                <li
                  key={report.id}
                  className={`report-type-item ${selectedReport === report.id ? "active" : ""}`}
                  onClick={() => setSelectedReport(report.id)}
                >
                  <span className="report-icon">{report.icon}</span>
                  <span className="report-name">{report.name}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="report-filters">
            <h2>Filters</h2>

            <div className="filter-group">
              <label htmlFor="dateRange">Date Range</label>
              <div className="select-container">
                <Calendar size={16} className="select-icon" />
                <select 
                  id="dateRange" 
                  value={dateRange} 
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  {dateRanges.map((range) => (
                    <option key={range.id} value={range.id}>
                      {range.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {dateRange === "custom" && (
              <div className="custom-date-range">
                <div className="filter-group">
                  <label htmlFor="startDate">Start Date</label>
                  <input 
                    type="date" 
                    id="startDate" 
                    className="date-input" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label htmlFor="endDate">End Date</label>
                  <input 
                    type="date" 
                    id="endDate" 
                    className="date-input" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="filter-group">
              <label htmlFor="exportFormat">Export Format</label>
              <div className="select-container">
                <FileText size={16} className="select-icon" />
                <select 
                  id="exportFormat" 
                  value={exportFormat} 
                  onChange={(e) => setExportFormat(e.target.value)}
                >
                  {exportFormats.map((format) => (
                    <option key={format.id} value={format.id}>
                      {format.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              className="generate-report-btn" 
              onClick={generateReport}
              disabled={isLoading}
            >
              {isLoading ? <Loader size={16} className="spin" /> : <Filter size={16} />}
              {isLoading ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </div>

        <div className="report-preview">
          {isLoading ? (
            <div className="loading-overlay">
              <Loader size={32} className="spin" />
              <p>{isGeneratingPDF ? "Generating PDF..." : "Generating report..."}</p>
            </div>
          ) : reportData ? (
            <>
              <div className="report-preview-header">
                <div>
                  <h2>{reportData.title}</h2>
                  <p className="report-description">{reportData.description}</p>
                  <p className="report-date-range">Period: {getDateRangeText()}</p>
                </div>
                <button 
                  className="download-report-btn" 
                  onClick={handleDownloadReport}
                  disabled={!reportData}
                >
                  <Download size={16} />
                  Download {exportFormat.toUpperCase()}
                </button>
              </div>

              <div className="report-metrics">
                {reportData.metrics.map((metric, index) => (
                  <div className="metric-card" key={index}>
                    <h3 className="metric-name">{metric.name}</h3>
                    <p className="metric-value">{metric.value}</p>
                  </div>
                ))}
              </div>

              {reportData.chartData && (
                <div className="report-chart">
                  <h3>Visualization</h3>
                  {selectedReport === 'sales' && (
                    <div className="single-chart-container">
                      <div className="single-char-wrapper">
                       {renderSalesChart()}
                      </div>
                    </div>
                  )}
                  {selectedReport === 'products' && (
                    <div className="product-charts-container">
                      <div className="pie-chart-wrapper">  {/* Changed to pie-specific class */}
                        {renderProductCategoryChart()}
                      </div>
                      <div className="bar-chart-wrapper">  {/* Changed to bar-specific class */}
                        {renderTopProductsChart()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="report-table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      {reportData.table.headers.map((header, index) => (
                        <th key={index}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.table.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="no-data">
              <p>No report data available. Try generating a report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reports