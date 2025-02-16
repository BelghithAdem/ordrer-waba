export interface CustomerInsights {
  totalOrders: number
  averageOrderValue: number
  outstandingPayments: number
  lastOrderDate?: Date
  preferredShippingMethod?: string
  preferredPaymentMethod?: string
  preferredWarehouse?: string
  isPreferredCustomer: boolean
  creditUtilization: number
}

export interface CustomerPreferences {
  defaultShippingAddress: Address
  defaultBillingAddress: Address
  defaultPaymentTerms: string
  defaultShippingMethod: string
  defaultPaymentMethod: string
  taxExempt: boolean
  taxExemptionNumber?: string
  specialPricing: boolean
  notes: string
}

export interface Customer {
  id: number
  status: string
  name: string
  code: string
  group: string
  raw: {
    email?: string
    phone?: string
    billingAddress?: Address
    shippingAddress?: Address
    taxId?: string
    paymentTerms?: string
    isGuest?: boolean
    insights?: CustomerInsights
    preferences?: CustomerPreferences
    // Add other fields as necessary
  }
  // Add other fields if needed
  sort: number | null
  user_created: string
  date_created: string
  user_updated: string | null
  date_updated: string | null
  id_other_1: string
  orq: number
}

export interface Address {
  street: string
  city: string
  state: string
  country: string
  postalCode: string
}

export interface Product {
  id: number
  status: string
  sort: number | null
  user_created: string
  date_created: string
  user_updated: string | null
  date_updated: string | null
  name: string
  description: string
  price: number
  brand: string | null
  weight: string | null
  country: string | null
  code: string
  storage: string | null
  image: string | null
  cat2: string | null
  raw: any | null
  remark: string | null
  type: string
  period: string | null
  unit: number | null
  recurring: boolean | null
  orq: number
  membership_start_day: number | null
  is_multi_unit: boolean
  company_other_1: string | null
  company_name: string | null
  detail: string | null
  duration: string | null
  x_days_before_eligibility_end_date: number
  parent_id: number | null
  is_generate_fixed_day: boolean
  event: string | null
  price_discount: number | null
  name_en_US: string | null
  name_zh_HANT: string | null
  description_zh_HANT: string | null
  detail_zh_HANT: string | null
  period_zh_HANT: string | null
  start_date: string | null
  end_date: string | null
  slug: string | null
  category: number[]
  children: any[]
  product_price: ProductPrice[]
  inventory: Inventory[]
}

export interface ProductPrice {
  id: number
  status: string
  sort: number | null
  user_created: string
  date_created: string
  user_updated: string | null
  date_updated: string | null
  variant: string | null
  price: number | null
  unit: number
  cost: number
  company: number
  discount_rate: number | null
  effective_start: string | null
  effective_end: string | null
  product: number
}

export interface Inventory {
  id: number
  status: string
  sort: number | null
  user_created: string
  date_created: string
  user_updated: string | null
  date_updated: string | null
  product: number
  qty: number
  image: string | null
  stock_transfer: any | null
  name: string
  location: string | null
  orq: number | null
}

export interface OrderLine {
  product_id: number
  product_price: number
  discount: number
  total: number
  product_type: string
  product_name: string
  product_name_en_US: string | null
  product_name_zh_HANT: string
  product_code: string
  product_unit: string
  recurring: number
  status: string
  orq: number
  tax_rate: number
  qty: number
  x_days_before_eligibility_end_date: number
  duration: number
  membership_start_day: number
}

export interface SalesOrder {
  id: string
  orderNumber: string
  customerId: string
  status: string
  orderDate: Date
  deliveryDate?: Date
  dueDate?: Date
  paymentTerms: string
  currency: string
  subtotal: number
  taxTotal: number
  discountTotal: number
  shippingCost: number
  total: number
  notes?: string
  customerNotes?: string
  internalNotes?: string
  orderLines: OrderLine[]
  shippingMethod?: string
  trackingNumber?: string
  paymentMethod: string
  isPaid: boolean
}

export interface Template extends SalesOrder {
  id: string
  name: string
  description: string
  createdAt: Date
  tags?: string[]
}

export interface Warehouse {
  id: string
  name: string
  address: Address
}

export interface ShippingMethod {
  id: string
  name: string
  cost: number
  estimatedDeliveryDays: number
}

export interface PaymentMethod {
  id: string
  name: string
}

export interface OrderResponse {
  status: boolean
  message: string
  data: {
    id: number
    order_code: string
    nonce: string
    total: number
    amount_total: number
    discount: number
    redirect_fill: string
    order_lines: OrderLine[]
    shipping: number
    status: string
    order_date: string
  }
}

export interface DocumentTemplate {
  id: string
  status: string
  sort: number | null
  user_created: string
  date_created: string
  user_updated: string
  date_updated: string
  name: string
  components: DtComponent[]
  type: string
  autofill: boolean
  redirect_path: string | null
  orq: number
  lock: any | null
  is_golden: boolean | null
}

export interface DtComponent {
  h: number
  w: number
  x: number
  y: number
  h1: string
  key: string
  raw: RawComponent
  src: string
  type: string
  uuid: string
  field: string
  value: string
  active: boolean
  ui_type: string
  editable: boolean
  isHidden: boolean
  required: boolean
  component: string
  isEditing: boolean
  sortOrder: number
  valueType: string
  variation: string
  filterMenus: any[]
  placeholder: string
  showTooltip: boolean
  textTooltip: string
  defaultValue: string
  fieldCustomValidationMessage: string
}

export interface RawComponent {
  style: {
    backgroundImage: string
  }
  config: any
  uiType: string
  visibility: {
    mobile: boolean
    desktop: boolean
  }
  copyContent: {
    bgColor: string
    copyContent: boolean
  }
  labelLanguage: {
    en_US: string
    zh_CN: string
    zh_Hant: string
  }
  showOrqInContext: boolean
}

