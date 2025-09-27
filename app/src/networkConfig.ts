import { getFullnodeUrl } from "@mysten/sui/client";
import {
  DEVNET_FORUM_PACKAGE_ID,
  TESTNET_FORUM_PACKAGE_ID,
  DEVNET_FORUM_OBJECT_ID,
  TESTNET_FORUM_OBJECT_ID,
} from "./constants.ts";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        forumPackageId: TESTNET_FORUM_PACKAGE_ID,
        forumObjectId: TESTNET_FORUM_OBJECT_ID,
      },
    },
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        forumPackageId: DEVNET_FORUM_PACKAGE_ID,
        forumObjectId: DEVNET_FORUM_OBJECT_ID,
      },
    },
    // mainnet: {
    //   url: getFullnodeUrl("mainnet"),
    //   variables: {
    //     forumPackageId: MAINNET_FORUM_PACKAGE_ID,
    //   },
    // },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
