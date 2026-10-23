export const accountTypes = ['CHECKING', 'SAVINGS', 'DIGITAL', 'CASH', 'INVESTMENT', 'OTHER'] as const;
export type AccountType = (typeof accountTypes)[number];

export const accountTypeLabels: Record<AccountType, string> = {
  CHECKING: 'Conta corrente',
  SAVINGS: 'Conta poupança',
  DIGITAL: 'Conta digital',
  CASH: 'Carteira de dinheiro',
  INVESTMENT: 'Conta de investimento',
  OTHER: 'Outra',
};

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  institution: string | null;
  openingBalance: number;
  openingDate: string; // AAAA-MM-DD
  archived: boolean;
  currentBalance: number;
  projectedBalance: number;
}

export interface AccountInput {
  name: string;
  type: AccountType;
  institution: string | null;
  openingBalance: number;
  openingDate: string;
}
