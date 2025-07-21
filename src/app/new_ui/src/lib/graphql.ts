import { gql } from '@apollo/client';

// Audio processing mutations (for the new UI backend)
export const TRANSCRIBE_AUDIO = gql`
  mutation TranscribeAudio($file: Upload!) {
    transcribeAudio(file: $file) {
      status
      transcribed_text
      error_details
    }
  }
`;

export const GENERATE_SPEECH = gql`
  mutation GenerateSpeech($text: String!, $targetLanguage: String!) {
    generateSpeech(text: $text, targetLanguage: $targetLanguage) {
      status
      audio_path
      error_message
    }
  }
`;

// LangGraph conversation mutations (for schemabot GraphQL server)
export const START_CONVERSATION = gql`
  mutation StartConversation($input: StartConversationInput!) {
    startConversation(input: $input) {
      id
      schemeCode
      stage
      createdAt
      updatedAt
      messages(limit: 1) {
        id
        role
        content
        timestamp
      }
      progress {
        overallPercentage
        basicInfo {
          collected
          total
          percentage
          isComplete
        }
        familyMembers {
          collected
          total
          percentage
          isComplete
        }
        exclusionCriteria {
          collected
          total
          percentage
          isComplete
        }
        specialProvisions {
          collected
          total
          percentage
          isComplete
        }
      }
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      role
      content
      timestamp
    }
  }
`;

export const GET_CONVERSATION = gql`
  query GetConversation($sessionId: String!) {
    conversation(sessionId: $sessionId) {
      id
      schemeCode
      stage
      createdAt
      updatedAt
      isComplete
      messages {
        id
        role
        content
        timestamp
      }
      progress {
        overallPercentage
        basicInfo {
          collected
          total
          percentage
          isComplete
        }
        familyMembers {
          collected
          total
          percentage
          isComplete
        }
        exclusionCriteria {
          collected
          total
          percentage
          isComplete
        }
        specialProvisions {
          collected
          total
          percentage
          isComplete
        }
      }
      farmerData {
        basicInfo
        familyMembers
        exclusionData
        specialProvisions
        schemeCode
        completedAt
      }
      eligibilityResult {
        isEligible
        confidenceScore
        explanation
        details
        timestamp
      }
    }
  }
`;

export const MESSAGE_STREAM = gql`
  subscription MessageStream($sessionId: String!) {
    messageStream(sessionId: $sessionId) {
      id
      role
      content
      timestamp
    }
  }
`;

export const CHECK_ELIGIBILITY = gql`
  mutation CheckEligibility($input: CheckEligibilityInput!) {
    checkEligibility(input: $input) {
      isEligible
      confidenceScore
      explanation
      details
      timestamp
    }
  }
`;

export const GET_AVAILABLE_SCHEMES = gql`
  query GetAvailableSchemes {
    availableSchemes
  }
`;
