// prettier-ignore
import { Box, Grid, Card, Text, Group, Stack, Badge, ActionIcon, Progress, SimpleGrid } from "@mantine/core";
// prettier-ignore
import { IconTrendingUp, IconFileInvoice, IconUsers, IconCreditCard, IconArrowUpRight, IconArrowDownRight, IconDots } from "@tabler/icons-react";
import { useCurrency } from "../hooks/useCurrency";

export function Dashboard() {
  const { formatAmount } = useCurrency();

  // Mock data - replace with real data from API
  const dashboardData = {
    metrics: [
      {
        title: "Total Revenue",
        value: 1042500,
        change: "+12.5%",
        trend: "up" as const,
        period: "vs last month",
        icon: IconTrendingUp,
        color: "green",
      },
      {
        title: "Outstanding Invoices",
        value: 351500,
        change: "-8.2%",
        trend: "down" as const,
        period: "vs last month",
        icon: IconFileInvoice,
        color: "blue",
      },
      {
        title: "Active Customers",
        value: 284,
        change: "+5.1%",
        trend: "up" as const,
        period: "vs last month",
        icon: IconUsers,
        color: "grape",
        isCount: true,
      },
      {
        title: "Monthly Expenses",
        value: 156250,
        change: "+2.3%",
        trend: "up" as const,
        period: "vs last month",
        icon: IconCreditCard,
        color: "orange",
      },
    ],
    recentInvoices: [
      {
        id: "INV-001",
        customer: "Acme Corp",
        amount: 208300,
        status: "paid",
        date: "2025-01-15",
      },
      {
        id: "INV-002",
        customer: "TechStart Inc",
        amount: 99800,
        status: "pending",
        date: "2025-01-14",
      },
      {
        id: "INV-003",
        customer: "Global Ltd",
        amount: 316500,
        status: "overdue",
        date: "2025-01-10",
      },
      {
        id: "INV-004",
        customer: "StartupXYZ",
        amount: 79100,
        status: "paid",
        date: "2025-01-12",
      },
    ],
    cashFlow: {
      inflow: 85000,
      outflow: 65000,
      net: 20000,
    },
  };

  interface MetricCardProps {
    title: string;
    value: number;
    change: string;
    trend: "up" | "down";
    period: string;
    icon: React.ComponentType<{ size?: number; color?: string }>;
    color: string;
    isCount?: boolean;
  }

  function MetricCard({
    title,
    value,
    change,
    trend,
    period,
    icon: Icon,
    color,
    isCount = false,
  }: MetricCardProps) {
    const isPositive = trend === "up";

    return (
      <Card shadow="xs" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Box style={{ flex: 1 }}>
            <Text size="sm" c="dimmed" fw={500}>
              {title}
            </Text>
            <Text size="xl" fw={700} mt={4}>
              {isCount ? value.toLocaleString() : formatAmount(value)}
            </Text>
          </Box>
          <Box
            style={{
              backgroundColor: `var(--mantine-color-${color}-1)`,
              borderRadius: "8px",
              padding: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <Icon size={20} color={`var(--mantine-color-${color}-6)`} />
          </Box>
        </Group>

        <Group gap="xs">
          {isPositive ? (
            <IconArrowUpRight size={16} color="var(--mantine-color-green-6)" />
          ) : (
            <IconArrowDownRight size={16} color="var(--mantine-color-red-6)" />
          )}
          <Text size="sm" c={isPositive ? "green" : "red"} fw={500}>
            {change}
          </Text>
          <Text size="sm" c="dimmed">
            {period}
          </Text>
        </Group>
      </Card>
    );
  }
  return (
    <Box>
      {/* Page Header */}
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700}>
            Dashboard
          </Text>
          <Text size="sm" c="dimmed">
            Welcome back! Here's what's happening with your business.
          </Text>
        </Box>
      </Group>

      {/* Metrics Grid */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb="xl">
        {dashboardData.metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </SimpleGrid>

      <Grid gutter="lg">
        {/* Recent Invoices */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="xs" padding="lg" radius="md" withBorder h="100%">
            <Group justify="space-between" mb="md">
              <Text size="lg" fw={600}>
                Recent Invoices
              </Text>
              <ActionIcon variant="subtle">
                <IconDots size={16} />
              </ActionIcon>
            </Group>

            <Stack gap="md">
              {dashboardData.recentInvoices.map((invoice) => (
                <Group
                  key={invoice.id}
                  justify="space-between"
                  p="sm"
                  style={{ backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                  <Box>
                    <Text size="sm" fw={500}>
                      {invoice.id}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {invoice.customer}
                    </Text>
                  </Box>
                  <Group gap="md">
                    <Text size="sm" fw={500}>
                      {formatAmount(invoice.amount)}
                    </Text>
                    <Badge
                      color={
                        invoice.status === "paid"
                          ? "green"
                          : invoice.status === "pending"
                          ? "yellow"
                          : "red"
                      }
                      variant="light"
                      size="sm">
                      {invoice.status}
                    </Badge>
                  </Group>
                </Group>
              ))}
            </Stack>
          </Card>
        </Grid.Col>

        {/* Cash Flow */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="xs" padding="lg" radius="md" withBorder h="100%">
            <Group justify="space-between" mb="md">
              <Text size="lg" fw={600}>
                Cash Flow
              </Text>
              <ActionIcon variant="subtle">
                <IconDots size={16} />
              </ActionIcon>
            </Group>

            <Stack gap="lg">
              <Box>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed">
                    Money In
                  </Text>
                  <Text size="sm" fw={500}>
                    {formatAmount(dashboardData.cashFlow.inflow)}
                  </Text>
                </Group>
                <Progress value={dashboardData.cashFlow.inflow / 1000} color="green" size="sm" />
              </Box>

              <Box>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed">
                    Money Out
                  </Text>
                  <Text size="sm" fw={500}>
                    {formatAmount(dashboardData.cashFlow.outflow)}
                  </Text>
                </Group>
                <Progress value={dashboardData.cashFlow.outflow / 1000} color="red" size="sm" />
              </Box>

              <Box>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed">
                    Net Cash Flow
                  </Text>
                  <Text size="sm" fw={500} c="green">
                    +{formatAmount(dashboardData.cashFlow.net)}
                  </Text>
                </Group>
                <Progress value={dashboardData.cashFlow.net / 1000} color="blue" size="sm" />
              </Box>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
