import { useState, useEffect } from "react";
import {
  Table,
  Group,
  Text,
  ActionIcon,
  Badge,
  ScrollArea,
  TextInput,
  Button,
  Paper,
  Menu,
  Stack,
  Grid,
  Card,
  Avatar,
  Select,
} from "@mantine/core";
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconDots,
  IconFileText,
  IconCalendar,
  IconCurrencyDollar,
  IconFilter,
  IconEye,
  IconCheck,
} from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { billApi, type Bill } from "../../services/api";

interface BillListProps {
  onCreateBill?: () => void;
  onEditBill?: (bill: Bill) => void;
  onViewBill?: (bill: Bill) => void;
  selectedBillId?: string;
  compact?: boolean;
}

const STATUS_COLORS = {
  draft: "gray",
  pending: "blue",
  paid: "green",
  overdue: "red",
  cancelled: "red",
};

const STATUS_LABELS = {
  draft: "Draft",
  pending: "Pending",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export default function BillList({
  onCreateBill,
  onEditBill,
  onViewBill,
  selectedBillId,
  compact = false,
}: BillListProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = bills;

    // Filter by search query
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (bill) =>
          bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bill.vendor?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bill.vendor?.company.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((bill) => bill.status === statusFilter);
    }

    setFilteredBills(filtered);
  }, [bills, searchQuery, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const billsData = await billApi.getAll();
      setBills(billsData);
    } catch (error) {
      console.error("Failed to load data:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load bills",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBill = (bill: Bill) => {
    modals.openConfirmModal({
      title: "Delete Bill",
      children: (
        <Text size="sm">
          Are you sure you want to delete bill <strong>{bill.billNumber}</strong>? This action
          cannot be undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await billApi.delete(bill.id);
          notifications.show({
            title: "Success",
            message: "Bill deleted successfully",
            color: "green",
          });
          loadData();
        } catch (error) {
          console.error("Failed to delete bill:", error);
          notifications.show({
            title: "Error",
            message: "Failed to delete bill",
            color: "red",
          });
        }
      },
    });
  };

  const handleMarkAsPaid = (bill: Bill) => {
    modals.openConfirmModal({
      title: "Mark as Paid",
      children: (
        <Text size="sm">
          Mark bill <strong>{bill.billNumber}</strong> as paid?
        </Text>
      ),
      labels: { confirm: "Mark as Paid", cancel: "Cancel" },
      confirmProps: { color: "green" },
      onConfirm: async () => {
        try {
          await billApi.markAsPaid(bill.id, bill.total, new Date());
          notifications.show({
            title: "Success",
            message: "Bill marked as paid",
            color: "green",
          });
          loadData();
        } catch (error) {
          console.error("Failed to mark bill as paid:", error);
          notifications.show({
            title: "Error",
            message: "Failed to mark bill as paid",
            color: "red",
          });
        }
      },
    });
  };

  const getBillSummary = () => {
    const total = bills.length;
    const pending = bills.filter((b) => b.status === "pending").length;
    const paid = bills.filter((b) => b.status === "paid").length;
    const overdue = bills.filter((b) => b.status === "overdue").length;
    const totalAmount = bills.reduce((sum, bill) => sum + bill.total, 0);

    return { total, pending, paid, overdue, totalAmount };
  };

  if (compact) {
    return (
      <Stack gap="md">
        <Group justify="space-between">
          <TextInput
            placeholder="Search bills..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          {onCreateBill && (
            <Button leftSection={<IconPlus size={16} />} onClick={onCreateBill}>
              Add Bill
            </Button>
          )}
        </Group>

        <ScrollArea h={400}>
          <Stack gap="xs">
            {filteredBills.map((bill) => (
              <Card
                key={bill.id}
                p="sm"
                withBorder
                style={{
                  cursor: onViewBill ? "pointer" : "default",
                  backgroundColor:
                    selectedBillId === bill.id ? "var(--mantine-color-blue-0)" : undefined,
                }}
                onClick={() => onViewBill?.(bill)}>
                <Group justify="space-between">
                  <Group>
                    <Avatar color="orange" radius="sm">
                      <IconFileText size={16} />
                    </Avatar>
                    <div>
                      <Group gap="xs">
                        <Text fw={500} size="sm">
                          {bill.billNumber}
                        </Text>
                        <Badge color={STATUS_COLORS[bill.status]} size="xs">
                          {STATUS_LABELS[bill.status]}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {bill.vendor?.company} • ${bill.total.toFixed(2)}
                      </Text>
                    </div>
                  </Group>
                  {onEditBill && (
                    <ActionIcon
                      variant="subtle"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditBill(bill);
                      }}>
                      <IconEdit size={16} />
                    </ActionIcon>
                  )}
                </Group>
              </Card>
            ))}
          </Stack>
        </ScrollArea>
      </Stack>
    );
  }

  const summary = getBillSummary();

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Text size="xl" fw={700}>
            Bills
          </Text>
          <Text size="sm" c="dimmed">
            Manage vendor bills and payments
          </Text>
        </div>
        {onCreateBill && (
          <Button leftSection={<IconPlus size={16} />} onClick={onCreateBill}>
            Add Bill
          </Button>
        )}
      </Group>

      {/* Summary Cards */}
      <Grid>
        <Grid.Col span={3}>
          <Paper p="md" withBorder>
            <Group>
              <Avatar color="blue" radius="sm">
                <IconFileText size={20} />
              </Avatar>
              <div>
                <Text size="xl" fw={700}>
                  {summary.total}
                </Text>
                <Text size="sm" c="dimmed">
                  Total Bills
                </Text>
              </div>
            </Group>
          </Paper>
        </Grid.Col>
        <Grid.Col span={3}>
          <Paper p="md" withBorder>
            <Group>
              <Avatar color="yellow" radius="sm">
                <IconCalendar size={20} />
              </Avatar>
              <div>
                <Text size="xl" fw={700}>
                  {summary.pending}
                </Text>
                <Text size="sm" c="dimmed">
                  Pending
                </Text>
              </div>
            </Group>
          </Paper>
        </Grid.Col>
        <Grid.Col span={3}>
          <Paper p="md" withBorder>
            <Group>
              <Avatar color="green" radius="sm">
                <IconCheck size={20} />
              </Avatar>
              <div>
                <Text size="xl" fw={700}>
                  {summary.paid}
                </Text>
                <Text size="sm" c="dimmed">
                  Paid
                </Text>
              </div>
            </Group>
          </Paper>
        </Grid.Col>
        <Grid.Col span={3}>
          <Paper p="md" withBorder>
            <Group>
              <Avatar color="green" radius="sm">
                <IconCurrencyDollar size={20} />
              </Avatar>
              <div>
                <Text size="xl" fw={700}>
                  ${summary.totalAmount.toFixed(2)}
                </Text>
                <Text size="sm" c="dimmed">
                  Total Amount
                </Text>
              </div>
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Filters */}
      <Group>
        <TextInput
          placeholder="Search bills..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          leftSection={<IconFilter size={16} />}
          placeholder="All Status"
          value={statusFilter}
          onChange={(value) => setStatusFilter(value || "all")}
          data={[
            { value: "all", label: "All Status" },
            { value: "draft", label: "Draft" },
            { value: "pending", label: "Pending" },
            { value: "paid", label: "Paid" },
            { value: "overdue", label: "Overdue" },
            { value: "cancelled", label: "Cancelled" },
          ]}
          clearable={false}
        />
      </Group>

      {/* Bills Table */}
      <Paper withBorder>
        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Bill #</Table.Th>
                <Table.Th>Vendor</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Due Date</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text ta="center" py="xl">
                      Loading bills...
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : filteredBills.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text ta="center" py="xl" c="dimmed">
                      {searchQuery || statusFilter !== "all"
                        ? "No bills found matching your criteria"
                        : "No bills yet"}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredBills.map((bill) => (
                  <Table.Tr
                    key={bill.id}
                    style={{
                      cursor: onViewBill ? "pointer" : "default",
                      backgroundColor:
                        selectedBillId === bill.id ? "var(--mantine-color-blue-0)" : undefined,
                    }}
                    onClick={() => onViewBill?.(bill)}>
                    <Table.Td>
                      <Text fw={500}>{bill.billNumber}</Text>
                    </Table.Td>
                    <Table.Td>
                      <div>
                        <Text fw={500}>{bill.vendor?.name}</Text>
                        <Text size="sm" c="dimmed">
                          {bill.vendor?.company}
                        </Text>
                      </div>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{new Date(bill.billDate).toLocaleDateString()}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{new Date(bill.dueDate).toLocaleDateString()}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500}>${bill.total.toFixed(2)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={STATUS_COLORS[bill.status]} variant="light">
                        {STATUS_LABELS[bill.status]}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" onClick={(e) => e.stopPropagation()}>
                            <IconDots size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          {onViewBill && (
                            <Menu.Item
                              leftSection={<IconEye size={14} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewBill(bill);
                              }}>
                              View
                            </Menu.Item>
                          )}
                          {onEditBill && (
                            <Menu.Item
                              leftSection={<IconEdit size={14} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditBill(bill);
                              }}>
                              Edit
                            </Menu.Item>
                          )}
                          {bill.status === "pending" && (
                            <Menu.Item
                              leftSection={<IconCheck size={14} />}
                              color="green"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsPaid(bill);
                              }}>
                              Mark as Paid
                            </Menu.Item>
                          )}
                          <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            color="red"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBill(bill);
                            }}>
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>
    </Stack>
  );
}
