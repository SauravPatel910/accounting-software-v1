import { useState } from "react";
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Table,
  Button,
  Badge,
  Divider,
  Grid,
  Card,
  ActionIcon,
  Box,
  CopyButton,
  Tooltip,
  Menu,
  Modal,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconPrinter,
  IconDownload,
  IconMail,
  IconEdit,
  IconCopy,
  IconCheck,
  IconDots,
  IconX,
  IconSend,
  IconCreditCard,
} from "@tabler/icons-react";
import type { Invoice, EmailInvoiceData } from "../../services/api";

interface InvoiceDetailProps {
  invoice: Invoice;
  onEdit?: () => void;
  onDelete?: () => void;
  onSendEmail?: (emailData: EmailInvoiceData) => void;
  onMarkAsPaid?: (amount: number) => void;
  onDownloadPDF?: () => void;
  loading?: boolean;
}

// Company information (this would typically come from settings)
const COMPANY_INFO = {
  name: "Your Company Name",
  address: "123 Business Street",
  city: "Business City",
  state: "BC",
  zipCode: "12345",
  country: "USA",
  phone: "+1 (555) 123-4567",
  email: "hello@yourcompany.com",
  website: "www.yourcompany.com",
  taxId: "TAX-123456789",
};

export function InvoiceDetail({
  invoice,
  onEdit,
  onDelete,
  onSendEmail,
  onMarkAsPaid,
  onDownloadPDF,
  loading = false,
}: InvoiceDetailProps) {
  const [emailModalOpened, setEmailModalOpened] = useState(false);
  const [confirmPaymentModalOpened, setConfirmPaymentModalOpened] = useState(false);
  const [confirmDeleteModalOpened, setConfirmDeleteModalOpened] = useState(false);
  const [emailData, setEmailData] = useState({
    to: invoice.customer?.email || "",
    subject: `Invoice ${invoice.invoiceNumber} from ${COMPANY_INFO.name}`,
    message: `Dear ${invoice.customer?.name || "Customer"},\n\nPlease find attached your invoice ${
      invoice.invoiceNumber
    }.\n\nThank you for your business!\n\nBest regards,\n${COMPANY_INFO.name}`,
  });

  // Early return if no customer data
  if (!invoice.customer) {
    return (
      <Paper shadow="xs" radius="md" p="xl" withBorder>
        <Text c="red">Error: Customer information is missing for this invoice.</Text>
      </Paper>
    );
  }

  // Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "green";
      case "sent":
        return "blue";
      case "overdue":
        return "red";
      case "cancelled":
        return "gray";
      case "draft":
      default:
        return "yellow";
    }
  };

  // Status labels
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Paid";
      case "sent":
        return "Sent";
      case "overdue":
        return "Overdue";
      case "cancelled":
        return "Cancelled";
      case "draft":
      default:
        return "Draft";
    }
  };

  // Calculate days until due/overdue
  const getDaysInfo = () => {
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return { text: `Due in ${diffDays} days`, color: "blue" };
    } else if (diffDays === 0) {
      return { text: "Due today", color: "orange" };
    } else {
      return { text: `Overdue by ${Math.abs(diffDays)} days`, color: "red" };
    }
  };

  const daysInfo = getDaysInfo();

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle email send
  const handleSendEmail = () => {
    if (onSendEmail) {
      onSendEmail(emailData);
      setEmailModalOpened(false);
      notifications.show({
        title: "Email Sent",
        message: "Invoice has been sent successfully",
        color: "green",
        icon: <IconCheck size={16} />,
      });
    }
  };

  // Handle mark as paid
  const handleMarkAsPaid = () => {
    setConfirmPaymentModalOpened(true);
  };

  // Confirm mark as paid
  const confirmMarkAsPaid = () => {
    if (onMarkAsPaid) {
      onMarkAsPaid(invoice.total);
      setConfirmPaymentModalOpened(false);
      notifications.show({
        title: "Invoice Marked as Paid",
        message: "Payment has been recorded successfully",
        color: "green",
        icon: <IconCheck size={16} />,
      });
    }
  };

  // Handle delete
  const handleDelete = () => {
    setConfirmDeleteModalOpened(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (onDelete) {
      onDelete();
      setConfirmDeleteModalOpened(false);
      notifications.show({
        title: "Invoice Deleted",
        message: "Invoice has been deleted successfully",
        color: "green",
        icon: <IconCheck size={16} />,
      });
    }
  };

  return (
    <>
      <Paper shadow="xs" radius="md" p="xl" withBorder className="invoice-detail">
        {/* Header with Actions */}
        <Group justify="space-between" mb="xl" className="no-print">
          <Title order={2}>Invoice Details</Title>
          <Group>
            <Button
              leftSection={<IconPrinter size={16} />}
              variant="light"
              onClick={handlePrint}
              disabled={loading}>
              Print
            </Button>
            <Button
              leftSection={<IconDownload size={16} />}
              variant="light"
              onClick={onDownloadPDF}
              disabled={loading}
              loading={loading}>
              Download PDF
            </Button>
            <Button
              leftSection={<IconMail size={16} />}
              variant="light"
              onClick={() => setEmailModalOpened(true)}
              disabled={loading}>
              Send Email
            </Button>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="light" size="lg">
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {onEdit && (
                  <Menu.Item leftSection={<IconEdit size={14} />} onClick={onEdit}>
                    Edit Invoice
                  </Menu.Item>
                )}
                {invoice.status !== "paid" && onMarkAsPaid && (
                  <Menu.Item leftSection={<IconCreditCard size={14} />} onClick={handleMarkAsPaid}>
                    Mark as Paid
                  </Menu.Item>
                )}
                <Menu.Divider />
                {onDelete && (
                  <Menu.Item leftSection={<IconX size={14} />} color="red" onClick={handleDelete}>
                    Delete Invoice
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        {/* Invoice Header */}
        <Box mb="xl">
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Title order={1} size="h2" className="print-title">
                  INVOICE
                </Title>
                <Group>
                  <Text size="lg" fw={600}>
                    {invoice.invoiceNumber}
                  </Text>
                  <CopyButton value={invoice.invoiceNumber}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? "Copied" : "Copy invoice number"}>
                        <ActionIcon
                          color={copied ? "teal" : "gray"}
                          variant="subtle"
                          onClick={copy}
                          size="sm">
                          {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
                <Group>
                  <Badge color={getStatusColor(invoice.status)} size="lg">
                    {getStatusLabel(invoice.status)}
                  </Badge>
                  {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                    <Badge color={daysInfo.color} variant="light">
                      {daysInfo.text}
                    </Badge>
                  )}
                </Group>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs" ta="right">
                <Title order={4}>{COMPANY_INFO.name}</Title>
                <Text size="sm" c="dimmed">
                  {COMPANY_INFO.address}
                </Text>
                <Text size="sm" c="dimmed">
                  {COMPANY_INFO.city}, {COMPANY_INFO.state} {COMPANY_INFO.zipCode}
                </Text>
                <Text size="sm" c="dimmed">
                  {COMPANY_INFO.country}
                </Text>
                <Text size="sm" c="dimmed">
                  Phone: {COMPANY_INFO.phone}
                </Text>
                <Text size="sm" c="dimmed">
                  Email: {COMPANY_INFO.email}
                </Text>
              </Stack>
            </Grid.Col>
          </Grid>
        </Box>

        <Divider mb="xl" />

        {/* Invoice Info and Customer Details */}
        <Grid mb="xl">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card withBorder radius="md" p="md">
              <Title order={5} mb="sm">
                Bill To:
              </Title>
              <Stack gap="xs">
                <Text fw={600}>{invoice.customer.name}</Text>
                <Text>{invoice.customer.company}</Text>
                <Text size="sm" c="dimmed">
                  {invoice.customer.email}
                </Text>
                {invoice.customer.phone && (
                  <Text size="sm" c="dimmed">
                    {invoice.customer.phone}
                  </Text>
                )}
                <Text size="sm" c="dimmed">
                  {invoice.customer.address}
                </Text>
                <Text size="sm" c="dimmed">
                  {invoice.customer.city}
                  {invoice.customer.state && `, ${invoice.customer.state}`}
                  {invoice.customer.zipCode && ` ${invoice.customer.zipCode}`}
                </Text>
                <Text size="sm" c="dimmed">
                  {invoice.customer.country}
                </Text>
              </Stack>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card withBorder radius="md" p="md">
              <Title order={5} mb="sm">
                Invoice Details:
              </Title>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Issue Date:
                  </Text>
                  <Text size="sm" fw={500}>
                    {new Date(invoice.issueDate).toLocaleDateString()}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Due Date:
                  </Text>
                  <Text size="sm" fw={500}>
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Description:
                  </Text>
                  <Text size="sm" fw={500} ta="right" style={{ maxWidth: "60%" }}>
                    {invoice.description}
                  </Text>
                </Group>
                {invoice.paymentDate && (
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                      Payment Date:
                    </Text>
                    <Text size="sm" fw={500} c="green">
                      {new Date(invoice.paymentDate).toLocaleDateString()}
                    </Text>
                  </Group>
                )}
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Line Items */}
        <Box mb="xl">
          <Title order={5} mb="sm">
            Items
          </Title>
          <Paper withBorder radius="md">
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Description</Table.Th>
                  <Table.Th ta="center">Quantity</Table.Th>
                  <Table.Th ta="right">Unit Price</Table.Th>
                  <Table.Th ta="right">Total</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {invoice.items.map((item) => (
                  <Table.Tr key={item.id}>
                    <Table.Td>
                      <Text fw={500}>{item.description}</Text>
                    </Table.Td>
                    <Table.Td ta="center">{item.quantity}</Table.Td>
                    <Table.Td ta="right">${item.unitPrice.toFixed(2)}</Table.Td>
                    <Table.Td ta="right" fw={500}>
                      ${item.total.toFixed(2)}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </Box>

        {/* Totals */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            {invoice.notes && (
              <Box>
                <Title order={6} mb="sm">
                  Notes:
                </Title>
                <Text size="sm" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                  {invoice.notes}
                </Text>
              </Box>
            )}
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper withBorder radius="md" p="md">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text>Subtotal:</Text>
                  <Text fw={500}>${invoice.subtotal.toFixed(2)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text>Tax ({invoice.taxRate}%):</Text>
                  <Text fw={500}>${invoice.taxAmount.toFixed(2)}</Text>
                </Group>
                <Divider />
                <Group justify="space-between">
                  <Text size="lg" fw={700}>
                    Total:
                  </Text>
                  <Text size="lg" fw={700} c="green">
                    ${invoice.total.toFixed(2)}
                  </Text>
                </Group>
                {invoice.paidAmount && invoice.paidAmount > 0 && (
                  <>
                    <Group justify="space-between">
                      <Text c="dimmed">Paid Amount:</Text>
                      <Text c="green" fw={500}>
                        ${invoice.paidAmount.toFixed(2)}
                      </Text>
                    </Group>
                    <Group justify="space-between">
                      <Text fw={500}>Balance Due:</Text>
                      <Text fw={500} c={invoice.total - invoice.paidAmount > 0 ? "red" : "green"}>
                        ${(invoice.total - invoice.paidAmount).toFixed(2)}
                      </Text>
                    </Group>
                  </>
                )}
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Footer */}
        <Box mt="xl" ta="center" className="print-footer">
          <Text size="sm" c="dimmed">
            Thank you for your business!
          </Text>
          <Text size="xs" c="dimmed" mt="xs">
            Tax ID: {COMPANY_INFO.taxId} | {COMPANY_INFO.website}
          </Text>
        </Box>
      </Paper>

      {/* Email Modal */}
      <Modal
        opened={emailModalOpened}
        onClose={() => setEmailModalOpened(false)}
        title="Send Invoice via Email"
        size="lg">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Send invoice {invoice.invoiceNumber} to {invoice.customer.name}
          </Text>

          <Group>
            <Text size="sm" fw={500} style={{ minWidth: "60px" }}>
              To:
            </Text>
            <Text size="sm">{emailData.to}</Text>
          </Group>

          <Text size="sm" fw={500}>
            Subject:
          </Text>
          <Text size="sm" p="sm" bg="gray.0" style={{ borderRadius: "4px" }}>
            {emailData.subject}
          </Text>

          <Textarea
            label="Message"
            value={emailData.message}
            onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
            rows={6}
            placeholder="Enter your message..."
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={() => setEmailModalOpened(false)}>
              Cancel
            </Button>
            <Button leftSection={<IconSend size={16} />} onClick={handleSendEmail}>
              Send Email
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Confirm Payment Modal */}
      <Modal
        opened={confirmPaymentModalOpened}
        onClose={() => setConfirmPaymentModalOpened(false)}
        title="Mark as Paid"
        size="sm">
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to mark this invoice as paid for ${invoice.total.toFixed(2)}?
          </Text>

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={() => setConfirmPaymentModalOpened(false)}>
              Cancel
            </Button>
            <Button color="green" onClick={confirmMarkAsPaid}>
              Mark as Paid
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        opened={confirmDeleteModalOpened}
        onClose={() => setConfirmDeleteModalOpened(false)}
        title="Delete Invoice"
        size="sm">
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete this invoice? This action cannot be undone.
          </Text>

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={() => setConfirmDeleteModalOpened(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={confirmDelete}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }

          .invoice-detail {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 20px !important;
          }

          .print-title {
            color: #000 !important;
          }

          .print-footer {
            margin-top: 40px !important;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </>
  );
}
