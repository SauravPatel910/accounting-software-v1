import { useState } from "react";
import { Box, Text, Button, Group, Modal } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { InvoiceList, InvoiceForm, InvoiceDetail } from "../components/invoices";
import { pdfService } from "../services/pdfService";
import { emailService } from "../services/emailService";
import type { Invoice, Customer, CreateInvoiceData, EmailInvoiceData } from "../services/api";

// Mock data for customers (this would come from API)
const mockCustomers: Customer[] = [
  {
    id: "CUST-001",
    name: "John Smith",
    company: "Acme Corporation",
    email: "john.smith@acmecorp.com",
    address: "123 Business St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "USA",
    phone: "+1 (555) 123-4567",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "CUST-002",
    name: "Sarah Johnson",
    company: "TechStart Inc",
    email: "sarah@techstart.io",
    address: "456 Innovation Ave",
    city: "San Francisco",
    state: "CA",
    zipCode: "94107",
    country: "USA",
    phone: "+1 (555) 987-6543",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function Invoices() {
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [detailModalOpened, setDetailModalOpened] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle invoice creation
  const handleCreateInvoice = () => {
    setCreateModalOpened(true);
  };

  // Handle invoice submission (create/edit)
  const handleInvoiceSubmit = async (data: CreateInvoiceData) => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      console.log("Creating/updating invoice:", data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      notifications.show({
        title: selectedInvoice ? "Invoice Updated" : "Invoice Created",
        message: selectedInvoice
          ? "Invoice has been updated successfully"
          : "New invoice has been created successfully",
        color: "green",
      });

      setCreateModalOpened(false);
      setEditModalOpened(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error("Error saving invoice:", error);
      notifications.show({
        title: "Error",
        message: "Failed to save invoice. Please try again.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle invoice edit
  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEditModalOpened(true);
  };

  // Handle invoice delete
  const handleDelete = async (invoiceId: string) => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      console.log("Deleting invoice:", invoiceId);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      notifications.show({
        title: "Invoice Deleted",
        message: "Invoice has been deleted successfully",
        color: "green",
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      notifications.show({
        title: "Error",
        message: "Failed to delete invoice. Please try again.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle sending invoice via email
  const handleSend = async (invoice: Invoice) => {
    setLoading(true);
    try {
      // Get customer info
      const customer = mockCustomers.find((c) => c.id === invoice.customerId);
      if (!customer) {
        throw new Error("Customer not found");
      }

      // Generate PDF
      const pdfBase64 = await pdfService.getPDFAsBase64(invoice, customer);

      // Send email
      await emailService.sendInvoiceCreatedEmail(invoice, customer, pdfBase64);

      notifications.show({
        title: "Invoice Sent",
        message: `Invoice has been sent to ${customer.email}`,
        color: "green",
      });
    } catch (error) {
      console.error("Error sending invoice:", error);
      notifications.show({
        title: "Error",
        message: "Failed to send invoice. Please try again.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle PDF download
  const handleDownload = async (invoice: Invoice) => {
    setLoading(true);
    try {
      // Get customer info
      const customer = mockCustomers.find((c) => c.id === invoice.customerId);
      if (!customer) {
        throw new Error("Customer not found");
      }

      // Download PDF
      await pdfService.downloadPDF(invoice, customer);

      notifications.show({
        title: "PDF Downloaded",
        message: "Invoice PDF has been downloaded successfully",
        color: "green",
      });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      notifications.show({
        title: "Error",
        message: "Failed to download invoice. Please try again.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle viewing invoice details
  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailModalOpened(true);
  };

  // Handle mark as paid
  const handleMarkAsPaid = async (amount: number) => {
    if (!selectedInvoice) return;

    setLoading(true);
    try {
      // TODO: Replace with actual API call
      console.log("Marking invoice as paid:", selectedInvoice.id, amount);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Send payment confirmation email
      const customer = mockCustomers.find((c) => c.id === selectedInvoice.customerId);
      if (customer) {
        const updatedInvoice = {
          ...selectedInvoice,
          status: "paid" as const,
          paidAmount: amount,
          paymentDate: new Date(),
        };
        await emailService.sendPaymentConfirmation(updatedInvoice, customer);
      }

      notifications.show({
        title: "Payment Recorded",
        message: "Invoice has been marked as paid",
        color: "green",
      });

      setDetailModalOpened(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      notifications.show({
        title: "Error",
        message: "Failed to record payment. Please try again.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle custom email sending
  const handleSendEmail = async (emailData: EmailInvoiceData) => {
    if (!selectedInvoice) return;

    setLoading(true);
    try {
      const customer = mockCustomers.find((c) => c.id === selectedInvoice.customerId);
      if (!customer) {
        throw new Error("Customer not found");
      }

      // Generate PDF
      const pdfBase64 = await pdfService.getPDFAsBase64(selectedInvoice, customer);

      // Send email
      await emailService.sendInvoiceEmail(selectedInvoice, customer, emailData, pdfBase64);

      notifications.show({
        title: "Email Sent",
        message: `Email has been sent to ${emailData.to}`,
        color: "green",
      });
    } catch (error) {
      console.error("Error sending email:", error);
      notifications.show({
        title: "Error",
        message: "Failed to send email. Please try again.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel actions
  const handleCancel = () => {
    setCreateModalOpened(false);
    setEditModalOpened(false);
    setDetailModalOpened(false);
    setSelectedInvoice(null);
  };

  return (
    <Box>
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700}>
            Invoices
          </Text>
          <Text size="sm" c="dimmed">
            Manage all your invoices and billing
          </Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={handleCreateInvoice}>
          Create Invoice
        </Button>
      </Group>

      <InvoiceList
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSend={handleSend}
        onDownload={handleDownload}
        onView={handleView}
        loading={loading}
      />

      {/* Create Invoice Modal */}
      <Modal
        opened={createModalOpened}
        onClose={handleCancel}
        title="Create New Invoice"
        size="xl"
        padding="md">
        <InvoiceForm
          customers={mockCustomers}
          onSubmit={handleInvoiceSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </Modal>

      {/* Edit Invoice Modal */}
      <Modal
        opened={editModalOpened}
        onClose={handleCancel}
        title="Edit Invoice"
        size="xl"
        padding="md">
        {selectedInvoice && (
          <InvoiceForm
            invoice={selectedInvoice}
            customers={mockCustomers}
            onSubmit={handleInvoiceSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        )}
      </Modal>

      {/* Invoice Detail Modal */}
      <Modal
        opened={detailModalOpened}
        onClose={handleCancel}
        title="Invoice Details"
        size="xl"
        padding="md">
        {selectedInvoice && (
          <InvoiceDetail
            invoice={selectedInvoice}
            onEdit={() => {
              setDetailModalOpened(false);
              setEditModalOpened(true);
            }}
            onDelete={() => {
              handleDelete(selectedInvoice.id);
              setDetailModalOpened(false);
            }}
            onSendEmail={handleSendEmail}
            onMarkAsPaid={handleMarkAsPaid}
            onDownloadPDF={() => handleDownload(selectedInvoice)}
            loading={loading}
          />
        )}
      </Modal>
    </Box>
  );
}
