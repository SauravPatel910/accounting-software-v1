import {
  Paper,
  Stack,
  Group,
  Text,
  Button,
  Card,
  Table,
  NumberFormatter,
  Box,
  Badge,
  Select,
  Flex,
  ActionIcon,
} from "@mantine/core";
import {
  IconDownload,
  IconPrinter,
  IconShare,
  IconCalendar,
  IconTrendingUp,
  IconTrendingDown,
} from "@tabler/icons-react";
import { useState } from "react";
import { motion } from "motion/react";
import { DatePickerInput } from "@mantine/dates";

interface ProfitLossItem {
  id: string;
  name: string;
  category:
    | "revenue"
    | "cogs"
    | "gross_profit"
    | "operating_expenses"
    | "other_income"
    | "other_expenses"
    | "net_income";
  amount: number;
  percentage?: number;
  isSubtotal?: boolean;
  isTotal?: boolean;
  level: number; // For indentation
}

// Mock data for demonstration
const mockProfitLossData: ProfitLossItem[] = [
  // Revenue Section
  {
    id: "revenue_header",
    name: "REVENUE",
    category: "revenue",
    amount: 0,
    isSubtotal: true,
    level: 0,
  },
  { id: "sales_revenue", name: "Sales Revenue", category: "revenue", amount: 45680.0, level: 1 },
  {
    id: "consulting_revenue",
    name: "Consulting Revenue",
    category: "revenue",
    amount: 12500.0,
    level: 1,
  },
  { id: "other_revenue", name: "Other Revenue", category: "revenue", amount: 850.0, level: 1 },
  {
    id: "total_revenue",
    name: "Total Revenue",
    category: "revenue",
    amount: 59030.0,
    isSubtotal: true,
    level: 0,
  },

  // Cost of Goods Sold
  {
    id: "cogs_header",
    name: "COST OF GOODS SOLD",
    category: "cogs",
    amount: 0,
    isSubtotal: true,
    level: 0,
  },
  { id: "materials", name: "Materials & Supplies", category: "cogs", amount: 8950.0, level: 1 },
  { id: "direct_labor", name: "Direct Labor", category: "cogs", amount: 15200.0, level: 1 },
  {
    id: "total_cogs",
    name: "Total Cost of Goods Sold",
    category: "cogs",
    amount: 24150.0,
    isSubtotal: true,
    level: 0,
  },

  // Gross Profit
  {
    id: "gross_profit",
    name: "GROSS PROFIT",
    category: "gross_profit",
    amount: 34880.0,
    isTotal: true,
    level: 0,
  },

  // Operating Expenses
  {
    id: "operating_header",
    name: "OPERATING EXPENSES",
    category: "operating_expenses",
    amount: 0,
    isSubtotal: true,
    level: 0,
  },
  {
    id: "rent",
    name: "Rent & Utilities",
    category: "operating_expenses",
    amount: 4500.0,
    level: 1,
  },
  {
    id: "salaries",
    name: "Salaries & Benefits",
    category: "operating_expenses",
    amount: 18750.0,
    level: 1,
  },
  {
    id: "marketing",
    name: "Marketing & Advertising",
    category: "operating_expenses",
    amount: 2800.0,
    level: 1,
  },
  {
    id: "software",
    name: "Software & Subscriptions",
    category: "operating_expenses",
    amount: 890.0,
    level: 1,
  },
  {
    id: "office_supplies",
    name: "Office Supplies",
    category: "operating_expenses",
    amount: 560.0,
    level: 1,
  },
  { id: "insurance", name: "Insurance", category: "operating_expenses", amount: 1200.0, level: 1 },
  {
    id: "professional",
    name: "Professional Services",
    category: "operating_expenses",
    amount: 3500.0,
    level: 1,
  },
  {
    id: "total_operating",
    name: "Total Operating Expenses",
    category: "operating_expenses",
    amount: 32200.0,
    isSubtotal: true,
    level: 0,
  },

  // Other Income/Expenses
  {
    id: "other_income_header",
    name: "OTHER INCOME",
    category: "other_income",
    amount: 0,
    isSubtotal: true,
    level: 0,
  },
  {
    id: "interest_income",
    name: "Interest Income",
    category: "other_income",
    amount: 125.0,
    level: 1,
  },
  {
    id: "total_other_income",
    name: "Total Other Income",
    category: "other_income",
    amount: 125.0,
    isSubtotal: true,
    level: 0,
  },

  {
    id: "other_expenses_header",
    name: "OTHER EXPENSES",
    category: "other_expenses",
    amount: 0,
    isSubtotal: true,
    level: 0,
  },
  {
    id: "interest_expense",
    name: "Interest Expense",
    category: "other_expenses",
    amount: 75.0,
    level: 1,
  },
  {
    id: "total_other_expenses",
    name: "Total Other Expenses",
    category: "other_expenses",
    amount: 75.0,
    isSubtotal: true,
    level: 0,
  },

  // Net Income
  {
    id: "net_income",
    name: "NET INCOME",
    category: "net_income",
    amount: 2730.0,
    isTotal: true,
    level: 0,
  },
];

export function ProfitLoss() {
  const [data] = useState<ProfitLossItem[]>(mockProfitLossData);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    new Date(), // Today
  ]);
  const [comparisonPeriod, setComparisonPeriod] = useState<string | null>("previous-period");

  // Calculate percentages and comparison data
  const totalRevenue = data.find((item) => item.id === "total_revenue")?.amount || 0;
  const grossProfit = data.find((item) => item.id === "gross_profit")?.amount || 0;
  const netIncome = data.find((item) => item.id === "net_income")?.amount || 0;

  const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netProfitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

  const formatAmount = (amount: number, isNegative = false) => (
    <NumberFormatter
      value={Math.abs(amount)}
      prefix={isNegative ? "($" : "$"}
      suffix={isNegative ? ")" : ""}
      thousandSeparator
      decimalScale={2}
      style={{
        color: isNegative
          ? "var(--mantine-color-red-6)"
          : amount > 0
          ? "var(--mantine-color-green-6)"
          : "var(--mantine-color-gray-6)",
      }}
    />
  );

  const getRowStyle = (item: ProfitLossItem) => {
    if (item.isTotal) {
      return {
        backgroundColor: "var(--mantine-color-blue-0)",
        fontWeight: 700,
        fontSize: "1.1rem",
      };
    }
    if (item.isSubtotal) {
      return {
        backgroundColor: "var(--mantine-color-gray-0)",
        fontWeight: 600,
      };
    }
    return {};
  };

  const handleExport = (format: "pdf" | "excel" | "csv") => {
    console.log(`Exporting Profit & Loss as ${format}`);
    // Implementation would go here
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}>
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <Box>
            <Text size="xl" fw={700}>
              Profit & Loss Statement
            </Text>
            <Text size="sm" c="dimmed">
              {dateRange[0]?.toLocaleDateString()} - {dateRange[1]?.toLocaleDateString()}
            </Text>
          </Box>
          <Group>
            <Button variant="light" leftSection={<IconShare size={16} />}>
              Share
            </Button>
            <Button variant="light" leftSection={<IconPrinter size={16} />}>
              Print
            </Button>
            <Button leftSection={<IconDownload size={16} />}>Export</Button>
          </Group>
        </Group>

        {/* Summary Cards */}
        <Group grow>
          <Card shadow="xs" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <Box>
                <Text size="sm" c="dimmed" mb={4}>
                  Total Revenue
                </Text>
                <Text size="xl" fw={700} c="green">
                  <NumberFormatter
                    value={totalRevenue}
                    prefix="$"
                    thousandSeparator
                    decimalScale={2}
                  />
                </Text>
              </Box>
              <IconTrendingUp size={32} style={{ color: "var(--mantine-color-green-6)" }} />
            </Group>
          </Card>

          <Card shadow="xs" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <Box>
                <Text size="sm" c="dimmed" mb={4}>
                  Gross Profit
                </Text>
                <Text size="xl" fw={700} c="blue">
                  <NumberFormatter
                    value={grossProfit}
                    prefix="$"
                    thousandSeparator
                    decimalScale={2}
                  />
                </Text>
                <Text size="xs" c="dimmed">
                  {grossProfitMargin.toFixed(1)}% margin
                </Text>
              </Box>
              <Badge size="lg" variant="light" color="blue">
                {grossProfitMargin.toFixed(1)}%
              </Badge>
            </Group>
          </Card>

          <Card shadow="xs" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <Box>
                <Text size="sm" c="dimmed" mb={4}>
                  Net Income
                </Text>
                <Text size="xl" fw={700} c={netIncome >= 0 ? "green" : "red"}>
                  {formatAmount(netIncome, netIncome < 0)}
                </Text>
                <Text size="xs" c="dimmed">
                  {netProfitMargin.toFixed(1)}% margin
                </Text>
              </Box>
              {netIncome >= 0 ? (
                <IconTrendingUp size={32} style={{ color: "var(--mantine-color-green-6)" }} />
              ) : (
                <IconTrendingDown size={32} style={{ color: "var(--mantine-color-red-6)" }} />
              )}
            </Group>
          </Card>
        </Group>

        {/* Controls */}
        <Paper p="md" radius="md" withBorder>
          <Flex gap="md" align="end" wrap="wrap">
            <DatePickerInput
              type="range"
              label="Report Period"
              placeholder="Select date range"
              leftSection={<IconCalendar size={16} />}
              value={dateRange}
              onChange={(value) => setDateRange(value as [Date | null, Date | null])}
              style={{ minWidth: 250 }}
            />

            <Select
              label="Compare With"
              placeholder="Select comparison period"
              data={[
                { value: "previous-period", label: "Previous Period" },
                { value: "previous-year", label: "Previous Year" },
                { value: "budget", label: "Budget" },
                { value: "none", label: "No Comparison" },
              ]}
              value={comparisonPeriod}
              onChange={setComparisonPeriod}
              style={{ minWidth: 180 }}
            />

            <Group>
              <ActionIcon
                variant="light"
                size="lg"
                onClick={() => handleExport("pdf")}
                title="Export PDF">
                <IconDownload size={16} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                size="lg"
                onClick={() => handleExport("excel")}
                title="Export Excel">
                <IconDownload size={16} />
              </ActionIcon>
            </Group>
          </Flex>
        </Paper>

        {/* Profit & Loss Table */}
        <Paper shadow="xs" radius="md" withBorder>
          <Table verticalSpacing="xs" horizontalSpacing="lg">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Account</Table.Th>
                <Table.Th ta="right">Amount</Table.Th>
                <Table.Th ta="right">% of Revenue</Table.Th>
                {comparisonPeriod && comparisonPeriod !== "none" && (
                  <>
                    <Table.Th ta="right">Previous</Table.Th>
                    <Table.Th ta="right">Change</Table.Th>
                  </>
                )}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((item) => {
                const percentage =
                  totalRevenue > 0 ? (Math.abs(item.amount) / totalRevenue) * 100 : 0;
                const isNegativeExpense =
                  (item.category === "cogs" ||
                    item.category === "operating_expenses" ||
                    item.category === "other_expenses") &&
                  item.amount > 0;

                return (
                  <Table.Tr key={item.id} style={getRowStyle(item)}>
                    <Table.Td>
                      <Text
                        pl={item.level * 20}
                        fw={item.isSubtotal || item.isTotal ? 600 : 400}
                        size={item.isTotal ? "lg" : "sm"}>
                        {item.name}
                      </Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      {item.amount === 0 && (item.isSubtotal || item.name.includes("HEADER")) ? (
                        <Text size="sm" c="dimmed">
                          -
                        </Text>
                      ) : (
                        <Text fw={item.isSubtotal || item.isTotal ? 600 : 400}>
                          {formatAmount(item.amount, isNegativeExpense)}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td ta="right">
                      {item.amount === 0 && (item.isSubtotal || item.name.includes("HEADER")) ? (
                        <Text size="sm" c="dimmed">
                          -
                        </Text>
                      ) : (
                        <Text size="sm" c="dimmed">
                          {percentage.toFixed(1)}%
                        </Text>
                      )}
                    </Table.Td>
                    {comparisonPeriod && comparisonPeriod !== "none" && (
                      <>
                        <Table.Td ta="right">
                          <Text size="sm" c="dimmed">
                            ${(item.amount * 0.85).toLocaleString()}
                          </Text>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Badge
                            size="sm"
                            color={item.amount > item.amount * 0.85 ? "green" : "red"}
                            variant="light">
                            {item.amount > item.amount * 0.85 ? "+" : ""}
                            {(
                              ((item.amount - item.amount * 0.85) / (item.amount * 0.85)) *
                              100
                            ).toFixed(1)}
                            %
                          </Badge>
                        </Table.Td>
                      </>
                    )}
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Paper>

        {/* Footer Notes */}
        <Paper p="md" radius="md" withBorder bg="gray.0">
          <Stack gap="xs">
            <Text size="sm" fw={600}>
              Report Notes:
            </Text>
            <Text size="xs" c="dimmed">
              • This report shows your business performance for the selected period
            </Text>
            <Text size="xs" c="dimmed">
              • Revenue represents income from business operations
            </Text>
            <Text size="xs" c="dimmed">
              • Operating expenses are costs required to run your business
            </Text>
            <Text size="xs" c="dimmed">
              • Net income is your profit after all expenses
            </Text>
          </Stack>
        </Paper>
      </Stack>
    </motion.div>
  );
}
