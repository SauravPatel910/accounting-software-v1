import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Box, Text, Button, Group } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { InvoiceForm } from "../components/invoices";
import type {
  Customer,
  CreateInvoiceData,
  Invoice,
  CreateCustomerData,
  Product,
  CreateProductData,
} from "../services/api";
import type { CustomerFormData } from "../components/customers";
import type { ProductFormData } from "../components/products";

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
        unitPrice: 15000.0,
        total: 60000.0,
      },
      {
        id: "item-2",
        description: "Wheel Balancing Service",
        quantity: 4,
        unitPrice: 1200.0,
        total: 4800.0,
      },
    ],
    subtotal: 64800.0,
    taxRate: 8.5,
    taxAmount: 5508.0,
    total: 70308.0,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
];

export function CreateInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);

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

  // Handle customer creation
  const handleCustomerCreate = async (customerFormData: CustomerFormData): Promise<Customer> => {
    try {
      // Map CustomerFormData to CreateCustomerData
      const customerData: CreateCustomerData = {
        name: customerFormData.name,
        company: customerFormData.company,
        email: customerFormData.email,
        phone: customerFormData.phone,
        address: customerFormData.address,
        city: customerFormData.city,
        state: customerFormData.state,
        zipCode: customerFormData.postalCode,
        country: customerFormData.country,
        taxId: undefined, // Not captured in the form, can be added later
      };

      // TODO: Replace with actual API call
      const newCustomer: Customer = {
        id: `CUST-${Date.now()}`,
        name: customerData.name,
        company: customerData.company,
        email: customerData.email,
        phone: customerData.phone || "",
        address: customerData.address,
        city: customerData.city,
        state: customerData.state,
        zipCode: customerData.zipCode,
        country: customerData.country,
        taxId: customerData.taxId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add to local state (in real app, this would be handled by API response)
      setCustomers((prev) => [...prev, newCustomer]);

      return newCustomer;
    } catch {
      throw new Error("Failed to create customer");
    }
  };

  // Handle product creation
  const handleProductCreate = async (productFormData: ProductFormData): Promise<Product> => {
    try {
      // Map ProductFormData to CreateProductData
      const productData: CreateProductData = {
        name: productFormData.name,
        brand: productFormData.brand,
        size: productFormData.size,
        pattern: productFormData.pattern || undefined,
        loadIndex: productFormData.loadIndex || undefined,
        speedRating: productFormData.speedRating || undefined,
        type: productFormData.type,
        price: productFormData.price,
        costPrice: productFormData.costPrice || undefined,
        stock: productFormData.stock,
        minStock: productFormData.minStock || undefined,
        sku: productFormData.sku,
        description: productFormData.description || undefined,
        category: productFormData.category,
        isActive: productFormData.isActive,
      };

      // TODO: Replace with actual API call
      const newProduct: Product = {
        id: `PROD-${Date.now()}`,
        name: productData.name,
        brand: productData.brand,
        size: productData.size,
        pattern: productData.pattern,
        loadIndex: productData.loadIndex,
        speedRating: productData.speedRating,
        type: productData.type,
        price: productData.price,
        costPrice: productData.costPrice,
        stock: productData.stock,
        minStock: productData.minStock,
        sku: productData.sku,
        description: productData.description,
        category: productData.category,
        isActive: productData.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return newProduct;
    } catch {
      throw new Error("Failed to create product");
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
        customers={customers}
        onSubmit={handleInvoiceSubmit}
        onCancel={() => navigate("/invoices")}
        onCustomerCreate={handleCustomerCreate}
        onProductCreate={handleProductCreate}
        loading={loading}
        invoice={invoice || undefined}
      />
    </Box>
  );
}
