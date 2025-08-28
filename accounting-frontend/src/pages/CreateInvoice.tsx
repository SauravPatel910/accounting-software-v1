import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Box, Text, Button, Group } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { InvoiceForm } from "../components/invoices";
import type { Customer, CreateInvoiceData, Invoice } from "../services/api";

// Mock data for customers (this would come from API)
const mockCustomers: Customer[] = [
  {
    id: "CUST-001",
    name: "Acme Corporation",
    company: "Acme Corporation",
    email: "accounting@acmecorp.com",
    phone: "+1 (555) 123-4567",
    address: "123 Business St",
    city: "Business City",
    country: "USA",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "CUST-002",
    name: "Tech Solutions Inc",
    company: "Tech Solutions Inc",
    email: "billing@techsolutions.com",
    phone: "+1 (555) 987-6543",
    address: "456 Tech Ave",
    city: "Tech City",
    country: "USA",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock data for invoices (this would come from API)
const mockInvoices: Invoice[] = [
  {
    id: "INV-001",
    invoiceNumber: "INV-2024-001",
    customerId: "CUST-001",
    customer: mockCustomers[0],
    issueDate: new Date("2024-01-15"),
    dueDate: new Date("2024-02-15"),
    description: "Tyre replacement services",
    notes: "Premium tyres installed with balancing",
    status: "sent",
    items: [
      {
        id: "item-1",
        productId: "PROD-001",
        description: "Michelin Pilot Sport 4 - 225/45R17 (Summer Performance)",
        quantity: 4,
        unitPrice: 180.0,
        total: 720.0,
      },
      {
        id: "item-2",
        description: "Wheel Balancing Service",
        quantity: 4,
        unitPrice: 15.0,
        total: 60.0,
      },
    ],
    subtotal: 780.0,
    taxRate: 8.5,
    taxAmount: 66.3,
    total: 846.3,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
];

export function CreateInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  const isEditMode = Boolean(id);

  // Load invoice data for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      // TODO: Replace with actual API call
      const foundInvoice = mockInvoices.find((inv) => inv.id === id);
      setInvoice(foundInvoice || null);
    }
  }, [id, isEditMode]);

  // Handle invoice submission
  const handleInvoiceSubmit = async (data: CreateInvoiceData) => {
    setLoading(true);
    try {
      if (isEditMode) {
        // TODO: Replace with actual API call for updating
        console.log("Updating invoice:", id, data);

        notifications.show({
          title: "Invoice Updated",
          message: "Invoice has been updated successfully",
          color: "green",
        });
      } else {
        // TODO: Replace with actual API call for creating
        console.log("Creating invoice:", data);

        notifications.show({
          title: "Invoice Created",
          message: "Invoice has been created successfully",
          color: "green",
        });
      }

      // Navigate back to invoices list
      navigate("/invoices");
    } catch {
      notifications.show({
        title: "Error",
        message: `Failed to ${isEditMode ? "update" : "create"} invoice`,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Group mb="md">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate("/invoices")}>
          Back to Invoices
        </Button>
      </Group>

      <Text size="xl" fw={600} mb="md">
        {isEditMode ? "Edit Invoice" : "Create New Invoice"}
      </Text>

      {/* Invoice Form */}
      <InvoiceForm
        customers={mockCustomers}
        onSubmit={handleInvoiceSubmit}
        onCancel={() => navigate("/invoices")}
        loading={loading}
        invoice={invoice || undefined}
      />
    </Box>
  );
}
