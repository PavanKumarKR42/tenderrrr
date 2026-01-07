# Bid Range Validation Debug Guide

## Issue Summary
When bidding 90000 on tender 29:
- **Frontend validation**: PASSES (bid considered valid)
- **Smart contract validation**: FAILS with "Below minimum" error

This suggests the database minAmount ≠ smart contract minAmount for tender 29.

## How to Diagnose

### Step 1: Open Browser DevTools
1. Press `F12` in your browser
2. Go to the **Console** tab
3. Make sure console is clear (scroll to top)

### Step 2: Attempt the Bid
1. Go to tender list
2. Try to bid **90000** on tender **29**

### Step 3: Check Console Output
Look for these log entries:

#### A) Database Validation (Should show DATABASE values)
```
✅ Found tender: { tenderId: 29, minAmount: X, maxAmount: Y, title: "..." }
Validation range from DATABASE: { minAllowed: A, maxAllowed: B }
```

**Expected for bid to pass**:
- `A <= 90000 <= B` (should show bid as valid)

#### B) Blockchain Fetch (Should show CONTRACT values)
```
🔗 Fetching tender data from BLOCKCHAIN for tender ID: 29
📋 Raw blockchain tender data: {...}
Blockchain minAmount: [VALUE]
Blockchain maxAmount: [VALUE]
Blockchain currentBid: [VALUE]

✅ Blockchain RANGE for tender 29: { minAmount: X, maxAmount: Y }
User bid amount: 90000
Is bid >= minAmount? [true/false]
Is bid <= maxAmount? [true/false]
```

## What to Compare

Compare DATABASE values with BLOCKCHAIN values:

| Item | Database | Blockchain | Match? |
|------|----------|-----------|--------|
| minAmount | ? | ? | ✓/✗ |
| maxAmount | ? | ? | ✓/✗ |

## Likely Scenarios

### Scenario 1: Data Mismatch
- Database minAmount = 80000
- Blockchain minAmount = 100000
- User bid = 90000
- **Result**: Frontend passes (90000 >= 80000), contract fails (90000 < 100000)
- **Solution**: Delete tender 29 and re-create it

### Scenario 2: Range Inversion
- User created with minAmount=90000, maxAmount=50000 (backwards)
- Both DB and contract might have them inverted differently
- **Result**: Different min/max after Math.min/max processing
- **Solution**: Standardize: Always require minAmount <= maxAmount

### Scenario 3: Number Format Issue
- Big numbers being truncated or converted incorrectly
- **Result**: Actual numbers differ from what's displayed
- **Solution**: Check exact numeric values in console

## Action After Diagnosis

**If Database ≠ Blockchain:**
1. Delete or mark tender 29 as cancelled
2. Re-create the tender from scratch
3. This ensures database and blockchain are in sync

**If they match but contract still rejects:**
1. Contract validation logic is different than expected
2. May need to review smart contract rules
3. Might need to adjust bid validation in frontend

## Current Code Location

The enhanced logging is in: `client/src/pages/TenderList.jsx` lines 108-173

Look for sections marked with:
- 📋 (data fetching)
- ✅ (validation results)
- 🔗 (blockchain interaction)
