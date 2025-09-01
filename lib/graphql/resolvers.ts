import { PrismaClient } from "@prisma/client";
import { PubSub } from "graphql-subscriptions";
import { GraphQLScalarType, Kind } from "graphql";
import {
  requireAuth,
  requireOwnership,
  auditLog,
  checkGraphQLRateLimit,
  sanitizeError,
} from "../security/auth-utils";
import {
  transactionSchema,
  categorySchema,
  budgetSchema,
  sanitizeInput,
  validateInput,
} from "../security/validation";
import { prisma } from "../prisma";

const pubsub = new PubSub();

const DateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  description: "DateTime custom scalar type",
  serialize(value: any) {
    return value instanceof Date ? value.toISOString() : value;
  },
  parseValue(value: any) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

const DecimalScalar = new GraphQLScalarType({
  name: "Decimal",
  description: "Decimal custom scalar type",
  serialize(value: any) {
    return parseFloat(value);
  },
  parseValue(value: any) {
    return parseFloat(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.FLOAT || ast.kind === Kind.INT) {
      return parseFloat(ast.value);
    }
    return null;
  },
});

export const resolvers = {
  DateTime: DateTimeScalar,
  Decimal: DecimalScalar,

  Query: {
    me: async (_: any, __: any, context: any) => {
      try {
        const auth = await requireAuth(context);

        if (!checkGraphQLRateLimit(auth.userId, "me", 50)) {
          throw new Error("Rate limit exceeded");
        }

        const user = await prisma.user.findUnique({
          where: { id: auth.userId },
          select: {
            id: true,
            name: true,
            email: true,
            currency: true,
            theme: true,
            twoFactorEnabled: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        await auditLog(auth.userId, "VIEW_PROFILE", "user", auth.userId);
        return user;
      } catch (error) {
        throw sanitizeError(
          error as Error,
          process.env.NODE_ENV === "development"
        );
      }
    },

    categories: async (_: any, __: any, context: any) => {
      try {
        const auth = await requireAuth(context);

        if (!checkGraphQLRateLimit(auth.userId, "categories", 100)) {
          throw new Error("Rate limit exceeded");
        }

        const categories = await prisma.category.findMany({
          where: { userId: auth.userId },
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            type: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                transactions: true,
                budgets: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        await auditLog(auth.userId, "VIEW_CATEGORIES", "category");
        return categories;
      } catch (error) {
        throw sanitizeError(
          error as Error,
          process.env.NODE_ENV === "development"
        );
      }
    },

    transactions: async (_: any, args: any, context: any) => {
      try {
        const auth = await requireAuth(context);

        if (!checkGraphQLRateLimit(auth.userId, "transactions", 100)) {
          throw new Error("Rate limit exceeded");
        }

        const sanitizedArgs = sanitizeInput(args);
        const { limit = 50, offset = 0, type } = sanitizedArgs;

        const safeLimit = Math.min(Math.max(1, limit), 100);
        const safeOffset = Math.max(0, offset);

        const transactions = await prisma.transaction.findMany({
          where: {
            userId: auth.userId,
            ...(type && { type }),
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                icon: true,
                color: true,
              },
            },
          },
          orderBy: { date: "desc" },
          take: safeLimit,
          skip: safeOffset,
        });

        await auditLog(
          auth.userId,
          "VIEW_TRANSACTIONS",
          "transaction",
          undefined,
          { limit: safeLimit, offset: safeOffset, type }
        );
        return transactions;
      } catch (error) {
        throw sanitizeError(
          error as Error,
          process.env.NODE_ENV === "development"
        );
      }
    },

    transaction: async (_: any, args: any, context: any) => {
      try {
        const auth = await requireAuth(context);
        const { id } = sanitizeInput(args);

        await requireOwnership(auth.userId, id, "transaction");

        const transaction = await prisma.transaction.findFirst({
          where: { id, userId: auth.userId },
          include: { category: true },
        });

        await auditLog(auth.userId, "VIEW_TRANSACTION", "transaction", id);
        return transaction;
      } catch (error) {
        throw sanitizeError(
          error as Error,
          process.env.NODE_ENV === "development"
        );
      }
    },

    budgets: async (_: any, __: any, context: any) => {
      try {
        const auth = await requireAuth(context);

        if (!checkGraphQLRateLimit(auth.userId, "budgets", 100)) {
          throw new Error("Rate limit exceeded");
        }

        const budgets = await prisma.budget.findMany({
          where: { userId: auth.userId },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                icon: true,
                color: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        await auditLog(auth.userId, "VIEW_BUDGETS", "budget");
        return budgets;
      } catch (error) {
        throw sanitizeError(
          error as Error,
          process.env.NODE_ENV === "development"
        );
      }
    },

    budget: async (_: any, args: any, context: any) => {
      try {
        const auth = await requireAuth(context);
        const { id } = sanitizeInput(args);

        await requireOwnership(auth.userId, id, "budget");

        const budget = await prisma.budget.findFirst({
          where: { id, userId: auth.userId },
          include: { category: true },
        });

        await auditLog(auth.userId, "VIEW_BUDGET", "budget", id);
        return budget;
      } catch (error) {
        throw sanitizeError(
          error as Error,
          process.env.NODE_ENV === "development"
        );
      }
    },

    dashboardStats: async (_: any, __: any, context: any) => {
      try {
        const auth = await requireAuth(context);

        if (!checkGraphQLRateLimit(auth.userId, "dashboardStats", 50)) {
          throw new Error("Rate limit exceeded");
        }

        const [totalIncome, totalExpenses, totalTransactions, totalBudgets] =
          await Promise.all([
            prisma.transaction.aggregate({
              where: { userId: auth.userId, type: "INCOME" },
              _sum: { amount: true },
            }),
            prisma.transaction.aggregate({
              where: { userId: auth.userId, type: "EXPENSE" },
              _sum: { amount: true },
            }),
            prisma.transaction.count({
              where: { userId: auth.userId },
            }),
            prisma.budget.count({
              where: { userId: auth.userId },
            }),
          ]);

        const incomeAmount = Number(totalIncome._sum.amount) || 0;
        const expenseAmount = Number(totalExpenses._sum.amount) || 0;

        const categoriesCount = await prisma.category.count({
          where: { userId: auth.userId },
        });

        const stats = {
          totalIncome: incomeAmount,
          totalExpenses: expenseAmount,
          balance: incomeAmount - expenseAmount,
          transactionCount: totalTransactions,
          categoriesCount,
        };

        await auditLog(auth.userId, "VIEW_DASHBOARD_STATS", "dashboard");
        return stats;
      } catch (error) {
        throw sanitizeError(
          error as Error,
          process.env.NODE_ENV === "development"
        );
      }
    },

    dashboardStatsComparison: async (_: any, __: any, context: any) => {
      try {
        const auth = await requireAuth(context);

        if (
          !checkGraphQLRateLimit(auth.userId, "dashboardStatsComparison", 30)
        ) {
          throw new Error("Rate limit exceeded");
        }

        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const previousMonth = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const [currentIncome, currentExpenses, currentTransactions] =
          await Promise.all([
            prisma.transaction.aggregate({
              where: {
                userId: auth.userId,
                type: "INCOME",
                date: { gte: currentMonth, lt: nextMonth },
              },
              _sum: { amount: true },
            }),
            prisma.transaction.aggregate({
              where: {
                userId: auth.userId,
                type: "EXPENSE",
                date: { gte: currentMonth, lt: nextMonth },
              },
              _sum: { amount: true },
            }),
            prisma.transaction.count({
              where: {
                userId: auth.userId,
                date: { gte: currentMonth, lt: nextMonth },
              },
            }),
          ]);

        const [previousIncome, previousExpenses, previousTransactions] =
          await Promise.all([
            prisma.transaction.aggregate({
              where: {
                userId: auth.userId,
                type: "INCOME",
                date: { gte: previousMonth, lt: currentMonth },
              },
              _sum: { amount: true },
            }),
            prisma.transaction.aggregate({
              where: {
                userId: auth.userId,
                type: "EXPENSE",
                date: { gte: previousMonth, lt: currentMonth },
              },
              _sum: { amount: true },
            }),
            prisma.transaction.count({
              where: {
                userId: auth.userId,
                date: { gte: previousMonth, lt: currentMonth },
              },
            }),
          ]);

        const currentIncomeAmount = Number(currentIncome._sum.amount) || 0;
        const currentExpenseAmount = Number(currentExpenses._sum.amount) || 0;
        const previousIncomeAmount = Number(previousIncome._sum.amount) || 0;
        const previousExpenseAmount = Number(previousExpenses._sum.amount) || 0;

        const [currentCategoriesCount, previousCategoriesCount] =
          await Promise.all([
            prisma.category.count({
              where: {
                userId: auth.userId,
                createdAt: { gte: currentMonth, lt: nextMonth },
              },
            }),
            prisma.category.count({
              where: {
                userId: auth.userId,
                createdAt: { gte: previousMonth, lt: currentMonth },
              },
            }),
          ]);

        const current = {
          totalIncome: currentIncomeAmount,
          totalExpenses: currentExpenseAmount,
          balance: currentIncomeAmount - currentExpenseAmount,
          transactionCount: currentTransactions,
          categoriesCount: currentCategoriesCount,
        };

        const previous = {
          totalIncome: previousIncomeAmount,
          totalExpenses: previousExpenseAmount,
          balance: previousIncomeAmount - previousExpenseAmount,
          transactionCount: previousTransactions,
          categoriesCount: previousCategoriesCount,
        };

        const comparison = {
          current,
          previous,
          incomeChange: currentIncomeAmount - previousIncomeAmount,
          expensesChange: currentExpenseAmount - previousExpenseAmount,
          balanceChange: current.balance - previous.balance,
          transactionCountChange: currentTransactions - previousTransactions,
        };

        await auditLog(auth.userId, "VIEW_DASHBOARD_COMPARISON", "dashboard");
        return comparison;
      } catch (error) {
        throw sanitizeError(
          error as Error,
          process.env.NODE_ENV === "development"
        );
      }
    },

    monthlyData: async (_: any, args: any, context: any) => {
      try {
        const auth = await requireAuth(context);
        const { year } = sanitizeInput(args);

        if (!checkGraphQLRateLimit(auth.userId, "monthlyData", 20)) {
          throw new Error("Rate limit exceeded");
        }

        const monthlyData = [];

        for (let month = 0; month < 12; month++) {
          const startDate = new Date(year, month, 1);
          const endDate = new Date(year, month + 1, 1);

          const [income, expenses] = await Promise.all([
            prisma.transaction.aggregate({
              where: {
                userId: auth.userId,
                type: "INCOME",
                date: { gte: startDate, lt: endDate },
              },
              _sum: { amount: true },
            }),
            prisma.transaction.aggregate({
              where: {
                userId: auth.userId,
                type: "EXPENSE",
                date: { gte: startDate, lt: endDate },
              },
              _sum: { amount: true },
            }),
          ]);

          monthlyData.push({
            month: startDate.toLocaleString("default", { month: "long" }),
            income: Number(income._sum.amount) || 0,
            expenses: Number(expenses._sum.amount) || 0,
          });
        }

        await auditLog(
          auth.userId,
          "VIEW_MONTHLY_DATA",
          "dashboard",
          undefined,
          { year }
        );
        return monthlyData;
      } catch (error) {
        throw sanitizeError(
          error as Error,
          process.env.NODE_ENV === "development"
        );
      }
    },
  },

  Mutation: {
    createCategory: async (_: any, args: any, context: any) => {
      try {
        const auth = await requireAuth(context);

        if (!checkGraphQLRateLimit(auth.userId, "createCategory", 10)) {
          throw new Error("Rate limit exceeded");
        }

        const validatedData = validateInput(
          categorySchema,
          sanitizeInput(args.input)
        );

        const category = await prisma.category.create({
          data: {
            ...validatedData,
            userId: auth.userId,
          },
        });

        await auditLog(
          auth.userId,
          "CREATE_CATEGORY",
          "category",
          category.id,
          validatedData
        );
        return category;
      } catch (error) {
        throw sanitizeError(
          error as Error,
          process.env.NODE_ENV === "development"
        );
      }
    },

    updateCategory: async (_: any, args: any, context: any) => {
      try {
        const auth = await requireAuth(context);
        const { id, input } = sanitizeInput(args);

        await requireOwnership(auth.userId, id, "category");
        const validatedData = validateInput(categorySchema.partial(), input);

        const category = await prisma.category.update({
          where: { id },
          data: validatedData,
        });

        await auditLog(
          auth.userId,
          "UPDATE_CATEGORY",
          "category",
          id,
          validatedData
        );
        return category;
      } catch (error) {
        throw sanitizeError(
          error as Error,
          process.env.NODE_ENV === "development"
        );
      }
    },

    deleteCategory: async (_: any, args: any, context: any) => {
      try {
        const auth = await requireAuth(context);
        const { id } = sanitizeInput(args);

        await requireOwnership(auth.userId, id, "category");

        const transactionCount = await prisma.transaction.count({
          where: { categoryId: id },
        });

        if (transactionCount > 0) {
          throw new Error("Cannot delete category with existing transactions");
        }

        const category = await prisma.category.delete({
          where: { id },
        });

        await auditLog(auth.userId, "DELETE_CATEGORY", "category", id);
        return true;
      } catch (error) {
        throw sanitizeError(
          error as Error,
          process.env.NODE_ENV === "development"
        );
      }
    },

    createTransaction: async (_: any, args: any, context: any) => {
      try {
        const auth = await requireAuth(context);

        if (!checkGraphQLRateLimit(auth.userId, "createTransaction", 20)) {
          throw new Error("Rate limit exceeded");
        }

        const validatedData = validateInput(
          transactionSchema,
          sanitizeInput(args.input)
        );

        await requireOwnership(
          auth.userId,
          validatedData.categoryId,
          "category"
        );

        const transaction = await prisma.transaction.create({
          data: {
            ...validatedData,
            userId: auth.userId,
            date: validatedData.date
              ? new Date(validatedData.date)
              : new Date(),
          },
          include: { category: true },
        });

        await auditLog(
          auth.userId,
          "CREATE_TRANSACTION",
          "transaction",
          transaction.id,
          validatedData
        );

        pubsub.publish("TRANSACTION_ADDED", {
          transactionAdded: transaction,
        });

        return transaction;
      } catch (error) {
        throw sanitizeError(
          error as Error,
          process.env.NODE_ENV === "development"
        );
      }
    },

    updateTransaction: async (_: any, args: any, context: any) => {
      try {
        const auth = await requireAuth(context);
        const { id, input } = sanitizeInput(args);

        await requireOwnership(auth.userId, id, "transaction");

        const validatedData = validateInput(transactionSchema.partial(), input);

        if (validatedData.categoryId) {
          await requireOwnership(
            auth.userId,
            validatedData.categoryId,
            "category"
          );
        }

        const transaction = await prisma.transaction.update({
          where: { id },
          data: {
            ...validatedData,
            ...(validatedData.date && { date: new Date(validatedData.date) }),
          },
          include: { category: true },
        });

        await auditLog(
          auth.userId,
          "UPDATE_TRANSACTION",
          "transaction",
          id,
          validatedData
        );

        pubsub.publish("TRANSACTION_UPDATED", {
          transactionUpdated: transaction,
        });

        return transaction;
      } catch (error) {
        throw sanitizeError(
          error as Error,
          process.env.NODE_ENV === "development"
        );
      }
    },

    deleteTransaction: async (_: any, args: any, context: any) => {
      try {
        const auth = await requireAuth(context);
        const { id } = sanitizeInput(args);

        await requireOwnership(auth.userId, id, "transaction");

        const transaction = await prisma.transaction.delete({
          where: { id },
        });

        await auditLog(auth.userId, "DELETE_TRANSACTION", "transaction", id);

        pubsub.publish("TRANSACTION_DELETED", {
          transactionDeleted: id,
        });

        return true;
      } catch (error) {
        throw sanitizeError(
          error as Error,
          process.env.NODE_ENV === "development"
        );
      }
    },

    createBudget: async (_: any, args: any, context: any) => {
      try {
        const auth = await requireAuth(context);

        if (!checkGraphQLRateLimit(auth.userId, "createBudget", 10)) {
          throw new Error("Rate limit exceeded");
        }

        const validatedData = validateInput(
          budgetSchema,
          sanitizeInput(args.input)
        );

        await requireOwnership(
          auth.userId,
          validatedData.categoryId,
          "category"
        );

        const budget = await prisma.budget.create({
          data: {
            ...validatedData,
            userId: auth.userId,
            startDate: new Date(validatedData.startDate),
            endDate: new Date(validatedData.endDate),
          },
          include: { category: true },
        });

        await auditLog(
          auth.userId,
          "CREATE_BUDGET",
          "budget",
          budget.id,
          validatedData
        );

        pubsub.publish("BUDGET_UPDATED", {
          budgetUpdated: budget,
        });

        return budget;
      } catch (error) {
        throw sanitizeError(
          error as Error,
          process.env.NODE_ENV === "development"
        );
      }
    },

    updateBudget: async (_: any, args: any, context: any) => {
      try {
        const auth = await requireAuth(context);
        const { id, input } = sanitizeInput(args);

        await requireOwnership(auth.userId, id, "budget");

        const validatedData = validateInput(budgetSchema.partial(), input);

        if (validatedData.categoryId) {
          await requireOwnership(
            auth.userId,
            validatedData.categoryId,
            "category"
          );
        }

        const budget = await prisma.budget.update({
          where: { id },
          data: {
            ...validatedData,
            ...(validatedData.startDate && {
              startDate: new Date(validatedData.startDate),
            }),
            ...(validatedData.endDate && {
              endDate: new Date(validatedData.endDate),
            }),
          },
          include: { category: true },
        });

        await auditLog(
          auth.userId,
          "UPDATE_BUDGET",
          "budget",
          id,
          validatedData
        );

        pubsub.publish("BUDGET_UPDATED", {
          budgetUpdated: budget,
        });

        return budget;
      } catch (error) {
        throw sanitizeError(
          error as Error,
          process.env.NODE_ENV === "development"
        );
      }
    },

    deleteBudget: async (_: any, args: any, context: any) => {
      try {
        const auth = await requireAuth(context);
        const { id } = sanitizeInput(args);

        await requireOwnership(auth.userId, id, "budget");

        const budget = await prisma.budget.delete({
          where: { id },
        });

        await auditLog(auth.userId, "DELETE_BUDGET", "budget", id);

        pubsub.publish("BUDGET_UPDATED", {
          budgetUpdated: budget,
        });

        return true;
      } catch (error) {
        throw sanitizeError(
          error as Error,
          process.env.NODE_ENV === "development"
        );
      }
    },
  },

  Subscription: {
    transactionAdded: {
      subscribe: () => pubsub.asyncIterator(["TRANSACTION_ADDED"]),
    },
    transactionUpdated: {
      subscribe: () => pubsub.asyncIterator(["TRANSACTION_UPDATED"]),
    },
    transactionDeleted: {
      subscribe: () => pubsub.asyncIterator(["TRANSACTION_DELETED"]),
    },
    budgetUpdated: {
      subscribe: () => pubsub.asyncIterator(["BUDGET_UPDATED"]),
    },
  },
};
