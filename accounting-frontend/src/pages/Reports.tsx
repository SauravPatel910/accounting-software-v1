import { Box, Text, Card, SimpleGrid, Button, Group } from "@mantine/core";
import { IconReport, IconFileText, IconChartBar, IconTax } from "@tabler/icons-react";

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
            Coming Soon
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
            Coming Soon
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
    </Box>
  );
}
