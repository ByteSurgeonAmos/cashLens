export const typeDefs = `
  scalar DateTime
  scalar Decimal

  type User {
    id: String!
    name: String
    email: String!
    image: String
    createdAt: DateTime!
    categories: [Category!]!
    transactions: [Transaction!]!
    budgets: [Budget!]!
  }

  type Category {
    id: String!
    name: String!
    icon: String!
    color: String!
    type: CategoryType!
    userId: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    transactions: [Transaction!]!
    budgets: [Budget!]!
  }

  type Transaction {
    id: String!
    amount: Decimal!
    description: String!
    type: TransactionType!
    date: DateTime!
    categoryId: String!
    userId: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    category: Category!
  }

  type Budget {
    id: String!
    amount: Decimal!
    spent: Decimal!
    period: Period!
    startDate: DateTime!
    endDate: DateTime!
    categoryId: String!
    userId: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    category: Category!
  }

  type DashboardStats {
    totalIncome: Decimal!
    totalExpenses: Decimal!
    balance: Decimal!
    transactionCount: Int!
    categoriesCount: Int!
  }

  type DashboardStatsComparison {
    current: DashboardStats!
    previous: DashboardStats!
    incomeChange: Decimal!
    expensesChange: Decimal!
    balanceChange: Decimal!
    transactionCountChange: Int!
  }

  type MonthlyData {
    month: String!
    income: Decimal!
    expenses: Decimal!
  }

  enum CategoryType {
    INCOME
    EXPENSE
  }

  enum TransactionType {
    INCOME
    EXPENSE
  }

  enum Period {
    WEEKLY
    MONTHLY
    YEARLY
  }

  input CreateCategoryInput {
    name: String!
    icon: String!
    color: String!
    type: CategoryType!
  }

  input UpdateCategoryInput {
    id: String!
    name: String
    icon: String
    color: String
  }

  input CreateTransactionInput {
    amount: Decimal!
    description: String!
    type: TransactionType!
    categoryId: String!
    date: DateTime
  }

  input UpdateTransactionInput {
    id: String!
    amount: Decimal
    description: String
    categoryId: String
    date: DateTime
  }

  input CreateBudgetInput {
    amount: Decimal!
    period: Period!
    categoryId: String!
    startDate: DateTime!
    endDate: DateTime!
  }

  input UpdateBudgetInput {
    id: String!
    amount: Decimal
    period: Period
    startDate: DateTime
    endDate: DateTime
  }

  type Query {
    me: User
    categories: [Category!]!
    transactions(limit: Int, offset: Int, type: TransactionType): [Transaction!]!
    transaction(id: String!): Transaction
    budgets: [Budget!]!
    budget(id: String!): Budget
    dashboardStats: DashboardStats!
    dashboardStatsComparison: DashboardStatsComparison!
    monthlyData(year: Int!): [MonthlyData!]!
  }

  type Mutation {
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(input: UpdateCategoryInput!): Category!
    deleteCategory(id: String!): Boolean!
    
    createTransaction(input: CreateTransactionInput!): Transaction!
    updateTransaction(input: UpdateTransactionInput!): Transaction!
    deleteTransaction(id: String!): Boolean!
    
    createBudget(input: CreateBudgetInput!): Budget!
    updateBudget(input: UpdateBudgetInput!): Budget!
    deleteBudget(id: String!): Boolean!
  }

  type Subscription {
    transactionAdded(userId: String!): Transaction!
    transactionUpdated(userId: String!): Transaction!
    transactionDeleted(userId: String!): String!
    budgetUpdated(userId: String!): Budget!
  }
`;
