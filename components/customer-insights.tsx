import type { Customer } from "@/types/sales-order"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CalendarDays, CreditCard, Package2, AlertTriangle, Award, Wallet } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface CustomerInsightsProps {
  customer: Customer
}

export function CustomerInsights({ customer }: CustomerInsightsProps) {
  if (!customer.raw?.insights) return null

  const { totalOrders, averageOrderValue, outstandingPayments, lastOrderDate, isPreferredCustomer, creditUtilization } =
    customer.raw?.insights

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Customer Insights</h3>
        <div className="flex items-center gap-2">
          {isPreferredCustomer && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Award className="h-3 w-3" />
              Preferred Customer
            </Badge>
          )}
          {outstandingPayments > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Outstanding Payments
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            {lastOrderDate && (
              <p className="text-xs text-muted-foreground">
                Last order: {format(new Date(lastOrderDate), "MMM d, yyyy")}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageOrderValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per order value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${outstandingPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Pending payments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Credit Utilization</CardTitle>
          <CardDescription>${(customer.raw?.creditLimit || 0).toLocaleString()} credit limit</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress
            value={creditUtilization}
            className={cn(
              "h-2",
              creditUtilization > 90 ? "bg-destructive" : creditUtilization > 75 ? "bg-warning" : "bg-primary",
            )}
          />
          <div className="mt-1 flex text-xs justify-between text-muted-foreground">
            <span>{creditUtilization}% used</span>
            <span>
              ${((customer.raw?.creditLimit || 0) * (creditUtilization / 100)).toLocaleString()} of $
              {(customer.raw?.creditLimit || 0).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

