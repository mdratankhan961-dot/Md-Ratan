# TakaEarn BD — Premium Task & Rewards Earning Platform

A full-stack, mobile-responsive earning web application built specifically for Bangladeshi users with real BDT currency formatting (৳), bilingual Bengali & English support, and verified payouts through **bKash**, **Nagad**, and **Rocket**.

---

## 🌟 Key Architecture & Capabilities

### 1. User Earning Features
- **Admin-Controlled 10-Second Ad Gate Tasks**: Users must view a mandatory 10-second sponsor gate countdown verified by server timestamps. Early closing or skipping terminates the session. Full task duration is enforced on the backend before crediting rewards.
- **Lucky Spin & Win**: Interactive SVG spinning wheel with server-authoritative weighted random rewards (৳ 0 to ৳ 100 jackpot), free spins daily, and cooldown timer.
- **Video Ad Rewards**: 15-second partner video ad player with real-time countdown, daily caps, and anti-abuse cooldowns.
- **Referral Program**: Unique referral codes and sharing links. Awards ৳ 15 welcome referral bonuses + 10% lifetime commission on completed tasks.

### 2. Financial Security & BDT Withdrawals
- **Supported Gateways**: bKash, Nagad, and Rocket (11 or 12 digit Bangladeshi mobile numbers).
- **Atomic Balance Reservation**: When a user submits a withdrawal request, funds are deducted immediately from their available balance and reserved into pending liabilities.
- **Automated Refund on Rejection/Cancellation**: If an administrator rejects a request or a user cancels their pending withdrawal, the exact reserved amount is restored to their available balance.
- **Immutable Transaction Ledger**: Every single balance adjustment, task reward, spin win, and withdrawal is tracked with before/after balances.

### 3. Dedicated Administrator Portal (`/admin`)
- **Initial Master Username**: `mdratan`
- **Initial Password Security**: Configurable securely via environment variable `ADMIN_INITIAL_PASSWORD` or the one-time first-run setup wizard. No hardcoded passwords in client code.
- **Administrative Command Center**: Overview of active platform liabilities, reserves, user growth, and pending withdrawal amounts.
- **User Management**: Filter, search, suspend/reactivate accounts, and execute audited balance adjustments with mandatory administrative reason notes.
- **Task Management**: Create, edit, pause, and delete tasks with custom durations, gate intervals, and BDT rewards.
- **Adsterra & Monetag Integration**: Dynamic configuration of Adsterra banner scripts, social bars, popunders, and Monetag direct links without modifying source code.
- **Audit Logs**: Full administrative audit trail tracking every single privileged action.

---

## 🚀 Environment Variables (`.env`)

Configure the following in `.env`:

```env
# Server Port
PORT=3000

# JSON Web Token Secret
JWT_SECRET="takaearn_bd_jwt_secure_key_2026"

# Initial Administrator Master Password
# (Can be supplied in .env or configured on first visit to /admin)
ADMIN_INITIAL_USERNAME="mdratan"
ADMIN_INITIAL_PASSWORD="YourSecurePasswordHere"
```

---

## 🛠️ Installation & Running

```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite
npx tsx test/run-tests.ts

# 3. Start development server (Full-stack Express + Vite)
npm run dev

# 4. Build for production
npm run build
npm start
```

---

## 🧪 Automated Testing

The automated test suite in `test/run-tests.ts` validates:
1. **Database & Ledger Initialization**
2. **Password Hashing & Bcrypt Verification**
3. **Financial Accounting & Overdraft Prevention**
4. **10-Second Ad Gate & Duration Anti-Manipulation Verification**
5. **Withdrawal Balance Reservation & Rejection Refund Mechanics**
6. **Role-Based Access Control (RBAC) & Token Security**

To execute tests:
```bash
npx tsx test/run-tests.ts
```

---

## 📱 Mobile-First Responsive Design

- **Mobile Viewports**: Bottom navigation bar with quick access to Home, Tasks, Lucky Spin, Watch Ads, Wallet, and Profile.
- **Desktop Viewports**: Left sidebar navigation with live balance chips and community help links.
- **Bilingual Interface**: Quick one-click toggle between English and Bengali (বাংলা) anywhere on the page.
