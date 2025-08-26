"use client";

import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider as ApolloClientProvider,
  createHttpLink,
  split,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { getMainDefinition } from "@apollo/client/utilities";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { useSession } from "next-auth/react";
import { ReactNode, useMemo } from "react";

interface ApolloProviderProps {
  children: ReactNode;
}

export function ApolloProvider({ children }: ApolloProviderProps) {
  const { data: session } = useSession();

  const client = useMemo(() => {
    const httpLink = createHttpLink({
      uri: "/api/graphql",
    });

    const authLink = setContext((_, { headers }) => {
      return {
        headers: {
          ...headers,
          authorization: session ? `Bearer ${session.user?.email}` : "",
        },
      };
    });

    const wsLink =
      typeof window !== "undefined"
        ? new GraphQLWsLink(
            createClient({
              url: "ws://localhost:3000/api/graphql/subscriptions",
            })
          )
        : null;

    const splitLink = wsLink
      ? split(
          ({ query }) => {
            const definition = getMainDefinition(query);
            return (
              definition.kind === "OperationDefinition" &&
              definition.operation === "subscription"
            );
          },
          wsLink,
          authLink.concat(httpLink)
        )
      : authLink.concat(httpLink);

    return new ApolloClient({
      link: splitLink,
      cache: new InMemoryCache({
        typePolicies: {
          Query: {
            fields: {
              transactions: {
                merge: false,
                read(existing, { args, readField }) {
                  return existing;
                },
              },
              dashboardStats: {
                merge: false,
                read(existing) {
                  return existing;
                },
              },
              dashboardStatsComparison: {
                merge: false,
                read(existing) {
                  return existing;
                },
              },
              monthlyData: {
                merge: false,
                read(existing, { args }) {
                  return existing;
                },
              },
            },
          },
        },
      }),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: "cache-first",
          errorPolicy: "ignore",
          notifyOnNetworkStatusChange: false,
        },
        query: {
          fetchPolicy: "cache-first",
          errorPolicy: "all",
          notifyOnNetworkStatusChange: false,
        },
      },
    });
  }, [session]);

  return (
    <ApolloClientProvider client={client}>{children}</ApolloClientProvider>
  );
}
