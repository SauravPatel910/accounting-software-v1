// prettier-ignore
import { Paper, Stack, Group, Text, Button, Card, Table, NumberFormatter, Box, Badge, Flex, ActionIcon, Grid } from "@mantine/core";
// prettier-ignore
import { IconDownload, IconPrinter, IconShare, IconCalendar, IconTrendingUp, IconScale, IconCoins } from "@tabler/icons-react";
import { useState } from "react";
import { motion } from "motion/react";
import { DatePickerInput } from "@mantine/dates";

interface BalanceSheetItem {
  id: string;
  name: string;
  category:
    | "current_assets"
    | "fixed_assets"
    | "total_assets"
    | "current_liabilities"
    | "long_term_liabilities"
    | "total_liabilities"
    | "equity"
    | "total_equity"
    | "total_liabilities_equity";
  amount: number;
  isSubtotal?: boolean;
  isTotal?: boolean;
  level: number;
}

// Mock data for demonstration
const mockBalanceSheetData: BalanceSheetItem[] = [
  // ASSETS
  {
    id: "current_assets_header",
    name: "CURRENT ASSETS",
    category: "current_assets",
    amount: 0,
    isSubtotal: true,
    level: 0,
  },
  {
    id: "cash",
    name: "Cash and Cash Equivalents",
    category: "current_assets",
    amount: 25780.5,
    level: 1,
  },
  {
    id: "savings",
    name: "Savings Account",
    category: "current_assets",
    amount: 150000.0,
    level: 1,
  },
  {
    id: "accounts_receivable",
    name: "Accounts Receivable",
    category: "current_assets",
    amount: 18450.0,
    level: 1,
  },
  { id: "inventory", name: "Inventory", category: "current_assets", amount: 12800.0, level: 1 },
  {
    id: "prepaid_expenses",
    name: "Prepaid Expenses",
    category: "current_assets",
    amount: 3250.0,
    level: 1,
  },
  {
    id: "total_current_assets",
    name: "Total Current Assets",
    category: "current_assets",
    amount: 210280.5,
    isSubtotal: true,
    level: 0,
  },

  {
    id: "fixed_assets_header",
    name: "FIXED ASSETS",
    category: "fixed_assets",
    amount: 0,
    isSubtotal: true,
    level: 0,
  },
  { id: "equipment", name: "Equipment", category: "fixed_assets", amount: 45000.0, level: 1 },
  {
    id: "accumulated_depreciation",
    name: "Accumulated Depreciation",
    category: "fixed_assets",
    amount: -8500.0,
    level: 1,
  },
  {
    id: "furniture",
    name: "Furniture & Fixtures",
    category: "fixed_assets",
    amount: 15000.0,
    level: 1,
  },
  { id: "vehicles", name: "Vehicles", category: "fixed_assets", amount: 28000.0, level: 1 },
  {
    id: "total_fixed_assets",
    name: "Total Fixed Assets",
    category: "fixed_assets",
    amount: 79500.0,
    isSubtotal: true,
    level: 0,
  },

  {
    id: "total_assets",
    name: "TOTAL ASSETS",
    category: "total_assets",
    amount: 289780.5,
    isTotal: true,
    level: 0,
  },

  // LIABILITIES
  {
    id: "current_liabilities_header",
    name: "CURRENT LIABILITIES",
    category: "current_liabilities",
    amount: 0,
    isSubtotal: true,
    level: 0,
  },
  {
    id: "accounts_payable",
    name: "Accounts Payable",
    category: "current_liabilities",
    amount: 8450.0,
    level: 1,
  },
  {
    id: "credit_card",
    name: "Credit Card Payable",
    category: "current_liabilities",
    amount: 3450.75,
    level: 1,
  },
  {
    id: "accrued_expenses",
    name: "Accrued Expenses",
    category: "current_liabilities",
    amount: 5200.0,
    level: 1,
  },
  {
    id: "taxes_payable",
    name: "Taxes Payable",
    category: "current_liabilities",
    amount: 4850.0,
    level: 1,
  },
  {
    id: "total_current_liabilities",
    name: "Total Current Liabilities",
    category: "current_liabilities",
    amount: 21950.75,
    isSubtotal: true,
    level: 0,
  },

  {
    id: "long_term_liabilities_header",
    name: "LONG-TERM LIABILITIES",
    category: "long_term_liabilities",
    amount: 0,
    isSubtotal: true,
    level: 0,
  },
  {
    id: "loan_payable",
    name: "Long-term Loan",
    category: "long_term_liabilities",
    amount: 75000.0,
    level: 1,
  },
  {
    id: "equipment_loan",
    name: "Equipment Financing",
    category: "long_term_liabilities",
    amount: 32000.0,
    level: 1,
  },
  {
    id: "total_long_term_liabilities",
    name: "Total Long-term Liabilities",
    category: "long_term_liabilities",
    amount: 107000.0,
    isSubtotal: true,
    level: 0,
  },

  {
    id: "total_liabilities",
    name: "TOTAL LIABILITIES",
    category: "total_liabilities",
    amount: 128950.75,
    isTotal: true,
    level: 0,
  },

  // EQUITY
  {
    id: "equity_header",
    name: "OWNER'S EQUITY",
    category: "equity",
    amount: 0,
    isSubtotal: true,
    level: 0,
  },
  { id: "owner_equity", name: "Owner's Capital", category: "equity", amount: 150000.0, level: 1 },
  {
    id: "retained_earnings",
    name: "Retained Earnings",
    category: "equity",
    amount: 8099.75,
    level: 1,
  },
  {
    id: "current_earnings",
    name: "Current Year Earnings",
    category: "equity",
    amount: 2730.0,
    level: 1,
  },
  {
    id: "total_equity",
    name: "Total Owner's Equity",
    category: "equity",
    amount: 160829.75,
    isSubtotal: true,
    level: 0,
  },

  {
    id: "total_liabilities_equity",
    name: "TOTAL LIABILITIES & EQUITY",
    category: "total_liabilities_equity",
    amount: 289780.5,
    isTotal: true,
    level: 0,
  },
];

export function BalanceSheet() {
  const [data] = useState<BalanceSheetItem[]>(mockBalanceSheetData);
  const [asOfDate, setAsOfDate] = useState<Date | null>(new Date());
  const [comparisonDate, setComparisonDate] = useState<Date | null>(null);

  // Calculate key metrics
  const totalAssets = data.find((item) => item.id === "total_assets")?.amount || 0;
  const totalLiabilities = data.find((item) => item.id === "total_liabilities")?.amount || 0;
  const totalEquity = data.find((item) => item.id === "total_equity")?.amount || 0;
  const currentAssets = data.find((item) => item.id === "total_current_assets")?.amount || 0;
  const currentLiabilities =
    data.find((item) => item.id === "total_current_liabilities")?.amount || 0;

  const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
  const debtToEquityRatio = totalEquity > 0 ? totalLiabilities / totalEquity : 0;
  const equityRatio = totalAssets > 0 ? (totalEquity / totalAssets) * 100 : 0;

  // Check if balance sheet balances
  const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

  const formatAmount = (amount: number, isNegative = false) => (
    <NumberFormatter
      value={Math.abs(amount)}
      prefix={amount < 0 || isNegative ? "($" : "$"}
      suffix={amount < 0 || isNegative ? ")" : ""}
      thousandSeparator
      decimalScale={2}
      style={{
        color: amount < 0 ? "var(--mantine-color-red-6)" : "var(--mantine-color-gray-9)",
      }}
    />
  );

  const getRowStyle = (item: BalanceSheetItem) => {
    if (item.isTotal) {
      return {
        backgroundColor: "var(--mantine-color-blue-0)",
        fontWeight: 700,
        fontSize: "1.1rem",
        borderTop: "3px double var(--mantine-color-blue-6)",
      };
    }
    if (item.isSubtotal) {
      return {
        backgroundColor: "var(--mantine-color-gray-0)",
        fontWeight: 600,
        borderTop: "1px solid var(--mantine-color-gray-3)",
      };
    }
    return {};
  };

  const handleExport = (format: "pdf" | "excel" | "csv") => {
    console.log(`Exporting Balance Sheet as ${format}`);
    // Implementation would go here
  };

  // Split data into assets and liabilities/equity for side-by-side display
  const assetsData = data.filter(
    (item) =>
      item.category === "current_assets" ||
      item.category === "fixed_assets" ||
      item.category === "total_assets"
  );

  const liabilitiesEquityData = data.filter(
    (item) =>
      item.category === "current_liabilities" ||
      item.category === "long_term_liabilities" ||
      item.category === "total_liabilities" ||
      item.category === "equity" ||
      item.category === "total_equity" ||
      item.category === "total_liabilities_equity"
  );

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
              Balance Sheet
            </Text>
            <Text size="sm" c="dimmed">
              As of {asOfDate?.toLocaleDateString()}
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

        {/* Balance Check Alert */}
        {!isBalanced && (
          <Card bg="red.0" withBorder>
            <Group>
              <IconScale size={24} style={{ color: "var(--mantine-color-red-6)" }} />
              <Box>
                <Text fw={600} c="red">
                  Balance Sheet Out of Balance
                </Text>
                <Text size="sm" c="red.7">
                  Assets don't equal Liabilities + Equity. Please review your entries.
                </Text>
              </Box>
            </Group>
          </Card>
        )}

        {/* Summary Cards */}
        <Group grow>
          <Card shadow="xs" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <Box>
                <Text size="sm" c="dimmed" mb={4}>
                  Total Assets
                </Text>
                <Text size="xl" fw={700} c="blue">
                  <NumberFormatter
                    value={totalAssets}
                    prefix="$"
                    thousandSeparator
                    decimalScale={2}
                  />
                </Text>
              </Box>
              <IconCoins size={32} style={{ color: "var(--mantine-color-blue-6)" }} />
            </Group>
          </Card>

          <Card shadow="xs" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <Box>
                <Text size="sm" c="dimmed" mb={4}>
                  Current Ratio
                </Text>
                <Text
                  size="xl"
                  fw={700}
                  c={currentRatio >= 2 ? "green" : currentRatio >= 1 ? "orange" : "red"}>
                  {currentRatio.toFixed(2)}
                </Text>
                <Text size="xs" c="dimmed">
                  Current Assets ÷ Current Liabilities
                </Text>
              </Box>
              <Badge
                size="lg"
                variant="light"
                color={currentRatio >= 2 ? "green" : currentRatio >= 1 ? "orange" : "red"}>
                {currentRatio >= 2 ? "Good" : currentRatio >= 1 ? "Fair" : "Poor"}
              </Badge>
            </Group>
          </Card>

          <Card shadow="xs" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
              <Box>
                <Text size="sm" c="dimmed" mb={4}>
                  Equity Ratio
                </Text>
                <Text size="xl" fw={700} c="green">
                  {equityRatio.toFixed(1)}%
                </Text>
                <Text size="xs" c="dimmed">
                  Equity ÷ Total Assets
                </Text>
              </Box>
              <IconTrendingUp size={32} style={{ color: "var(--mantine-color-green-6)" }} />
            </Group>
          </Card>
        </Group>

        {/* Controls */}
        <Paper p="md" radius="md" withBorder>
          <Flex gap="md" align="end" wrap="wrap">
            <DatePickerInput
              label="As of Date"
              placeholder="Select date"
              leftSection={<IconCalendar size={16} />}
              value={asOfDate}
              onChange={(value) => setAsOfDate(value as Date | null)}
              style={{ minWidth: 200 }}
            />

            <DatePickerInput
              label="Compare With"
              placeholder="Select comparison date"
              leftSection={<IconCalendar size={16} />}
              value={comparisonDate}
              onChange={(value) => setComparisonDate(value as Date | null)}
              clearable
              style={{ minWidth: 200 }}
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

        {/* Balance Sheet Table */}
        <Grid>
          <Grid.Col span={6}>
            <Paper shadow="xs" radius="md" withBorder>
              <Box p="md" bg="blue.0">
                <Text fw={700} size="lg" ta="center">
                  ASSETS
                </Text>
              </Box>
              <Table verticalSpacing="xs" horizontalSpacing="lg">
                <Table.Tbody>
                  {assetsData.map((item) => (
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
                            {formatAmount(item.amount)}
                          </Text>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Grid.Col>

          <Grid.Col span={6}>
            <Paper shadow="xs" radius="md" withBorder>
              <Box p="md" bg="red.0">
                <Text fw={700} size="lg" ta="center">
                  LIABILITIES & EQUITY
                </Text>
              </Box>
              <Table verticalSpacing="xs" horizontalSpacing="lg">
                <Table.Tbody>
                  {liabilitiesEquityData.map((item) => (
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
                            {formatAmount(item.amount)}
                          </Text>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Key Ratios */}
        <Paper p="md" radius="md" withBorder bg="gray.0">
          <Stack gap="md">
            <Text size="lg" fw={600}>
              Key Financial Ratios
            </Text>
            <Group grow>
              <Box>
                <Text size="sm" c="dimmed">
                  Current Ratio
                </Text>
                <Text fw={600}>{currentRatio.toFixed(2)}</Text>
                <Text size="xs" c="dimmed">
                  Good: ≥ 2.0
                </Text>
              </Box>
              <Box>
                <Text size="sm" c="dimmed">
                  Debt-to-Equity
                </Text>
                <Text fw={600}>{debtToEquityRatio.toFixed(2)}</Text>
                <Text size="xs" c="dimmed">
                  Good: ≤ 1.0
                </Text>
              </Box>
              <Box>
                <Text size="sm" c="dimmed">
                  Equity Ratio
                </Text>
                <Text fw={600}>{equityRatio.toFixed(1)}%</Text>
                <Text size="xs" c="dimmed">
                  Good: ≥ 50%
                </Text>
              </Box>
              <Box>
                <Text size="sm" c="dimmed">
                  Working Capital
                </Text>
                <Text fw={600}>
                  <NumberFormatter
                    value={currentAssets - currentLiabilities}
                    prefix="$"
                    thousandSeparator
                    decimalScale={2}
                  />
                </Text>
                <Text size="xs" c="dimmed">
                  Current Assets - Current Liabilities
                </Text>
              </Box>
            </Group>
          </Stack>
        </Paper>

        {/* Footer Notes */}
        <Paper p="md" radius="md" withBorder bg="gray.0">
          <Stack gap="xs">
            <Text size="sm" fw={600}>
              Report Notes:
            </Text>
            <Text size="xs" c="dimmed">
              • This balance sheet shows your business's financial position as of the selected date
            </Text>
            <Text size="xs" c="dimmed">
              • Assets must equal Liabilities + Equity (the accounting equation)
            </Text>
            <Text size="xs" c="dimmed">
              • Current assets are expected to be converted to cash within one year
            </Text>
            <Text size="xs" c="dimmed">
              • Current liabilities are due within one year
            </Text>
            {isBalanced && (
              <Text size="xs" c="green">
                ✓ Balance sheet is balanced: Assets = Liabilities + Equity
              </Text>
            )}
          </Stack>
        </Paper>
      </Stack>
    </motion.div>
  );
}
