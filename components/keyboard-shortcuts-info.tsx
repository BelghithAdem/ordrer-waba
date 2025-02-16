import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const shortcuts = [
  { keys: ["⌘", "S"], description: "Save as draft" },
  { keys: ["⌘", "Enter"], description: "Create order" },
  { keys: ["⌘", "K"], description: "Search products" },
  { keys: ["⌘", "F"], description: "Search customers" },
  { keys: ["⌘", "B"], description: "Add new line item" },
  { keys: ["⌘", "D"], description: "Duplicate selected line" },
  { keys: ["⌘", "⌫"], description: "Delete selected line" },
  { keys: ["Tab"], description: "Navigate fields" },
  { keys: ["↑", "↓"], description: "Navigate line items" },
  { keys: ["Space"], description: "Toggle line item selection" },
  { keys: ["⌘", "/"], description: "Show keyboard shortcuts" },
]

export function KeyboardShortcutsInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyboard Shortcuts</CardTitle>
        <CardDescription>Speed up your workflow with these keyboard shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shortcut</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shortcuts.map((shortcut) => (
              <TableRow key={shortcut.description}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key) => (
                      <Badge key={key} variant="secondary" className="font-mono">
                        {key}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{shortcut.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

