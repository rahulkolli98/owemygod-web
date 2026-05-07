export type SplitType = "equal" | "custom" | "percentage" | "shares";

type SplitValues = Record<string, string>;

export interface SplitSummaryParticipantValue {
  participantId: string;
  inputValue: number;
  computedAmount?: number;
}

export interface SplitSummary {
  total: number;
  remaining: number;
  shareValue?: number;
  participantValues: SplitSummaryParticipantValue[];
}

function toRounded(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function parseNumericValue(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export function getSplitSummary(params: {
  splitType: SplitType;
  participants: string[];
  amount: number;
  splitValues: SplitValues;
}): SplitSummary | null {
  const { splitType, participants, amount, splitValues } = params;

  if (splitType === "equal") {
    return null;
  }

  const participantValues = participants.map((participantId) => {
    const value = parseNumericValue(splitValues[participantId]) ?? 0;
    return {
      participantId,
      inputValue: value,
    };
  });

  if (splitType === "custom") {
    const total = participantValues.reduce((sum, row) => sum + row.inputValue, 0);
    return {
      total: toRounded(total),
      remaining: toRounded(amount - total),
      participantValues,
    };
  }

  if (splitType === "percentage") {
    const total = participantValues.reduce((sum, row) => sum + row.inputValue, 0);
    return {
      total: toRounded(total),
      remaining: toRounded(100 - total),
      participantValues: participantValues.map((row) => ({
        ...row,
        computedAmount: toRounded((amount * row.inputValue) / 100),
      })),
    };
  }

  const totalShares = participantValues.reduce((sum, row) => sum + row.inputValue, 0);
  const shareValue = totalShares > 0 ? amount / totalShares : 0;

  return {
    total: toRounded(totalShares),
    remaining: 0,
    shareValue: toRounded(shareValue),
    participantValues: participantValues.map((row) => ({
      ...row,
      computedAmount: toRounded(row.inputValue * shareValue),
    })),
  };
}

function createEqualAmountDefaults(participants: string[], amount: number): SplitValues {
  if (participants.length === 0) return {};

  const amountInCents = Math.round(amount * 100);
  const baseInCents = Math.floor(amountInCents / participants.length);
  const remainderInCents = amountInCents % participants.length;

  return participants.reduce<SplitValues>((acc, participantId, index) => {
    const cents = baseInCents + (index < remainderInCents ? 1 : 0);
    acc[participantId] = (cents / 100).toFixed(2);
    return acc;
  }, {});
}

function createEqualPercentageDefaults(participants: string[]): SplitValues {
  if (participants.length === 0) return {};

  const baseBasisPoints = Math.floor(10000 / participants.length);
  let remainderBasisPoints = 10000 - baseBasisPoints * participants.length;

  return participants.reduce<SplitValues>((acc, participantId) => {
    const basisPoints = baseBasisPoints + (remainderBasisPoints > 0 ? 1 : 0);
    if (remainderBasisPoints > 0) {
      remainderBasisPoints -= 1;
    }
    acc[participantId] = (basisPoints / 100).toFixed(2);
    return acc;
  }, {});
}

export function createSplitDefaults(
  splitType: SplitType,
  participants: string[],
  amount: number
): SplitValues {
  if (splitType === "equal") return {};
  if (splitType === "custom") return createEqualAmountDefaults(participants, amount);
  if (splitType === "percentage") return createEqualPercentageDefaults(participants);

  return participants.reduce<SplitValues>((acc, participantId) => {
    acc[participantId] = "1";
    return acc;
  }, {});
}

export function createSplitDefaultsFromExpense(
  splitType: SplitType,
  participants: string[],
  amount: number,
  owedByUser: Record<string, number>
): SplitValues {
  if (splitType === "equal") return {};

  if (splitType === "custom") {
    return participants.reduce<SplitValues>((acc, participantId) => {
      acc[participantId] = toRounded(owedByUser[participantId] ?? 0).toFixed(2);
      return acc;
    }, {});
  }

  if (splitType === "percentage") {
    if (amount <= 0) return createEqualPercentageDefaults(participants);

    const rawPercentages = participants.map((participantId) => {
      const owed = owedByUser[participantId] ?? 0;
      return { participantId, basisPoints: Math.round((owed / amount) * 10000) };
    });

    const basisPointTotal = rawPercentages.reduce((sum, row) => sum + row.basisPoints, 0);
    const diff = 10000 - basisPointTotal;
    if (rawPercentages.length > 0 && diff !== 0) {
      rawPercentages[0].basisPoints += diff;
    }

    return rawPercentages.reduce<SplitValues>((acc, row) => {
      acc[row.participantId] = (row.basisPoints / 100).toFixed(2);
      return acc;
    }, {});
  }

  return participants.reduce<SplitValues>((acc, participantId) => {
    const owed = owedByUser[participantId] ?? 0;
    acc[participantId] = owed > 0 ? toRounded(owed).toString() : "1";
    return acc;
  }, {});
}

export function normalizeSplitValues(
  splitValues: SplitValues,
  participants: string[],
  splitType: SplitType
): SplitValues {
  if (splitType === "equal") return {};

  const nextValues: SplitValues = {};
  for (const participantId of participants) {
    const existing = splitValues[participantId];
    if (existing !== undefined) {
      nextValues[participantId] = existing;
      continue;
    }

    if (splitType === "shares") {
      nextValues[participantId] = "1";
    } else {
      nextValues[participantId] = "0";
    }
  }

  return nextValues;
}

export function buildSplitsPayload(params: {
  splitType: SplitType;
  participants: string[];
  amount: number;
  splitValues: SplitValues;
}): { splits?: Record<string, number>; error?: string } {
  const { splitType, participants, amount, splitValues } = params;

  if (splitType === "equal") {
    return {};
  }

  const parsedEntries = participants.map((participantId) => {
    const parsed = parseNumericValue(splitValues[participantId]);
    return { participantId, value: parsed };
  });

  if (parsedEntries.some((entry) => entry.value === null)) {
    return { error: "Enter a valid value for each selected participant." };
  }

  const values = parsedEntries as Array<{ participantId: string; value: number }>;

  if (values.some((entry) => entry.value < 0)) {
    return { error: "Split values cannot be negative." };
  }

  if (splitType === "custom") {
    const total = values.reduce((sum, entry) => sum + entry.value, 0);
    if (Math.abs(total - amount) > 0.01) {
      return {
        error: `Custom split total must equal ${amount.toFixed(2)}. Current total is ${total.toFixed(2)}.`,
      };
    }
  }

  if (splitType === "percentage") {
    if (values.some((entry) => entry.value > 100)) {
      return { error: "Percentage values cannot exceed 100." };
    }

    const total = values.reduce((sum, entry) => sum + entry.value, 0);
    if (Math.abs(total - 100) > 0.01) {
      return { error: `Percentage splits must total 100. Current total is ${total.toFixed(2)}.` };
    }
  }

  if (splitType === "shares") {
    const total = values.reduce((sum, entry) => sum + entry.value, 0);
    if (total <= 0) {
      return { error: "Total shares must be greater than 0." };
    }
  }

  return {
    splits: values.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.participantId] = toRounded(entry.value);
      return acc;
    }, {}),
  };
}
