import { useState } from "react";
// prettier-ignore
import { Box, TextInput, Button, Group, ActionIcon, Menu, Badge, Text, Paper, Modal, Table, ScrollArea, Pagination, Select } from "@mantine/core";
// prettier-ignore
import { IconSearch, IconPlus, IconDots, IconEdit, IconTrash, IconMail, IconPhone, IconEye, IconFileInvoice, IconSortAscending, IconSortDescending } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";

// Types
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  country: string;
  status: "active" | "inactive";
  totalInvoices: number;
  totalAmount: number;
  lastInvoice: string;
  createdAt: string;
}

// Mock data
const mockCustomers: Customer[] = [
  {
    id: "CUST-001",
    name: "John Smith",
    email: "john.smith@acmecorp.com",
    phone: "+1 (555) 123-4567",
    company: "Acme Corporation",
    address: "123 Business St",
    city: "New York",
    country: "USA",
    status: "active",
    totalInvoices: 15,
    totalAmount: 45250.0,
    lastInvoice: "2025-01-10",
    createdAt: "2024-03-15",
  },
  {
    id: "CUST-002",
    name: "Sarah Johnson",
    email: "sarah@techstart.io",
    phone: "+1 (555) 987-6543",
    company: "TechStart Inc",
    address: "456 Innovation Ave",
    city: "San Francisco",
    country: "USA",
    status: "active",
    totalInvoices: 8,
    totalAmount: 23800.0,
    lastInvoice: "2025-01-08",
    createdAt: "2024-06-20",
  },
  {
    id: "CUST-003",
    name: "Michael Brown",
    email: "mike.brown@globalltd.com",
    phone: "+1 (555) 456-7890",
    company: "Global Ltd",
    address: "789 Commerce Blvd",
    city: "Chicago",
    country: "USA",
    status: "inactive",
    totalInvoices: 3,
    totalAmount: 8500.0,
    lastInvoice: "2024-11-15",
    createdAt: "2024-08-10",
  },
  {
    id: "CUST-004",
    name: "Emily Davis",
    email: "emily@startupxyz.com",
    phone: "+1 (555) 321-0987",
    company: "StartupXYZ",
    address: "321 Startup Lane",
    city: "Austin",
    country: "USA",
    status: "active",
    totalInvoices: 12,
    totalAmount: 31200.0,
    lastInvoice: "2025-01-12",
    createdAt: "2024-04-05",
  },
];

interface CustomerListProps {
  onEdit?: (customer: Customer) => void;
  onDelete?: (customerId: string) => void;
  onCreateInvoice?: (customer: Customer) => void;
}

export function CustomerList({ onEdit, onDelete, onCreateInvoice }: CustomerListProps) {
  const [customers] = useState<Customer[]>(mockCustomers);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof Customer>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const itemsPerPage = 10;

  // Filter and sort customers
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      globalFilter === "" ||
      customer.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
      customer.email.toLowerCase().includes(globalFilter.toLowerCase()) ||
      customer.company.toLowerCase().includes(globalFilter.toLowerCase());

    const matchesStatus = statusFilter === null || customer.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = sortedCustomers.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);

  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: keyof Customer) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <IconSortAscending size={14} />
    ) : (
      <IconSortDescending size={14} />
    );
  };

  return (
    <Box>
      {/* Toolbar */}
      <Group justify="space-between" mb="md">
        <Group gap="md">
          <TextInput
            placeholder="Search customers..."
            leftSection={<IconSearch size={16} />}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            style={{ minWidth: 300 }}
          />
          <Select
            placeholder="Filter by status"
            data={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            clearable
          />
        </Group>
        <Button leftSection={<IconPlus size={16} />}>Add Customer</Button>
      </Group>

      {/* Table */}
      <Paper shadow="xs" radius="md" withBorder>
        <ScrollArea>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ cursor: "pointer" }} onClick={() => handleSort("id")}>
                  <Group gap="xs">ID {getSortIcon("id")}</Group>
                </Table.Th>
                <Table.Th style={{ cursor: "pointer" }} onClick={() => handleSort("name")}>
                  <Group gap="xs">Customer {getSortIcon("name")}</Group>
                </Table.Th>
                <Table.Th style={{ cursor: "pointer" }} onClick={() => handleSort("email")}>
                  <Group gap="xs">Email {getSortIcon("email")}</Group>
                </Table.Th>
                <Table.Th>Phone</Table.Th>
                <Table.Th>Location</Table.Th>
                <Table.Th style={{ cursor: "pointer" }} onClick={() => handleSort("status")}>
                  <Group gap="xs">Status {getSortIcon("status")}</Group>
                </Table.Th>
                <Table.Th style={{ cursor: "pointer" }} onClick={() => handleSort("totalInvoices")}>
                  <Group gap="xs">Invoices {getSortIcon("totalInvoices")}</Group>
                </Table.Th>
                <Table.Th style={{ cursor: "pointer" }} onClick={() => handleSort("totalAmount")}>
                  <Group gap="xs">Total Amount {getSortIcon("totalAmount")}</Group>
                </Table.Th>
                <Table.Th>Last Invoice</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedCustomers.map((customer) => (
                <Table.Tr key={customer.id}>
                  <Table.Td>
                    <Text size="sm" fw={500} c="blue">
                      {customer.id}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Box>
                      <Text size="sm" fw={500}>
                        {customer.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {customer.company}
                      </Text>
                    </Box>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="blue" style={{ cursor: "pointer" }}>
                      {customer.email}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{customer.phone}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Box>
                      <Text size="sm">{customer.city}</Text>
                      <Text size="xs" c="dimmed">
                        {customer.country}
                      </Text>
                    </Box>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={customer.status === "active" ? "green" : "gray"}
                      variant="light"
                      size="sm">
                      {customer.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {customer.totalInvoices}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500} c="green">
                      ${customer.totalAmount.toLocaleString()}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{customer.lastInvoice}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Menu shadow="md" width={200}>
                      <Menu.Target>
                        <ActionIcon variant="subtle">
                          <IconDots size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconEye size={14} />}
                          onClick={() => {
                            setSelectedCustomer(customer);
                            open();
                          }}>
                          View Details
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconEdit size={14} />}
                          onClick={() => onEdit?.(customer)}>
                          Edit Customer
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconFileInvoice size={14} />}
                          onClick={() => onCreateInvoice?.(customer)}>
                          Create Invoice
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconMail size={14} />}
                          onClick={() => window.open(`mailto:${customer.email}`)}>
                          Send Email
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconPhone size={14} />}
                          onClick={() => window.open(`tel:${customer.phone}`)}>
                          Call Customer
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                          leftSection={<IconTrash size={14} />}
                          color="red"
                          onClick={() => onDelete?.(customer.id)}>
                          Delete Customer
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <Group justify="center" p="md">
            <Pagination
              value={currentPage}
              onChange={setCurrentPage}
              total={totalPages}
              size="sm"
            />
          </Group>
        )}
      </Paper>

      {/* Customer Details Modal */}
      <Modal opened={opened} onClose={close} title="Customer Details" size="lg">
        {selectedCustomer && (
          <Box>
            <Group justify="space-between" mb="md">
              <Box>
                <Text size="lg" fw={700}>
                  {selectedCustomer.name}
                </Text>
                <Text size="sm" c="dimmed">
                  {selectedCustomer.company}
                </Text>
              </Box>
              <Badge
                color={selectedCustomer.status === "active" ? "green" : "gray"}
                variant="light">
                {selectedCustomer.status}
              </Badge>
            </Group>

            <Group grow mb="md">
              <Box>
                <Text size="sm" c="dimmed">
                  Email
                </Text>
                <Text size="sm">{selectedCustomer.email}</Text>
              </Box>
              <Box>
                <Text size="sm" c="dimmed">
                  Phone
                </Text>
                <Text size="sm">{selectedCustomer.phone}</Text>
              </Box>
            </Group>

            <Box mb="md">
              <Text size="sm" c="dimmed">
                Address
              </Text>
              <Text size="sm">
                {selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.country}
              </Text>
            </Box>

            <Group grow mb="md">
              <Box>
                <Text size="sm" c="dimmed">
                  Total Invoices
                </Text>
                <Text size="lg" fw={700}>
                  {selectedCustomer.totalInvoices}
                </Text>
              </Box>
              <Box>
                <Text size="sm" c="dimmed">
                  Total Amount
                </Text>
                <Text size="lg" fw={700} c="green">
                  ${selectedCustomer.totalAmount.toLocaleString()}
                </Text>
              </Box>
            </Group>

            <Group grow>
              <Box>
                <Text size="sm" c="dimmed">
                  Last Invoice
                </Text>
                <Text size="sm">{selectedCustomer.lastInvoice}</Text>
              </Box>
              <Box>
                <Text size="sm" c="dimmed">
                  Customer Since
                </Text>
                <Text size="sm">{selectedCustomer.createdAt}</Text>
              </Box>
            </Group>

            <Group justify="flex-end" mt="xl">
              <Button variant="light" onClick={() => onEdit?.(selectedCustomer)}>
                Edit Customer
              </Button>
              <Button onClick={() => onCreateInvoice?.(selectedCustomer)}>Create Invoice</Button>
            </Group>
          </Box>
        )}
      </Modal>
    </Box>
  );
}
