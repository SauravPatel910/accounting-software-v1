import { Select, Box, Text, Paper, Stack, Group, Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { getCurrencyOptions, CURRENCIES } from "../../utils/currency";
import { useCurrency } from "../../hooks/useCurrency";

export function CurrencySettings() {
  const { currentCurrency, setCurrency } = useCurrency();

  const currencyOptions = getCurrencyOptions();
  const currentCurrencyData = CURRENCIES[currentCurrency];

  const handleCurrencyChange = (value: string | null) => {
    if (value && value !== currentCurrency) {
      setCurrency(value);
      notifications.show({
        title: "Currency Updated",
        message: `Currency has been changed to ${CURRENCIES[value].name}`,
        color: "green",
      });
    }
  };

  const resetToDefault = () => {
    setCurrency("INR");
    notifications.show({
      title: "Currency Reset",
      message: "Currency has been reset to Indian Rupee (INR)",
      color: "blue",
    });
  };

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <Box>
          <Text size="lg" fw={600} mb="xs">
            Currency Settings
          </Text>
          <Text size="sm" c="dimmed">
            Configure the default currency for your accounting system
          </Text>
        </Box>

        <Group align="flex-end">
          <Select
            label="Default Currency"
            description="This currency will be used throughout the application"
            placeholder="Select currency"
            data={currencyOptions}
            value={currentCurrency}
            onChange={handleCurrencyChange}
            searchable
            style={{ flex: 1 }}
          />
          <Button variant="light" onClick={resetToDefault}>
            Reset to INR
          </Button>
        </Group>

        {currentCurrencyData && (
          <Box>
            <Text size="sm" fw={500} mb="xs">
              Current Currency Preview:
            </Text>
            <Group gap="md">
              <Text size="sm">
                <strong>Symbol:</strong> {currentCurrencyData.symbol}
              </Text>
              <Text size="sm">
                <strong>Code:</strong> {currentCurrencyData.code}
              </Text>
              <Text size="sm">
                <strong>Example:</strong> {currentCurrencyData.symbol}1,234.56
              </Text>
            </Group>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
