import { Box, Text, Card, SimpleGrid, Button, Group, Tabs } from "@mantine/core";
// prettier-ignore
import { IconReport, IconFileText, IconChartBar, IconTax, IconTrendingUp, IconScale } from "@tabler/icons-react";
import { ProfitLoss, BalanceSheet } from "../components/reports";

export function Reports() {
  return (
    <Box>
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700}>
            Reports
          </Text>
          <Text size="sm" c="dimmed">
            Generate financial reports and business insights
          </Text>
        </Box>
        <Button leftSection={<IconReport size={16} />}>Custom Report</Button>
      </Group>

      <Tabs defaultValue="overview">
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconReport size={16} />}>
            Overview
          </Tabs.Tab>
          <Tabs.Tab value="profit-loss" leftSection={<IconTrendingUp size={16} />}>
            Profit & Loss
          </Tabs.Tab>
          <Tabs.Tab value="balance-sheet" leftSection={<IconScale size={16} />}>
            Balance Sheet
          </Tabs.Tab>
          <Tabs.Tab value="cash-flow" leftSection={<IconChartBar size={16} />}>
            Cash Flow
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="xl">
          <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="lg">
            <Card shadow="xs" padding="lg" radius="md" withBorder>
              <Group gap="sm" mb="md">
                <IconChartBar size={20} color="var(--mantine-color-blue-6)" />
                <Text size="lg" fw={600}>
                  Profit & Loss
                </Text>
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Revenue and expense summary for any period
              </Text>
              <Button variant="light" fullWidth>
                View Report
              </Button>
            </Card>

            <Card shadow="xs" padding="lg" radius="md" withBorder>
              <Group gap="sm" mb="md">
                <IconFileText size={20} color="var(--mantine-color-green-6)" />
                <Text size="lg" fw={600}>
                  Balance Sheet
                </Text>
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Assets, liabilities, and equity overview
              </Text>
              <Button variant="light" fullWidth>
                View Report
              </Button>
            </Card>

            <Card shadow="xs" padding="lg" radius="md" withBorder>
              <Group gap="sm" mb="md">
                <IconReport size={20} color="var(--mantine-color-orange-6)" />
                <Text size="lg" fw={600}>
                  Cash Flow
                </Text>
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Track money in and out of your business
              </Text>
              <Button variant="light" fullWidth>
                Coming Soon
              </Button>
            </Card>

            <Card shadow="xs" padding="lg" radius="md" withBorder>
              <Group gap="sm" mb="md">
                <IconTax size={20} color="var(--mantine-color-grape-6)" />
                <Text size="lg" fw={600}>
                  Tax Reports
                </Text>
              </Group>
              <Text size="sm" c="dimmed" mb="md">
                Generate reports for tax compliance
              </Text>
              <Button variant="light" fullWidth>
                Coming Soon
              </Button>
            </Card>
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="profit-loss" pt="xl">
          <ProfitLoss />
        </Tabs.Panel>

        <Tabs.Panel value="balance-sheet" pt="xl">
          <BalanceSheet />
        </Tabs.Panel>

        <Tabs.Panel value="cash-flow" pt="xl">
          <Box ta="center" py="xl">
            <IconChartBar size={48} style={{ color: "var(--mantine-color-gray-5)" }} />
            <Text size="lg" fw={600} mt="md" c="dimmed">
              Cash Flow Report
            </Text>
            <Text size="sm" c="dimmed" mb="lg">
              This feature is coming soon. Track cash inflows and outflows over time.
            </Text>
            <Button variant="light">Coming Soon</Button>
          </Box>
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}
