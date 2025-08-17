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
  IconReceipt,
  IconCurrencyDollar,
  IconFilter,
  IconEye,
  IconCheck,
  IconFileText,
} from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { expenseApi, type Expense } from "../../services/api";

interface ExpenseListProps {
  onCreateExpense?: () => void;
  onEditExpense?: (expense: Expense) => void;
  onViewExpense?: (expense: Expense) => void;
  selectedExpenseId?: string;
  compact?: boolean;
}

const STATUS_COLORS = {
  draft: "gray",
  submitted: "blue",
  approved: "green",
  reimbursed: "teal",
};

const STATUS_LABELS = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  reimbursed: "Reimbursed",
};

const PAYMENT_METHOD_LABELS = {
  cash: "Cash",
  card: "Card",
  check: "Check",
  bank_transfer: "Bank Transfer",
  other: "Other",
};

export default function ExpenseList({
  onCreateExpense,
  onEditExpense,
  onViewExpense,
  selectedExpenseId,
  compact = false,
}: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    let filtered = expenses;

    // Filter by search query
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (expense) =>
          expense.expenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          expense.vendor?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((expense) => expense.status === statusFilter);
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((expense) => expense.category === categoryFilter);
    }

    setFilteredExpenses(filtered);
  }, [expenses, searchQuery, statusFilter, categoryFilter]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await expenseApi.getAll();
      setExpenses(data);
    } catch (error) {
      console.error("Failed to load expenses:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load expenses",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = (expense: Expense) => {
    modals.openConfirmModal({
      title: "Delete Expense",
      children: (
        <Text size="sm">
          Are you sure you want to delete expense <strong>{expense.expenseNumber}</strong>? This
          action cannot be undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await expenseApi.delete(expense.id);
          notifications.show({
            title: "Success",
            message: "Expense deleted successfully",
            color: "green",
          });
          loadExpenses();
        } catch (error) {
          console.error("Failed to delete expense:", error);
          notifications.show({
            title: "Error",
            message: "Failed to delete expense",
            color: "red",
          });
        }
      },
    });
  };

  const handleUpdateStatus = (expense: Expense, status: Expense["status"]) => {
    modals.openConfirmModal({
      title: "Update Status",
      children: (
        <Text size="sm">
          Update expense <strong>{expense.expenseNumber}</strong> status to{" "}
          <strong>{STATUS_LABELS[status]}</strong>?
        </Text>
      ),
      labels: { confirm: "Update", cancel: "Cancel" },
      confirmProps: { color: "blue" },
      onConfirm: async () => {
        try {
          await expenseApi.updateStatus(expense.id, status);
          notifications.show({
            title: "Success",
            message: "Expense status updated",
            color: "green",
          });
          loadExpenses();
        } catch (error) {
          console.error("Failed to update expense status:", error);
          notifications.show({
            title: "Error",
            message: "Failed to update expense status",
            color: "red",
          });
        }
      },
    });
  };

  const getExpenseSummary = () => {
    const total = expenses.length;
    const draft = expenses.filter((e) => e.status === "draft").length;
    const submitted = expenses.filter((e) => e.status === "submitted").length;
    const approved = expenses.filter((e) => e.status === "approved").length;
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.total, 0);

    return { total, draft, submitted, approved, totalAmount };
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(expenses.map((e) => e.category))];
    return [
      { value: "all", label: "All Categories" },
      ...categories.map((cat) => ({ value: cat, label: cat })),
    ];
  };

  if (compact) {
    return (
      <Stack gap="md">
        <Group justify="space-between">
          <TextInput
            placeholder="Search expenses..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          {onCreateExpense && (
            <Button leftSection={<IconPlus size={16} />} onClick={onCreateExpense}>
              Add Expense
            </Button>
          )}
        </Group>

        <ScrollArea h={400}>
          <Stack gap="xs">
            {filteredExpenses.map((expense) => (
              <Card
                key={expense.id}
                p="sm"
                withBorder
                style={{
                  cursor: onViewExpense ? "pointer" : "default",
                  backgroundColor:
                    selectedExpenseId === expense.id ? "var(--mantine-color-blue-0)" : undefined,
                }}
                onClick={() => onViewExpense?.(expense)}>
                <Group justify="space-between">
                  <Group>
                    <Avatar color="purple" radius="sm">
                      <IconReceipt size={16} />
                    </Avatar>
                    <div>
                      <Group gap="xs">
                        <Text fw={500} size="sm">
                          {expense.expenseNumber}
                        </Text>
                        <Badge color={STATUS_COLORS[expense.status]} size="xs">
                          {STATUS_LABELS[expense.status]}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {expense.category} • ${expense.total.toFixed(2)}
                      </Text>
                    </div>
                  </Group>
                  {onEditExpense && (
                    <ActionIcon
                      variant="subtle"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditExpense(expense);
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

  const summary = getExpenseSummary();

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Text size="xl" fw={700}>
            Expenses
          </Text>
          <Text size="sm" c="dimmed">
            Track and manage business expenses
          </Text>
        </div>
        {onCreateExpense && (
          <Button leftSection={<IconPlus size={16} />} onClick={onCreateExpense}>
            Add Expense
          </Button>
        )}
      </Group>

      {/* Summary Cards */}
      <Grid>
        <Grid.Col span={3}>
          <Paper p="md" withBorder>
            <Group>
              <Avatar color="blue" radius="sm">
                <IconReceipt size={20} />
              </Avatar>
              <div>
                <Text size="xl" fw={700}>
                  {summary.total}
                </Text>
                <Text size="sm" c="dimmed">
                  Total Expenses
                </Text>
              </div>
            </Group>
          </Paper>
        </Grid.Col>
        <Grid.Col span={3}>
          <Paper p="md" withBorder>
            <Group>
              <Avatar color="orange" radius="sm">
                <IconFileText size={20} />
              </Avatar>
              <div>
                <Text size="xl" fw={700}>
                  {summary.draft}
                </Text>
                <Text size="sm" c="dimmed">
                  Draft
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
                  {summary.approved}
                </Text>
                <Text size="sm" c="dimmed">
                  Approved
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
          placeholder="Search expenses..."
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
            { value: "submitted", label: "Submitted" },
            { value: "approved", label: "Approved" },
            { value: "reimbursed", label: "Reimbursed" },
          ]}
          clearable={false}
        />
        <Select
          leftSection={<IconFilter size={16} />}
          placeholder="All Categories"
          value={categoryFilter}
          onChange={(value) => setCategoryFilter(value || "all")}
          data={getUniqueCategories()}
          clearable={false}
        />
      </Group>

      {/* Expenses Table */}
      <Paper withBorder>
        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Expense #</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Vendor</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Payment Method</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={9}>
                    <Text ta="center" py="xl">
                      Loading expenses...
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : filteredExpenses.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={9}>
                    <Text ta="center" py="xl" c="dimmed">
                      {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                        ? "No expenses found matching your criteria"
                        : "No expenses yet"}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <Table.Tr
                    key={expense.id}
                    style={{
                      cursor: onViewExpense ? "pointer" : "default",
                      backgroundColor:
                        selectedExpenseId === expense.id
                          ? "var(--mantine-color-blue-0)"
                          : undefined,
                    }}
                    onClick={() => onViewExpense?.(expense)}>
                    <Table.Td>
                      <Text fw={500}>{expense.expenseNumber}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{new Date(expense.date).toLocaleDateString()}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light">{expense.category}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{expense.description}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{expense.vendor?.name || "-"}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500}>${expense.total.toFixed(2)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{PAYMENT_METHOD_LABELS[expense.paymentMethod]}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={STATUS_COLORS[expense.status]} variant="light">
                        {STATUS_LABELS[expense.status]}
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
                          {onViewExpense && (
                            <Menu.Item
                              leftSection={<IconEye size={14} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewExpense(expense);
                              }}>
                              View
                            </Menu.Item>
                          )}
                          {onEditExpense && (
                            <Menu.Item
                              leftSection={<IconEdit size={14} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditExpense(expense);
                              }}>
                              Edit
                            </Menu.Item>
                          )}
                          {expense.status === "draft" && (
                            <Menu.Item
                              leftSection={<IconCheck size={14} />}
                              color="blue"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(expense, "submitted");
                              }}>
                              Submit
                            </Menu.Item>
                          )}
                          {expense.status === "submitted" && (
                            <Menu.Item
                              leftSection={<IconCheck size={14} />}
                              color="green"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(expense, "approved");
                              }}>
                              Approve
                            </Menu.Item>
                          )}
                          <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            color="red"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteExpense(expense);
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
