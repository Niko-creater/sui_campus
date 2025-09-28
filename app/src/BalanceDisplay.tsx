import { Card, Flex, Heading, Text, Badge } from "@radix-ui/themes";
import { GasBalance } from "./GasBalance";
import { WalBalance } from "./WalBalance";

interface BalanceDisplayProps {
  currentAccount: string;
}

export function BalanceDisplay({ currentAccount }: BalanceDisplayProps) {
  return (
    <Card style={{ padding: '16px', margin: '8px 0' }}>
      <Flex direction="column" gap="3">
        <Heading size="4">Wallet Balances</Heading>
        <Flex direction="column" gap="2">
          <GasBalance currentAccount={currentAccount} />
          <WalBalance currentAccount={currentAccount} />
        </Flex>
        <Text size="1" color="gray" style={{ textAlign: 'center', fontStyle: 'italic' }}>
          Balances refresh automatically every 10 seconds
        </Text>
      </Flex>
    </Card>
  );
}
