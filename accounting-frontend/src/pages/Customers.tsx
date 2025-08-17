import { useState } from "react";
import { Box, Text, Button, Group, Modal } from "@mantine/core";
import { IconUserPlus } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { CustomerList, CustomerForm } from "../components/customers";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  status: "active" | "inactive";
  notes?: string;
  totalInvoices: number;
  totalAmount: number;
  lastInvoice: string;
  createdAt: string;
}

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  status: "active" | "inactive";
  notes?: string;
}

export function Customers() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    openForm();
  };

  const handleDelete = (customerId: string) => {
    console.log("Delete customer:", customerId);
    // TODO: Implement delete functionality
  };

  const handleCreateInvoice = (customer: Customer) => {
    console.log("Create invoice for customer:", customer);
    // TODO: Navigate to invoice creation
  };

  const handleFormSubmit = (data: CustomerFormData) => {
    console.log("Form submitted:", data);
    // TODO: Implement save functionality
    closeForm();
    setSelectedCustomer(null);
  };

  const handleFormCancel = () => {
    closeForm();
    setSelectedCustomer(null);
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    openForm();
  };

  return (
    <Box>
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700}>
            Customers
          </Text>
          <Text size="sm" c="dimmed">
            Manage your customer database and relationships
          </Text>
        </Box>
        <Button leftSection={<IconUserPlus size={16} />} onClick={handleAddCustomer}>
          Add Customer
        </Button>
      </Group>

      <CustomerList
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateInvoice={handleCreateInvoice}
      />

      {/* Customer Form Modal */}
      <Modal
        opened={formOpened}
        onClose={closeForm}
        title={selectedCustomer ? "Edit Customer" : "Add New Customer"}
        size="xl">
        <CustomerForm
          customer={selectedCustomer || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      </Modal>
    </Box>
  );
}
