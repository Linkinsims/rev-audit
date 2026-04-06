import { ContractRule, RuleType, IssueType } from "@prisma/client";

interface TieredCondition {
  field: string;
  thresholds: number[];
}

interface TieredValue {
  rates: number[];
}

interface FlatValue {
  rate: number;
}

interface MinimumCondition {
  field: string;
  value: string;
}

interface MinimumValue {
  minimum: number;
}

interface TimeBasedCondition {
  startDate: string;
  endDate: string;
}

interface DiscountValue {
  discountPercent: number;
}

export interface RuleCalculationResult {
  ruleId: string;
  ruleName: string;
  ruleType: RuleType;
  applied: boolean;
  expectedAmount: number;
  details: Record<string, unknown>;
}

export function calculateExpectedAmount(
  rules: ContractRule[],
  units: number | null,
  billingDate: Date,
  existingAmount: number
): { expectedAmount: number; calculations: RuleCalculationResult[] } {
  const activeRules = rules
    .filter((rule) => rule.isActive)
    .filter((rule) => {
      if (rule.startDate && billingDate < rule.startDate) return false;
      if (rule.endDate && billingDate > rule.endDate) return false;
      return true;
    })
    .sort((a, b) => b.priority - a.priority);

  let baseAmount = existingAmount;
  const calculations: RuleCalculationResult[] = [];
  let totalDiscount = 0;

  for (const rule of activeRules) {
    const condition = rule.condition as Record<string, unknown>;
    const value = rule.value as Record<string, unknown>;

    switch (rule.type) {
      case "FLAT": {
        const flatValue = value as unknown as FlatValue;
        const rate = flatValue.rate || 0;
        const ruleResult: RuleCalculationResult = {
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: rule.type,
          applied: true,
          expectedAmount: rate * (units || 1),
          details: {
            rate,
            units: units || 1,
            calculation: `${rate} × ${units || 1}`,
          },
        };
        calculations.push(ruleResult);
        baseAmount = ruleResult.expectedAmount;
        break;
      }

      case "TIERED": {
        const tieredCondition = condition as unknown as TieredCondition;
        const tieredValue = value as unknown as TieredValue;
        const thresholds = tieredCondition.thresholds || [];
        const rates = tieredValue.rates || [];

        let expectedForUnits = 0;
        let remainingUnits = units || 0;

        for (let i = 0; i < thresholds.length; i++) {
          const threshold = thresholds[i];
          const nextThreshold = thresholds[i + 1] || Infinity;
          const rate = rates[i] || 0;

          if (remainingUnits <= 0) break;

          const unitsInTier =
            i === 0
              ? Math.min(remainingUnits, threshold)
              : Math.min(remainingUnits, nextThreshold - threshold);

          if (unitsInTier > 0) {
            expectedForUnits += unitsInTier * rate;
            remainingUnits -= unitsInTier;
          }
        }

        if (remainingUnits > 0 && rates.length > 0) {
          expectedForUnits += remainingUnits * (rates[rates.length - 1] || 0);
        }

        const ruleResult: RuleCalculationResult = {
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: rule.type,
          applied: true,
          expectedAmount: expectedForUnits,
          details: {
            units: units,
            thresholds,
            rates,
            calculation: `Tiered pricing applied`,
          },
        };
        calculations.push(ruleResult);
        baseAmount = ruleResult.expectedAmount;
        break;
      }

      case "MINIMUM": {
        const minValue = value as unknown as MinimumValue;
        const minimum = minValue.minimum || 0;

        if (baseAmount < minimum) {
          const ruleResult: RuleCalculationResult = {
            ruleId: rule.id,
            ruleName: rule.name,
            ruleType: rule.type,
            applied: true,
            expectedAmount: minimum,
            details: {
              previousAmount: baseAmount,
              minimum,
              enforcement: `Charged minimum of ${minimum}`,
            },
          };
          calculations.push(ruleResult);
          baseAmount = minimum;
        }
        break;
      }

      case "DISCOUNT":
      case "TIME_BASED_DISCOUNT": {
        const discountValue = value as unknown as DiscountValue;
        const discountPercent = discountValue.discountPercent || 0;

        if (totalDiscount === 0) {
          totalDiscount = discountPercent;
        } else {
          totalDiscount = totalDiscount + discountPercent - (totalDiscount * discountPercent) / 100;
        }

        const discountedAmount = baseAmount * (1 - discountPercent / 100);
        const ruleResult: RuleCalculationResult = {
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: rule.type,
          applied: true,
          expectedAmount: discountedAmount,
          details: {
            originalAmount: baseAmount,
            discountPercent,
            discountedAmount,
          },
        };
        calculations.push(ruleResult);
        baseAmount = discountedAmount;
        break;
      }
    }
  }

  return { expectedAmount: baseAmount, calculations };
}

export function determineIssueType(
  expectedAmount: number,
  actualAmount: number,
  threshold: number = 0.01
): "UNDERCHARGE" | "OVERCHARGE" | null {
  const difference = expectedAmount - actualAmount;

  if (Math.abs(difference) < threshold) {
    return null;
  }

  return difference > 0 ? "UNDERCHARGE" : "OVERCHARGE";
}