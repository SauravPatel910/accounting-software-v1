import { Text } from "@mantine/core";
import { useCurrency } from "../../hooks/useCurrency";

interface CurrencyDisplayProps {
  amount: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  weight?: number;
  color?: string;
  showCode?: boolean;
  prefix?: string;
  suffix?: string;
}

export function CurrencyDisplay({
  amount,
  size = "md",
  weight,
  color,
  showCode = false,
  prefix,
  suffix,
}: CurrencyDisplayProps) {
  const { formatAmount } = useCurrency();

  const formattedAmount = formatAmount(amount, { showCode });
  const displayText = `${prefix || ""}${formattedAmount}${suffix || ""}`;

  return (
    <Text size={size} fw={weight} c={color}>
      {displayText}
    </Text>
  );
}
