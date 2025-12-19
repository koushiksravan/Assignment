# Expense Sharing App Backend

A Node.js backend for a simplified expense-sharing application like Splitwise.

## Features

- Create groups
- Add shared expenses with different split types (equal, exact, percentage)
- Track balances (who owes whom)
- Settle dues
- Simplify balances

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Set up MongoDB (local or cloud)

3. Create a .env file with:
   ```
   MONGO_URI=mongodb://localhost:27017/expenseapp
   PORT=5000
   ```

4. Run the server:
   ```
   npm start
   ```

   Or for development:
   ```
   npm run dev
   ```

## API Endpoints

### Users
- POST /api/users - Create user
- GET /api/users/:id - Get user

### Groups
- POST /api/groups - Create group
- GET /api/groups/user/:userId - Get groups for user

### Expenses
- POST /api/expenses - Add expense
- GET /api/expenses/group/:groupId - Get expenses for group

### Balances
- GET /api/balances/user/:userId/group/:groupId - Get balances for user in group
- POST /api/balances/settle - Settle balance
- POST /api/balances/simplify/:groupId - Simplify balances

## Usage

1. Create users
2. Create a group with members
3. Add expenses to the group
4. View balances
5. Settle dues