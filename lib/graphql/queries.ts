import { gql } from "@apollo/client";

export const DASHBOARD_STATS_QUERY = gql`
  query DashboardStats {
    dashboardStats {
      totalIncome
      totalExpenses
      balance
      transactionCount
      categoriesCount
    }
  }
`;

export const DASHBOARD_STATS_COMPARISON_QUERY = gql`
  query DashboardStatsComparison {
    dashboardStatsComparison {
      current {
        totalIncome
        totalExpenses
        balance
        transactionCount
        categoriesCount
      }
      previous {
        totalIncome
        totalExpenses
        balance
        transactionCount
        categoriesCount
      }
      incomeChange
      expensesChange
      balanceChange
      transactionCountChange
    }
  }
`;

export const MONTHLY_DATA_QUERY = gql`
  query MonthlyData($year: Int!) {
    monthlyData(year: $year) {
      month
      income
      expenses
    }
  }
`;

export const GET_CATEGORIES_QUERY = gql`
  query GetCategories {
    categories {
      id
      name
      icon
      color
      type
      createdAt
    }
  }
`;

export const GET_TRANSACTIONS_QUERY = gql`
  query GetTransactions($limit: Int, $offset: Int, $type: TransactionType) {
    transactions(limit: $limit, offset: $offset, type: $type) {
      id
      amount
      description
      type
      date
      createdAt
      category {
        id
        name
        icon
        color
      }
    }
  }
`;

export const GET_BUDGETS_QUERY = gql`
  query GetBudgets {
    budgets {
      id
      amount
      spent
      period
      startDate
      endDate
      createdAt
      category {
        id
        name
        icon
        color
        type
      }
    }
  }
`;

export const CREATE_CATEGORY_MUTATION = gql`
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      id
      name
      icon
      color
      type
      createdAt
    }
  }
`;

export const CREATE_TRANSACTION_MUTATION = gql`
  mutation CreateTransaction($input: CreateTransactionInput!) {
    createTransaction(input: $input) {
      id
      amount
      description
      type
      date
      createdAt
      category {
        id
        name
        icon
        color
      }
    }
  }
`;

export const CREATE_BUDGET_MUTATION = gql`
  mutation CreateBudget($input: CreateBudgetInput!) {
    createBudget(input: $input) {
      id
      amount
      spent
      period
      startDate
      endDate
      createdAt
      category {
        id
        name
        icon
        color
      }
    }
  }
`;

export const UPDATE_TRANSACTION_MUTATION = gql`
  mutation UpdateTransaction($input: UpdateTransactionInput!) {
    updateTransaction(input: $input) {
      id
      amount
      description
      type
      date
      createdAt
      category {
        id
        name
        icon
        color
      }
    }
  }
`;

export const DELETE_TRANSACTION_MUTATION = gql`
  mutation DeleteTransaction($id: String!) {
    deleteTransaction(id: $id)
  }
`;

export const DELETE_CATEGORY_MUTATION = gql`
  mutation DeleteCategory($id: String!) {
    deleteCategory(id: $id)
  }
`;

export const DELETE_BUDGET_MUTATION = gql`
  mutation DeleteBudget($id: String!) {
    deleteBudget(id: $id)
  }
`;

// Subscriptions
export const TRANSACTION_ADDED_SUBSCRIPTION = gql`
  subscription TransactionAdded($userId: String!) {
    transactionAdded(userId: $userId) {
      id
      amount
      description
      type
      date
      createdAt
      category {
        id
        name
        icon
        color
      }
    }
  }
`;

export const TRANSACTION_UPDATED_SUBSCRIPTION = gql`
  subscription TransactionUpdated($userId: String!) {
    transactionUpdated(userId: $userId) {
      id
      amount
      description
      type
      date
      createdAt
      category {
        id
        name
        icon
        color
      }
    }
  }
`;

export const TRANSACTION_DELETED_SUBSCRIPTION = gql`
  subscription TransactionDeleted($userId: String!) {
    transactionDeleted(userId: $userId)
  }
`;
