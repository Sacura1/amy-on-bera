'use client';

import { useReadContract } from 'thirdweb/react';
import { getContract } from 'thirdweb';
import { useActiveAccount } from 'thirdweb/react';
import { client } from '@/app/client';
import { berachain } from '@/lib/chain';
import { AMY_TOKEN_ADDRESS, MINIMUM_AMY_BALANCE, ERC20_ABI } from '@/lib/constants';

const amyContract = getContract({
  client,
  chain: berachain,
  address: AMY_TOKEN_ADDRESS,
});

export function useAmyBalance() {
  const account = useActiveAccount();

  const { data: balance, isLoading, error } = useReadContract({
    contract: amyContract,
    method: 'function balanceOf(address) view returns (uint256)',
    params: [account?.address || '0x0000000000000000000000000000000000000000'],
    queryOptions: {
      enabled: !!account?.address,
    },
  });

  const formattedBalance = balance ? Number(balance) / 1e18 : 0;
  const isEligible = formattedBalance >= MINIMUM_AMY_BALANCE;

  return {
    balance: formattedBalance,
    rawBalance: balance,
    isLoading,
    error,
    isEligible,
    minimumRequired: MINIMUM_AMY_BALANCE,
    walletAddress: account?.address,
    isConnected: !!account?.address,
  };
}
