import axios from "axios"
import type { Product, Customer, SalesOrder, Template, OrderLine, DocumentTemplate } from "@/types/sales-order"
import { getMockDocumentTemplate } from "@/lib/mockDocumentTemplateAPI"

// Function to get the access token from localStorage
const getAccessToken = (): string | null => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token")
    if (!token) {
      console.warn("No access token found in localStorage")
    }
    return token
  }
  return null
}

// Create an axios instance with dynamic headers
const api = axios.create({
  baseURL: "https://orq-dev.synque.ca",
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Received 401 error, redirecting to login")
      // Redirect to login page
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

// Helper function to get cached customers
const getCachedCustomers = () => {
  if (typeof window === 'undefined') return null
  
  const cached = localStorage.getItem('customers')
  if (!cached) return null

  try {
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem('customers')
      return null
    }
    return data
  } catch (error) {
    console.error('Error reading cached customers:', error)
    localStorage.removeItem('customers')
    return null
  }
}

// Helper function to set cached customers
const setCachedCustomers = (customers: Customer[]) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('customers', JSON.stringify({
      data: customers,
      timestamp: Date.now()
    }))
  } catch (error) {
    console.error('Error caching customers:', error)
  }
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const token = getAccessToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const response = await api.get("/items/product", {
      headers,
      params: {
        meta: "*",
        fields: "*,product_price.*,inventory.*",
        limit: -1,
        "filter[orq][_eq]": 63,
      },
    })
    return response.data.data
  } catch (err) {
    console.error("Error fetching products:", err)
    if (axios.isAxiosError(err)) {
      console.error("Axios error details:", err.response?.data)
    }
    throw new Error("Failed to fetch products. Please try again later.")
  }
}

export async function fetchCustomers(): Promise<Customer[]> {
  console.log("🔍 [API] fetchCustomers: Starting")
  
  // Try to get cached data first
  const cachedData = getCachedCustomers()
  if (cachedData) {
    console.log("🔍 [API] fetchCustomers: Using cached data")
    return cachedData
  }

  console.log("🔍 [API] fetchCustomers: Cache miss - fetching from API")
  try {
    const token = getAccessToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    console.log("🔍 [API] fetchCustomers: Making request to /items/company")
    const response = await api.get("/items/company", {
      headers,
      params: {
        meta: "*",
        fields: "*",
        limit: -1,
        "filter[orq][_eq]": 63,
      },
    })
    console.log(`🔍 [API] fetchCustomers: Received ${response.data.data.length} customers`)
    
    const customers = response.data.data.map((item: any) => ({
      id: item.id,
      status: item.status,
      name: item.name,
      code: item.code,
      group: item.group,
      raw: item.raw || {},
    }))

    // Cache the fetched data
    setCachedCustomers(customers)
    console.log("🔍 [API] fetchCustomers: Cached fresh data")
    
    return customers
  } catch (err) {
    console.error("Error fetching customers:", err)
    throw new Error("Failed to fetch customers. Please try again later.")
  }
}

export async function fetchOrders(
  page = 1,
  limit = 10,
  filters?: {
    status?: string
    type?: string
    dateFrom?: Date
  },
): Promise<{ orders: SalesOrder[]; totalCount: number }> {
  try {
    const token = getAccessToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    // Build filter parameters
    const filterParams: Record<string, string> = {
      "filter[orq][_eq]": "63",
    }

    // Add optional filters
    if (filters?.status && filters.status !== "all") {
      filterParams["filter[status][_eq]"] = filters.status
    }

    // Always include type filter unless specified otherwise
    if (filters?.type && filters.type !== "all") {
      filterParams["filter[type][_eq]"] = filters.type
    }

    if (filters?.dateFrom) {
      filterParams["filter[order_date][_gte]"] = filters.dateFrom.toISOString().split("T")[0]
    }

    const response = await api.get("/items/order", {
      headers,
      params: {
        meta: "*",
        fields: "*,product.*",
        limit,
        page,
        ...filterParams,
      },
    })

    // Transform the API response into SalesOrder format
    const formattedOrders: SalesOrder[] = response.data.data.map((order: any) => ({
      id: order.id.toString(),
      orderNumber: order.code || `SO-${order.id}`,
      customerId: order.company?.toString() || "",
      status: order.status,
      orderType: order.type,
      orderDate: new Date(order.order_date),
      deliveryDate: order.delivery_date ? new Date(order.delivery_date) : undefined,
      dueDate: order.order_due_date ? new Date(order.order_due_date) : undefined,
      paymentTerms: "",
      currency: "USD",
      subtotal: order.amount_total || 0,
      taxTotal: order.tax_amount_payable || 0,
      discountTotal: order.discount || 0,
      shippingCost: 0,
      total: order.amount_total || 0,
      notes: order.remarks || "",
      customerNotes: "",
      internalNotes: "",
      orderLines:
        order.product?.map((product: any) => ({
          product_id: product.product_id,
          product_price: product.product_price || 0,
          discount: product.discount || 0,
          total: product.total || 0,
          product_type: product.product_type || "",
          product_name: product.product_name,
          product_name_en_US: product.product_name_en_US || null,
          product_name_zh_HANT: product.product_name_zh_HANT || product.product_name,
          product_code: product.product_code,
          product_unit: product.product_unit || "",
          recurring: product.recurring || 0,
          status: product.status,
          orq: product.orq || 63,
          tax_rate: product.tax_rate || 0,
          qty: product.qty || 0,
          x_days_before_eligibility_end_date: product.x_days_before_eligibility_end_date || 0,
          duration: product.duration || 0,
          membership_start_day: product.membership_start_day || 0,
        })) || [],
      shippingMethod: undefined,
      trackingNumber: undefined,
      paymentMethod: order.payment_method || "",
      isPaid: order.payment_date != null,
    }))

    return {
      orders: formattedOrders,
      totalCount: response.data.meta.filter_count,
    }
  } catch (err) {
    console.error("Error fetching orders:", err)
    throw new Error("Failed to fetch orders. Please try again later.")
  }
}

export async function fetchTemplates(page = 1, limit = 5): Promise<{ templates: Template[]; totalCount: number }> {
  try {
    console.log("Fetching templates...")
    const token = getAccessToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const response = await api.get("/items/order", {
      headers,
      params: {
        meta: "*",
        fields: "*,product.*",
        limit: limit,
        page: page,
        "filter[orq][_eq]": 63,
        "filter[type][_eq]": "template",
      },
    })

    if (!response.data || !Array.isArray(response.data.data)) {
      throw new Error("Invalid response format")
    }

    const formattedTemplates: Template[] = response.data.data.map((template: any) => {
      console.log("Processing template:", template.id)
      return {
        id: template.id.toString(),
        name: template.code || `Template ${template.id}`,
        description: template.remarks || "No description available",
        createdAt: new Date(template.date_created),
        date_created: new Date(template.date_created),
        tags: [],
        orderNumber: template.code,
        customerId: template.member?.toString() || "",
        company: template.company?.toString() || "",
        status: template.status,
        orderDate: new Date(template.order_date),
        deliveryDate: template.delivery_date ? new Date(template.delivery_date) : undefined,
        dueDate: template.order_due_date ? new Date(template.order_due_date) : undefined,
        paymentTerms: "",
        currency: "USD",
        subtotal: template.amount_total || 0,
        taxTotal: template.tax_amount_payable || 0,
        discountTotal: template.discount || 0,
        shippingCost: 0,
        total: template.amount_total || 0,
        orderLines: Array.isArray(template.product)
          ? template.product
              .filter((product: OrderLine) => product.status === "published")
              .map((product: OrderLine) => ({
                id: product.id.toString(),
                product_id: product.product_id.toString(),
                product_name: product.product_name,
                product_code: product.product_code,
                qty: product.qty,
                product_price: product.product_price,
                taxRate: product.tax_rate,
                discount: product.discount,
                subTotal: product.total,
                total: product.total,
                unit: product.product_unit || "piece",
                isCustom: false,
              }))
          : [],
        shippingMethod: undefined,
        trackingNumber: undefined,
        paymentMethod: template.payment_method || "",
        isPaid: template.status === "paid",
      }
    })

    console.log("Formatted templates:", JSON.stringify(formattedTemplates, null, 2))
    return {
      templates: formattedTemplates,
      totalCount: response.data.meta.filter_count,
    }
  } catch (error) {
    console.error("Error fetching templates:", error)
    if (axios.isAxiosError(error)) {
      console.error("Axios error details:", error.response?.data)
    }
    throw new Error(`Failed to fetch templates: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function fetchDocumentTemplate(dt_id: string | string[] | undefined): Promise<DocumentTemplate> {
  console.log("Fetching document template...")
  console.log("..dt_id:", dt_id)
  if (!dt_id || dt_id === "jimmy") {
    console.log("..Using mocked template data")
    return getMockDocumentTemplate("jimmy")
  } else {
    try {
      console.log("..Fetching template from API...")
      const response = await api.get(`/items/document_template/${dt_id}?fields=*`)
      console.log("API Response:", response.data)
      return response.data.data
    } catch (err) {
      console.error("Error fetching document template:", err)
      throw new Error("Failed to fetch document template. Please try again.")
    }
  }
}

