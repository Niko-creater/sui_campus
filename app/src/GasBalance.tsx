import { useSuiClientQuery } from "@mysten/dapp-kit";
import { Card, Flex, Heading, Text, Badge } from "@radix-ui/themes";
import ClipLoader from "react-spinners/ClipLoader";

interface GasBalanceProps {
  currentAccount: string;
}

export function GasBalance({ currentAccount }: GasBalanceProps) {
  // Query user's SUI coin balance
  const { data: balance, isLoading, error } = useSuiClientQuery(
    "getBalance",
    {
      owner: currentAccount,
      coinType: "0x2::sui::SUI",
    },
    {
      enabled: !!currentAccount,
      refetchInterval: 10000, // Refresh every 10 seconds
    }
  );

  if (isLoading) {
    return (
      <Card style={{ padding: '12px', margin: '8px 0' }}>
        <Flex align="center" gap="2">
          <ClipLoader size={16} />
          <Text>Loading gas balance...</Text>
        </Flex>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={{ padding: '12px', margin: '8px 0' }}>
        <Text color="red">Failed to load gas balance</Text>
      </Card>
    );
  }

  if (!balance) {
    return (
      <Card style={{ padding: '12px', margin: '8px 0' }}>
        <Text color="gray">No gas balance found</Text>
      </Card>
    );
  }

  // Convert from MIST to SUI (1 SUI = 1,000,000,000 MIST)
  const suiBalance = Number(balance.totalBalance) / 1_000_000_000;
  const formattedBalance = suiBalance.toFixed(4);

  return (
    <Card style={{ padding: '12px', minWidth: '200px', flex: '1' }}>
      <Flex direction="column" gap="2">
        <Flex align="center" gap="2">
          <Heading size="3">Gas Balance</Heading>
          <Badge color="blue">SUI</Badge>
        </Flex>
        <Flex align="center" gap="2">
          <Text size="4" weight="bold">{formattedBalance}</Text>
          <Text size="2" color="gray">SUI</Text>
        </Flex>
      </Flex>
    </Card>
  );
}
