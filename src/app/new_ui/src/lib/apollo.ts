import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

// HTTP link for the new UI backend (audio processing)
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_BACKEND_URL + '/graphql' || 'http://localhost:3001/graphql',
});

// WebSocket link for schemabot GraphQL server (LangGraph conversations)
const wsLink = new GraphQLWsLink(
  createClient({
    url: process.env.NEXT_PUBLIC_SCHEMABOT_WS_URL || 'ws://localhost:8003/graphql',
  })
);

// HTTP link for schemabot GraphQL server (queries and mutations)
const schemabotHttpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_SCHEMABOT_URL || 'http://localhost:8003/graphql',
});

// Split links based on operation type
const schemabotSplitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  schemabotHttpLink
);

// Create Apollo Client with multiple endpoints
export const apolloClient = new ApolloClient({
  link: split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      if (definition.kind !== 'OperationDefinition') return false;
      
      // Route audio operations to new UI backend
      const operationName = definition.name?.value || '';
      return operationName === 'TranscribeAudio' || operationName === 'GenerateSpeech';
    },
    httpLink,
    schemabotSplitLink
  ),
  cache: new InMemoryCache({
    typePolicies: {
      ConversationSession: {
        keyFields: ['id'],
      },
      Message: {
        keyFields: ['id'],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});
