import { PrismaClient } from "@prisma/client";
import { PubSub } from "graphql-subscriptions";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/auth-options";
import { GraphQLScalarType, Kind } from "graphql";

const prisma = new PrismaClient();
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
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new Error("Not authenticated");
      }

      return await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          categories: true,
          transactions: true,
          budgets: true,
        },
      });
    },

    categories: async (_: any, __: any, context: any) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new Error("Not authenticated");
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      return await prisma.category.findMany({
        where: { userId: user?.id },
        include: {
          transactions: true,
          budgets: true,
        },
        orderBy: { createdAt: "desc" },
      });
    },

    transactions: async (_: any, args: any, context: any) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new Error("Not authenticated");
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      const { limit = 50, offset = 0, type } = args;

      return await prisma.transaction.findMany({
        where: {
          userId: user?.id,
          ...(type && { type }),
        },
        include: {
          category: true,
        },
        orderBy: { date: "desc" },
        take: limit,
        skip: offset,
      });
    },

    transaction: async (_: any, args: any, context: any) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new Error("Not authenticated");
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      return await prisma.transaction.findFirst({
        where: {
          id: args.id,
          userId: user?.id,
        },
        include: {
          category: true,
        },
      });
    },

    budgets: async (_: any, __: any, context: any) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new Error("Not authenticated");
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      return await prisma.budget.findMany({
        where: { userId: user?.id },
        include: {
          category: true,
        },
        orderBy: { createdAt: "desc" },
      });
    },

    budget: async (_: any, args: any, context: any) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new Error("Not authenticated");
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      return await prisma.budget.findFirst({
        where: {
          id: args.id,
          userId: user?.id,
        },
        include: {
          category: true,
        },
      });
    },

    dashboardStats: async (_: any, __: any, context: any) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new Error("Not authenticated");
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const nextMonth = new Date(currentMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const [incomeResult, expenseResult, transactionCount, categoriesCount] =
        await Promise.all([
          prisma.transaction.aggregate({
            where: {
              userId: user?.id,
              type: "INCOME",
              date: {
                gte: currentMonth,
                lt: nextMonth,
              },
            },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: {
              userId: user?.id,
              type: "EXPENSE",
              date: {
                gte: currentMonth,
                lt: nextMonth,
              },
            },
            _sum: { amount: true },
          }),
          prisma.transaction.count({
            where: {
              userId: user?.id,
              date: {
                gte: currentMonth,
                lt: nextMonth,
              },
            },
          }),
          prisma.category.count({
            where: { userId: user?.id },
          }),
        ]);

      const totalIncome = Number(incomeResult._sum.amount || 0);
      const totalExpenses = Number(expenseResult._sum.amount || 0);

      return {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        transactionCount,
        categoriesCount,
      };
    },

    monthlyData: async (_: any, args: any, context: any) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new Error("Not authenticated");
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      const { year } = args;
      const months: { month: string; income: number; expenses: number }[] = [];

      for (let month = 0; month < 12; month++) {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

        const [incomeResult, expenseResult] = await Promise.all([
          prisma.transaction.aggregate({
            where: {
              userId: user?.id,
              type: "INCOME",
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: {
              userId: user?.id,
              type: "EXPENSE",
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
            _sum: { amount: true },
          }),
        ]);

        months.push({
          month: startDate.toLocaleString("default", { month: "short" }),
          income: Number(incomeResult._sum.amount || 0),
          expenses: Number(expenseResult._sum.amount || 0),
        });
      }

      return months;
    },
  },

  Mutation: {
    createCategory: async (_: any, args: any, context: any) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new Error("Not authenticated");
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      const category = await prisma.category.create({
        data: {
          ...args.input,
          userId: user!.id,
        },
        include: {
          transactions: true,
          budgets: true,
        },
      });

      return category;
    },

    updateCategory: async (_: any, args: any, context: any) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new Error("Not authenticated");
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      const { id, ...updateData } = args.input;

      const category = await prisma.category.updateMany({
        where: {
          id,
          userId: user?.id,
        },
        data: updateData,
      });

      const updatedCategory = await prisma.category.findFirst({
        where: { id },
        include: {
          transactions: true,
          budgets: true,
        },
      });

      return updatedCategory;
    },

    deleteCategory: async (_: any, args: any, context: any) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new Error("Not authenticated");
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      await prisma.category.deleteMany({
        where: {
          id: args.id,
          userId: user?.id,
        },
      });

      return true;
    },

    createTransaction: async (_: any, args: any, context: any) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new Error("Not authenticated");
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      const transaction = await prisma.transaction.create({
        data: {
          ...args.input,
          userId: user!.id,
          date: args.input.date || new Date(),
        },
        include: {
          category: true,
        },
      });

      if (transaction.type === "EXPENSE") {
        const budget = await prisma.budget.findFirst({
          where: {
            categoryId: transaction.categoryId,
            userId: user!.id,
            startDate: { lte: transaction.date },
            endDate: { gte: transaction.date },
          },
        });

        if (budget) {
          await prisma.budget.update({
            where: { id: budget.id },
            data: {
              spent: {
                increment: transaction.amount,
              },
            },
          });
        }
      }

      // Publish subscription
      pubsub.publish("TRANSACTION_ADDED", {
        transactionAdded: transaction,
        userId: user!.id,
      });

      return transaction;
    },

    updateTransaction: async (_: any, args: any, context: any) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new Error("Not authenticated");
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      const { id, ...updateData } = args.input;

      const transaction = await prisma.transaction.updateMany({
        where: {
          id,
          userId: user?.id,
        },
        data: updateData,
      });

      const updatedTransaction = await prisma.transaction.findFirst({
        where: { id },
        include: {
          category: true,
        },
      });

      // Publish subscription
      pubsub.publish("TRANSACTION_UPDATED", {
        transactionUpdated: updatedTransaction,
        userId: user!.id,
      });

      return updatedTransaction;
    },

    deleteTransaction: async (_: any, args: any, context: any) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new Error("Not authenticated");
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      await prisma.transaction.deleteMany({
        where: {
          id: args.id,
          userId: user?.id,
        },
      });

      // Publish subscription
      pubsub.publish("TRANSACTION_DELETED", {
        transactionDeleted: args.id,
        userId: user!.id,
      });

      return true;
    },

    createBudget: async (_: any, args: any, context: any) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new Error("Not authenticated");
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      const budget = await prisma.budget.create({
        data: {
          ...args.input,
          userId: user!.id,
        },
        include: {
          category: true,
        },
      });

      return budget;
    },

    updateBudget: async (_: any, args: any, context: any) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new Error("Not authenticated");
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      const { id, ...updateData } = args.input;

      const budget = await prisma.budget.updateMany({
        where: {
          id,
          userId: user?.id,
        },
        data: updateData,
      });

      const updatedBudget = await prisma.budget.findFirst({
        where: { id },
        include: {
          category: true,
        },
      });

      // Publish subscription
      pubsub.publish("BUDGET_UPDATED", {
        budgetUpdated: updatedBudget,
        userId: user!.id,
      });

      return updatedBudget;
    },

    deleteBudget: async (_: any, args: any, context: any) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new Error("Not authenticated");
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      await prisma.budget.deleteMany({
        where: {
          id: args.id,
          userId: user?.id,
        },
      });

      return true;
    },
  },

  Subscription: {
    transactionAdded: {
      subscribe: (_: any, args: any) => {
        return pubsub.asyncIterator(["TRANSACTION_ADDED"]);
      },
    },
    transactionUpdated: {
      subscribe: (_: any, args: any) => {
        return pubsub.asyncIterator(["TRANSACTION_UPDATED"]);
      },
    },
    transactionDeleted: {
      subscribe: (_: any, args: any) => {
        return pubsub.asyncIterator(["TRANSACTION_DELETED"]);
      },
    },
    budgetUpdated: {
      subscribe: (_: any, args: any) => {
        return pubsub.asyncIterator(["BUDGET_UPDATED"]);
      },
    },
  },
};

export { pubsub };
