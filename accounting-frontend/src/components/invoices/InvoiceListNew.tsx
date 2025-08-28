import { useState } from "react";
// prettier-ignore
import { Box, TextInput, Button, Group, ActionIcon, Menu, Badge, Text, Paper, Modal, Table, ScrollArea, Pagination, Select, Grid, Card, Stack } from "@mantine/core";
// prettier-ignore
import { IconSearch, IconDots, IconEdit, IconTrash, IconEye, IconDownload, IconSend, IconFileInvoice, IconCheck, IconX, IconAlertTriangle, IconClock } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import type { Invoice, Customer } from "../../services/api";

// Mock data - in a real app, this would come from an API
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
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
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
    createdAt: new Date("2024-02-20"),
    updatedAt: new Date("2024-02-20"),
  },
];

const mockInvoices: Invoice[] = [
  {
    id: "INV-001",
    invoiceNumber: "INV-2024-001",
    customerId: "CUST-001",
    customer: mockCustomers[0],
    issueDate: new Date("2024-12-15"),
    dueDate: new Date("2025-01-15"),
    description: "Website development services",
    status: "sent",
    items: [
      {
        id: "1",
        description: "Frontend Development",
        quantity: 40,
        unitPrice: 75,
        total: 3000,
      },
      {
        id: "2",
        description: "Backend Development",
        quantity: 30,
        unitPrice: 85,
        total: 2550,
      },
    ],
    subtotal: 5550,
    taxRate: 10,
    taxAmount: 555,
    total: 6105,
    createdAt: new Date("2024-12-15"),
    updatedAt: new Date("2024-12-15"),
  },
  {
    id: "INV-002",
    invoiceNumber: "INV-2025-002",
    customerId: "CUST-002",
    customer: mockCustomers[1],
    issueDate: new Date("2025-01-14"),
    dueDate: new Date("2025-02-14"),
    description: "Mobile app development",
    status: "draft",
    items: [
      {
        id: "1",
        description: "iOS App Development",
        quantity: 60,
        unitPrice: 95,
        total: 5700,
      },
      {
        id: "2",
        description: "Android App Development",
        quantity: 50,
        unitPrice: 90,
        total: 4500,
      },
    ],
    subtotal: 10200,
    taxRate: 8.5,
    taxAmount: 867,
    total: 11067,
    createdAt: new Date("2025-01-14"),
    updatedAt: new Date("2025-01-14"),
  },
  {
    id: "INV-003",
    invoiceNumber: "INV-2024-003",
    customerId: "CUST-001",
    customer: mockCustomers[0],
    issueDate: new Date("2024-12-10"),
    dueDate: new Date("2025-01-10"),
    description: "SEO optimization services",
    status: "paid",
    items: [
      {
        id: "1",
        description: "SEO Audit",
        quantity: 1,
        unitPrice: 500,
        total: 500,
      },
      {
        id: "2",
        description: "Content Optimization",
        quantity: 20,
        unitPrice: 50,
        total: 1000,
      },
    ],
    subtotal: 1500,
    taxRate: 10,
    taxAmount: 150,
    total: 1650,
    paidAmount: 1650,
    paymentDate: new Date("2024-12-28"),
    createdAt: new Date("2024-12-10"),
    updatedAt: new Date("2024-12-28"),
  },
  {
    id: "INV-004",
    invoiceNumber: "INV-2025-004",
    customerId: "CUST-002",
    customer: mockCustomers[1],
    issueDate: new Date("2025-01-12"),
    dueDate: new Date("2025-02-12"),
    description: "Consulting services",
    status: "overdue",
    items: [
      {
        id: "1",
        description: "Technical Consulting",
        quantity: 10,
        unitPrice: 150,
        total: 1500,
      },
    ],
    subtotal: 1500,
    taxRate: 8.5,
    taxAmount: 127.5,
    total: 1627.5,
    createdAt: new Date("2025-01-12"),
    updatedAt: new Date("2025-01-12"),
  },
];

interface InvoiceListProps {
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoiceId: string) => void;
  onSend?: (invoice: Invoice) => void;
  onDownload?: (invoice: Invoice) => void;
  onView?: (invoice: Invoice) => void;
  loading?: boolean;
}

export function InvoiceList({
  onEdit,
  onDelete,
  onSend,
  onDownload,
  onView,
  loading = false,
}: InvoiceListProps) {
  const [invoices] = useState<Invoice[]>(mockInvoices);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  // Status configurations
  const statusConfig = {
    draft: { color: "gray", icon: IconFileInvoice, label: "Draft" },
    sent: { color: "blue", icon: IconSend, label: "Sent" },
    paid: { color: "green", icon: IconCheck, label: "Paid" },
    overdue: { color: "red", icon: IconAlertTriangle, label: "Overdue" },
    cancelled: { color: "dark", icon: IconX, label: "Cancelled" },
  };

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesGlobalFilter =
      invoice.invoiceNumber.toLowerCase().includes(globalFilter.toLowerCase()) ||
      invoice.customer?.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
      invoice.customer?.company.toLowerCase().includes(globalFilter.toLowerCase()) ||
      invoice.description.toLowerCase().includes(globalFilter.toLowerCase());

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;

    return matchesGlobalFilter && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + pageSize);

  // Calculate statistics
  const stats = {
    total: invoices.length,
    draft: invoices.filter((inv) => inv.status === "draft").length,
    sent: invoices.filter((inv) => inv.status === "sent").length,
    paid: invoices.filter((inv) => inv.status === "paid").length,
    overdue: invoices.filter((inv) => inv.status === "overdue").length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
    paidAmount: invoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.total, 0),
    pendingAmount: invoices
      .filter((inv) => inv.status !== "paid" && inv.status !== "cancelled")
      .reduce((sum, inv) => sum + inv.total, 0),
  };

  // Handle delete confirmation
  const handleDeleteClick = (invoiceId: string) => {
    setInvoiceToDelete(invoiceId);
    openDeleteModal();
  };

  const handleDeleteConfirm = () => {
    if (invoiceToDelete && onDelete) {
      onDelete(invoiceToDelete);
    }
    setInvoiceToDelete(null);
    closeDeleteModal();
  };

  return (
    <Box>
      {/* Summary Cards */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="xs" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <Box>
                <Text size="sm" c="dimmed">
                  Total Invoices
                </Text>
                <Text size="xl" fw={700}>
                  {stats.total}
                </Text>
              </Box>
              <IconFileInvoice size={24} style={{ color: "var(--mantine-color-blue-6)" }} />
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="xs" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <Box>
                <Text size="sm" c="dimmed">
                  Total Amount
                </Text>
                <Text size="xl" fw={700} c="green">
                  ${stats.totalAmount.toFixed(2)}
                </Text>
              </Box>
              <IconClock size={24} style={{ color: "var(--mantine-color-green-6)" }} />
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="xs" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <Box>
                <Text size="sm" c="dimmed">
                  Paid Amount
                </Text>
                <Text size="xl" fw={700} c="green">
                  ${stats.paidAmount.toFixed(2)}
                </Text>
              </Box>
              <IconCheck size={24} style={{ color: "var(--mantine-color-green-6)" }} />
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="xs" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <Box>
                <Text size="sm" c="dimmed">
                  Pending Amount
                </Text>
                <Text size="xl" fw={700} c="orange">
                  ${stats.pendingAmount.toFixed(2)}
                </Text>
              </Box>
              <IconAlertTriangle size={24} style={{ color: "var(--mantine-color-orange-6)" }} />
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Filters */}
      <Paper shadow="xs" radius="md" p="md" mb="xl" withBorder>
        <Group>
          <TextInput
            placeholder="Search invoices..."
            leftSection={<IconSearch size={16} />}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by status"
            data={[
              { value: "all", label: "All Status" },
              { value: "draft", label: "Draft" },
              { value: "sent", label: "Sent" },
              { value: "paid", label: "Paid" },
              { value: "overdue", label: "Overdue" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value || "all")}
            style={{ minWidth: 150 }}
          />
        </Group>
      </Paper>

      {/* Invoice Table */}
      <Paper shadow="xs" radius="md" withBorder>
        <ScrollArea>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Invoice #</Table.Th>
                <Table.Th>Customer</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Issue Date</Table.Th>
                <Table.Th>Due Date</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedInvoices.map((invoice) => {
                const config = statusConfig[invoice.status];
                const Icon = config.icon;

                return (
                  <Table.Tr key={invoice.id}>
                    <Table.Td>
                      <Text fw={500}>{invoice.invoiceNumber}</Text>
                      <Text size="sm" c="dimmed">
                        {invoice.description}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500}>{invoice.customer?.name}</Text>
                      <Text size="sm" c="dimmed">
                        {invoice.customer?.company}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={600}>${invoice.total.toFixed(2)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={config.color} variant="light" leftSection={<Icon size={12} />}>
                        {config.label}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{invoice.issueDate.toLocaleDateString()}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{invoice.dueDate.toLocaleDateString()}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {onView && (
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => onView(invoice)}
                            loading={loading}>
                            <IconEye size={16} />
                          </ActionIcon>
                        )}

                        <Menu shadow="md" width={180}>
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray">
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            {onEdit && (
                              <Menu.Item
                                leftSection={<IconEdit size={14} />}
                                onClick={() => onEdit(invoice)}>
                                Edit
                              </Menu.Item>
                            )}
                            {onSend && invoice.status !== "paid" && (
                              <Menu.Item
                                leftSection={<IconSend size={14} />}
                                onClick={() => onSend(invoice)}>
                                Send Email
                              </Menu.Item>
                            )}
                            {onDownload && (
                              <Menu.Item
                                leftSection={<IconDownload size={14} />}
                                onClick={() => onDownload(invoice)}>
                                Download PDF
                              </Menu.Item>
                            )}
                            <Menu.Divider />
                            {onDelete && (
                              <Menu.Item
                                leftSection={<IconTrash size={14} />}
                                color="red"
                                onClick={() => handleDeleteClick(invoice.id)}>
                                Delete
                              </Menu.Item>
                            )}
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <Group justify="space-between" p="md">
            <Text size="sm" c="dimmed">
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredInvoices.length)}{" "}
              of {filteredInvoices.length} results
            </Text>
            <Pagination
              value={currentPage}
              onChange={setCurrentPage}
              total={totalPages}
              size="sm"
            />
          </Group>
        )}
      </Paper>

      {/* Delete Confirmation Modal */}
      <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title="Delete Invoice" size="sm">
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete this invoice? This action cannot be undone.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteConfirm} loading={loading}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
