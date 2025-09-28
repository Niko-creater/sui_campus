import { useSuiClientQuery } from "@mysten/dapp-kit";
import { Card, Flex, Heading, Text, Badge } from "@radix-ui/themes";
import ClipLoader from "react-spinners/ClipLoader";
import { useState, useEffect } from "react";

interface WalBalanceProps {
  currentAccount: string;
}

export function WalBalance({ currentAccount }: WalBalanceProps) {
  const [walBalance, setWalBalance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Try to get WAL balance using a more flexible approach
  const { data: allBalances } = useSuiClientQuery(
    "getAllBalances",
    {
      owner: currentAccount,
    },
    {
      enabled: !!currentAccount,
      refetchInterval: 10000,
    }
  );

  useEffect(() => {
    if (!allBalances || !currentAccount) {
      setIsLoading(false);
      return;
    }

    // Look for WAL-related coin types in all balances
    const walBalance = allBalances.find(balance => 
      balance.coinType.includes('wal') || 
      balance.coinType.includes('WAL') ||
      balance.coinType.includes('Walrus')
    );

    if (walBalance) {
      setWalBalance(walBalance);
    } else {
      // No WAL balance found, show placeholder
      setWalBalance({
        totalBalance: "0",
        coinObjects: [],
        coinType: "WAL (Not Available)"
      });
    }
    
    setIsLoading(false);
  }, [allBalances, currentAccount]);

  if (isLoading) {
    return (
      <Card style={{ padding: '12px', margin: '8px 0' }}>
        <Flex align="center" gap="2">
          <ClipLoader size={16} />
          <Text>Loading WAL balance...</Text>
        </Flex>
      </Card>
    );
  }


  if (!walBalance) {
    return (
      <Card style={{ padding: '12px', margin: '8px 0' }}>
        <Text color="gray">No WAL balance found</Text>
      </Card>
    );
  }

  // Convert from smallest unit to WAL (assuming 1 WAL = 1,000,000,000 smallest units, similar to SUI)
  const walAmount = Number(walBalance.totalBalance) / 1_000_000_000;
  const formattedBalance = walAmount.toFixed(4);
  const isWalAvailable = walBalance.coinType !== "WAL (Not Available)";

  return (
    <Card style={{ padding: '12px', minWidth: '200px', flex: '1' }}>
      <Flex direction="column" gap="2">
        <Flex align="center" gap="2">
          <Heading size="3">WAL Balance</Heading>
          <Badge color={isWalAvailable ? "purple" : "gray"}>WAL</Badge>
        </Flex>
        <Flex align="center" gap="2">
          <Text size="4" weight="bold">{formattedBalance}</Text>
          <Text size="2" color="gray">WAL</Text>
        </Flex>
        {!isWalAvailable && (
          <Text size="1" color="orange" style={{ fontStyle: 'italic' }}>
            WAL coin not available
          </Text>
        )}
      </Flex>
    </Card>
  );
}
