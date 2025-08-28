// prettier-ignore
import { Table, Group, Text, ActionIcon, Badge, Box, Button, Paper, Card, Stack, NumberFormatter, TextInput, Select, Flex, Pagination, Menu, rem } from "@mantine/core";
// prettier-ignore
import { IconEdit, IconTrash, IconEye, IconPlus, IconSearch, IconDownload, IconDots, IconArrowUp, IconArrowDown, IconMinus, IconCalendar } from "@tabler/icons-react";
import { useState } from "react";
import { motion } from "motion/react";
import Decimal from "decimal.js";
import { DatePickerInput } from "@mantine/dates";
import { useCurrency } from "../../hooks/useCurrency";

interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  category: string;
  account: string;
  accountId: string;
  reference?: string;
  status: "pending" | "cleared" | "reconciled";
  tags?: string[];
  attachments?: number;
}

// Mock data for demonstration
const mockTransactions: Transaction[] = [
  {
    id: "1",
    date: new Date("2024-08-17"),
    description: "Office Supply Purchase",
    amount: -156.78,
    type: "expense",
    category: "Office Supplies",
    account: "Business Checking",
    accountId: "1",
    reference: "PO-2024-001",
    status: "cleared",
    tags: ["supplies", "office"],
    attachments: 1,
  },
  {
    id: "2",
    date: new Date("2024-08-16"),
    description: "Client Payment - ABC Corp",
    amount: 2500.0,
    type: "income",
    category: "Sales Revenue",
    account: "Business Checking",
    accountId: "1",
    reference: "INV-2024-045",
    status: "cleared",
    tags: ["revenue", "client"],
  },
  {
    id: "3",
    date: new Date("2024-08-16"),
    description: "Monthly Software Subscription",
    amount: -99.0,
    type: "expense",
    category: "Software & Tools",
    account: "Business Credit Card",
    accountId: "3",
    reference: "SUB-2024-08",
    status: "pending",
    tags: ["software", "subscription"],
  },
  {
    id: "4",
    date: new Date("2024-08-15"),
    description: "Bank Transfer to Savings",
    amount: -5000.0,
    type: "transfer",
    category: "Transfer",
    account: "Business Checking",
    accountId: "1",
    reference: "TRF-2024-003",
    status: "cleared",
  },
  {
    id: "5",
    date: new Date("2024-08-15"),
    description: "Consulting Services Revenue",
    amount: 1200.0,
    type: "income",
    category: "Consulting Revenue",
    account: "Business Checking",
    accountId: "1",
    reference: "INV-2024-046",
    status: "reconciled",
    tags: ["consulting", "revenue"],
  },
  {
    id: "6",
    date: new Date("2024-08-14"),
    description: "Internet & Phone Bill",
    amount: -180.5,
    type: "expense",
    category: "Utilities",
    account: "Business Checking",
    accountId: "1",
    reference: "UTIL-2024-08",
    status: "cleared",
    tags: ["utilities", "monthly"],
  },
  {
    id: "7",
    date: new Date("2024-08-13"),
    description: "Coffee & Snacks",
    amount: -45.0,
    type: "expense",
    category: "Meals & Entertainment",
    account: "Petty Cash",
    accountId: "4",
    status: "cleared",
    tags: ["meals", "office"],
  },
  {
    id: "8",
    date: new Date("2024-08-12"),
    description: "Marketing Campaign Payment",
    amount: -800.0,
    type: "expense",
    category: "Marketing",
    account: "Business Credit Card",
    accountId: "3",
    reference: "MKT-2024-Q3",
    status: "cleared",
    tags: ["marketing", "advertising"],
    attachments: 2,
  },
];

const statusConfig = {
  pending: { color: "yellow", label: "Pending" },
  cleared: { color: "green", label: "Cleared" },
  reconciled: { color: "blue", label: "Reconciled" },
};

const typeConfig = {
  income: { icon: IconArrowUp, color: "green", label: "Income" },
  expense: { icon: IconArrowDown, color: "red", label: "Expense" },
  transfer: { icon: IconMinus, color: "blue", label: "Transfer" },
};

export function TransactionList() {
  const { getCurrencySymbol } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterAccount, setFilterAccount] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || transaction.type === filterType;
    const matchesStatus = !filterStatus || transaction.status === filterStatus;
    const matchesAccount = !filterAccount || transaction.accountId === filterAccount;

    const matchesDateRange =
      !dateRange[0] ||
      !dateRange[1] ||
      (transaction.date >= dateRange[0] && transaction.date <= dateRange[1]);

    return matchesSearch && matchesType && matchesStatus && matchesAccount && matchesDateRange;
  });

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);

  const summary = filteredTransactions.reduce(
    (acc, transaction) => {
      if (transaction.type === "income") {
        acc.totalIncome = acc.totalIncome.plus(transaction.amount);
      } else if (transaction.type === "expense") {
        acc.totalExpenses = acc.totalExpenses.plus(Math.abs(transaction.amount));
      }
      return acc;
    },
    { totalIncome: new Decimal(0), totalExpenses: new Decimal(0) }
  );

  const netAmount = summary.totalIncome.minus(summary.totalExpenses);

  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter((tx) => tx.id !== id));
  };

  const TransactionIcon = ({ type }: { type: Transaction["type"] }) => {
    const config = typeConfig[type];
    const Icon = config.icon;
    return <Icon size={16} style={{ color: `var(--mantine-color-${config.color}-6)` }} />;
  };

  const StatusBadge = ({ status }: { status: Transaction["status"] }) => {
    const config = statusConfig[status];
    return (
      <Badge variant="light" color={config.color} size="sm">
        {config.label}
      </Badge>
    );
  };

  const formatAmount = (amount: number, type: Transaction["type"]) => {
    const isNegative = amount < 0;
    const displayAmount = Math.abs(amount);

    return (
      <NumberFormatter
        value={displayAmount}
        prefix={isNegative ? `-${getCurrencySymbol()}` : getCurrencySymbol()}
        thousandSeparator
        decimalScale={2}
        style={{
          color:
            type === "income"
              ? "var(--mantine-color-green-6)"
              : type === "expense"
              ? "var(--mantine-color-red-6)"
              : "var(--mantine-color-blue-6)",
        }}
      />
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType(null);
    setFilterStatus(null);
    setFilterAccount(null);
    setDateRange([null, null]);
    setCurrentPage(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}>
      <Stack gap="lg">
        {/* Summary Cards */}
        <Group grow>
          <Card shadow="xs" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <Box>
                <Text size="sm" c="dimmed" mb={4}>
                  Total Income
                </Text>
                <Text size="xl" fw={700} c="green">
                  <NumberFormatter
                    value={summary.totalIncome.toNumber()}
                    prefix={getCurrencySymbol()}
                    thousandSeparator
                    decimalScale={2}
                  />
                </Text>
              </Box>
              <IconArrowUp size={32} style={{ color: "var(--mantine-color-green-6)" }} />
            </Group>
          </Card>

          <Card shadow="xs" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <Box>
                <Text size="sm" c="dimmed" mb={4}>
                  Total Expenses
                </Text>
                <Text size="xl" fw={700} c="red">
                  <NumberFormatter
                    value={summary.totalExpenses.toNumber()}
                    prefix={getCurrencySymbol()}
                    thousandSeparator
                    decimalScale={2}
                  />
                </Text>
              </Box>
              <IconArrowDown size={32} style={{ color: "var(--mantine-color-red-6)" }} />
            </Group>
          </Card>

          <Card shadow="xs" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <Box>
                <Text size="sm" c="dimmed" mb={4}>
                  Net Amount
                </Text>
                <Text
                  size="xl"
                  fw={700}
                  c={netAmount.greaterThan(0) ? "green" : netAmount.lessThan(0) ? "red" : "gray"}>
                  <NumberFormatter
                    value={netAmount.toNumber()}
                    prefix={getCurrencySymbol()}
                    thousandSeparator
                    decimalScale={2}
                  />
                </Text>
              </Box>
              <IconMinus
                size={32}
                style={{
                  color: netAmount.greaterThan(0)
                    ? "var(--mantine-color-green-6)"
                    : netAmount.lessThan(0)
                    ? "var(--mantine-color-red-6)"
                    : "var(--mantine-color-gray-6)",
                }}
              />
            </Group>
          </Card>
        </Group>

        {/* Header and Controls */}
        <Group justify="space-between">
          <Box>
            <Text size="xl" fw={700}>
              Transaction History
            </Text>
            <Text size="sm" c="dimmed">
              View and manage all financial transactions ({filteredTransactions.length} of{" "}
              {transactions.length} transactions)
            </Text>
          </Box>
          <Group>
            <Button leftSection={<IconDownload size={16} />} variant="light">
              Export
            </Button>
            <Button leftSection={<IconPlus size={16} />}>Add Transaction</Button>
          </Group>
        </Group>

        {/* Filters */}
        <Paper p="md" radius="md" withBorder>
          <Stack gap="md">
            <Group>
              <TextInput
                placeholder="Search transactions..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <DatePickerInput
                type="range"
                placeholder="Date range"
                leftSection={<IconCalendar size={16} />}
                value={dateRange}
                onChange={(value) => setDateRange(value as [Date | null, Date | null])}
                clearable
                style={{ minWidth: 200 }}
              />
            </Group>

            <Flex gap="md" wrap="wrap">
              <Select
                placeholder="Transaction type"
                data={[
                  { value: "income", label: "Income" },
                  { value: "expense", label: "Expense" },
                  { value: "transfer", label: "Transfer" },
                ]}
                value={filterType}
                onChange={setFilterType}
                clearable
                style={{ minWidth: 150 }}
              />

              <Select
                placeholder="Status"
                data={[
                  { value: "pending", label: "Pending" },
                  { value: "cleared", label: "Cleared" },
                  { value: "reconciled", label: "Reconciled" },
                ]}
                value={filterStatus}
                onChange={setFilterStatus}
                clearable
                style={{ minWidth: 120 }}
              />

              <Select
                placeholder="Account"
                data={[
                  { value: "1", label: "Business Checking" },
                  { value: "2", label: "Savings Account" },
                  { value: "3", label: "Business Credit Card" },
                  { value: "4", label: "Petty Cash" },
                ]}
                value={filterAccount}
                onChange={setFilterAccount}
                clearable
                style={{ minWidth: 150 }}
              />

              {(searchTerm ||
                filterType ||
                filterStatus ||
                filterAccount ||
                dateRange[0] ||
                dateRange[1]) && (
                <Button variant="light" onClick={clearFilters}>
                  Clear All
                </Button>
              )}
            </Flex>
          </Stack>
        </Paper>

        {/* Transactions Table */}
        <Paper shadow="xs" radius="md" withBorder>
          <Table verticalSpacing="md" horizontalSpacing="lg">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Account</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedTransactions.map((transaction) => (
                <Table.Tr key={transaction.id}>
                  <Table.Td>
                    <Text size="sm">{transaction.date.toLocaleDateString()}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Box>
                      <Text fw={500}>{transaction.description}</Text>
                      {transaction.reference && (
                        <Text size="xs" c="dimmed" ff="monospace">
                          {transaction.reference}
                        </Text>
                      )}
                      {transaction.tags && transaction.tags.length > 0 && (
                        <Group gap={4} mt={2}>
                          {transaction.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} size="xs" variant="dot">
                              {tag}
                            </Badge>
                          ))}
                          {transaction.tags.length > 2 && (
                            <Text size="xs" c="dimmed">
                              +{transaction.tags.length - 2} more
                            </Text>
                          )}
                        </Group>
                      )}
                    </Box>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <TransactionIcon type={transaction.type} />
                      <Text size="sm" tt="capitalize">
                        {transaction.type}
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{transaction.category}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{transaction.account}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Text fw={600}>{formatAmount(transaction.amount, transaction.type)}</Text>
                      {transaction.attachments && transaction.attachments > 0 && (
                        <Badge size="xs" variant="dot" color="blue">
                          {transaction.attachments} file{transaction.attachments > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <StatusBadge status={transaction.status} />
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon variant="subtle" color="blue">
                        <IconEye size={16} />
                      </ActionIcon>
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray">
                            <IconDots size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEdit style={{ width: rem(14), height: rem(14) }} />}>
                            Edit Transaction
                          </Menu.Item>
                          <Menu.Item
                            leftSection={
                              <IconDownload style={{ width: rem(14), height: rem(14) }} />
                            }>
                            Download Receipt
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            color="red"
                            leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
                            onClick={() => handleDeleteTransaction(transaction.id)}>
                            Delete Transaction
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {paginatedTransactions.length === 0 && (
            <Box p="xl" ta="center">
              <Text c="dimmed">No transactions found matching your criteria.</Text>
            </Box>
          )}
        </Paper>

        {/* Pagination */}
        {totalPages > 1 && (
          <Group justify="center">
            <Pagination
              value={currentPage}
              onChange={setCurrentPage}
              total={totalPages}
              size="sm"
            />
          </Group>
        )}
      </Stack>
    </motion.div>
  );
}
