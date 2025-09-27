import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Button, Dialog, Flex, Text, TextField, Heading, Switch } from "@radix-ui/themes";
import { useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { useNetworkVariable } from "./networkConfig";

interface TipPostProps {
  postId: string;
  postTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TipPost({ postId, postTitle, isOpen, onClose, onSuccess }: TipPostProps) {
  const forumPackageId = useNetworkVariable("forumPackageId");
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [amount, setAmount] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [waitingForTxn, setWaitingForTxn] = useState("");

  const handleTip = () => {
    if (!amount.trim()) {
      alert("Please enter tip amount");
      return;
    }

    const tipAmountMist = parseFloat(amount) * 1_000_000_000; // Convert SUI to MIST
    if (tipAmountMist <= 0) {
      alert("Tip amount must be greater than 0");
      return;
    }

    setWaitingForTxn("tip");

    const tx = new Transaction();
    
    // Split coins for the tip amount
    const coin = tx.splitCoins(tx.gas, [tx.pure.u64(tipAmountMist)]);
    
    // Call tip_post function
    tx.moveCall({
      arguments: [
        tx.object(postId), // Post object
        coin, // Coin<SUI>
        tx.pure.bool(isAnonymous), // is_anonymous
        tx.object("0x6") // Clock object
      ],
      target: `${forumPackageId}::forum::tip_post`,
    });

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (txResult) => {
          suiClient.waitForTransaction({ digest: txResult.digest }).then(() => {
            setWaitingForTxn("");
            setAmount("");
            setIsAnonymous(false);
            onSuccess();
            onClose();
          });
        },
        onError: (error) => {
          console.error("Error tipping post:", error);
          setWaitingForTxn("");
          alert(`Failed to tip post: ${error.message}`);
        },
      },
    );
  };

  const handleClose = () => {
    if (waitingForTxn === "") {
      setAmount("");
      setIsAnonymous(false);
      onClose();
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Content style={{ maxWidth: 400 }}>
        <Dialog.Title>Tip Post</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Send a tip to support this post: "{postTitle}"
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <label>
            <Text size="2" weight="bold">Tip Amount (SUI)</Text>
            <TextField.Root
              placeholder="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              step="0.001"
              min="0"
            />
            <Text size="1" color="gray">
              Minimum: 0.001 SUI
            </Text>
          </label>

          <label>
            <Flex align="center" gap="2">
              <Switch
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
              <Text size="2">Send anonymously</Text>
            </Flex>
          </label>

          {amount && parseFloat(amount) > 0 && (
            <Text size="1" color="gray">
              You will send: {amount} SUI ({parseFloat(amount) * 1_000_000_000} MIST)
            </Text>
          )}
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Button
            variant="soft"
            onClick={handleClose}
            disabled={waitingForTxn !== ""}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTip}
            disabled={waitingForTxn !== "" || !amount.trim() || parseFloat(amount) <= 0}
          >
            {waitingForTxn === "tip" ? <ClipLoader size={16} /> : "Send Tip"}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
