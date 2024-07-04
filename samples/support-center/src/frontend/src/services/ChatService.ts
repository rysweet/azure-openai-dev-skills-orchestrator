import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr'
import axios from 'axios'
import { v4 as uuid } from 'uuid'
import { Configuration } from '../models/Configuration'
import { Message, SenderType } from '../models/Message'

const supportCenterBaseUrl = import.meta.env.VITE_OAGENT_BASE_URL
const isMockEnabled = import.meta.env.VITE_IS_MOCK_ENABLED

export async function getConfigurationAsync(): Promise<Configuration> {
  return {
    chatConfiguration: {
      welcomeTitle: "Let's start chatting...",
      welcomeSubtitle: "",
      welcomeHints: [
        "I'm moving to another city, so I need to change my address. Can you help me with that?",
        "I'm not sure how to pay my bill. Can you help me with that?",
      ],
      welcomeWarning: 'Warning: Answers are generated by AI and might be innacurate. Please review output carefully before use.',
      previewContent: 'Text',
    },
  }

  // const response = await axios.get<Configuration>(`${supportCenterBaseUrl}configuration/${clientId}`)
  // return response.data
}

export async function initConversationAsync(metadata: { [key: string]: string }): Promise<string> {
  // if (isMockEnabled) {
  return uuid().toString()
  // }

  const response = await axios.post<InitConversationResponse>(`${supportCenterBaseUrl}chat`, {
    metadata,
  })

  return response.data.conversationId
}

export async function SendMessageAsync(conversationId: string, userId: string, messageText: string): Promise<Message> {
  if (isMockEnabled) {
    return {
      id: uuid().toString(),
      sender: SenderType.Agent,
      text: 'Emphasis [doc1] **This is bold text** __This is bold text__ *This is italic text* _This is italic text_ ~~Strikethrough~~',
      timestamp: new Date(),
      feedback: undefined,
      isError: false,
      citations: [
        {
          id: '1',
          title: 'Title 1',
          content: 'CITATION_TEXT',
          reindex_id: '1',
          filename: 'Dummy.pdf',
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        },
      ],
    }
  }

  try {
    console.log('Sending message to url:', `${supportCenterBaseUrl}/api/Interactions/${userId}`)
    const response = await axios.post<Message>(`${supportCenterBaseUrl}/api/Interactions/${userId}`, {
      message: messageText,
    })

    response.data.isError = false
    return response.data
  }
  catch (error: any) {
    const message = <Message>{};
    message.id = uuid().toString();
    message.timestamp = new Date();
    message.isError = true
    if (error.response) {
      console.log(error.response.data);
      message.text = error.response.data.detail ?? "Sorry, something went wrong. Please retry later."
    } else if (error.request) {
      console.log(error.request);
      message.text = error.request;
    } else {
      console.log("Error", error.message);
      message.text = error.message;
    }

    return message;
  }
}

export async function SendFeedbackAsync(
  conversationId: string,
  messageId: string,
  rating: string,
  replyMessage: string,
): Promise<void> {
  const request: SendFeedbackRequest = {
    conversationId,
    messageId,
    rating,
    replyMessage,
  }

  if (isMockEnabled) {
    return
  }

  await axios.post(`${supportCenterBaseUrl}api/chat/feedback`, request)
}


export function GetStreamingConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${supportCenterBaseUrl}supportcenterhub`)
    .withAutomaticReconnect()
    .build();
}
interface InitConversationResponse {
  conversationId: string
}

interface SendFeedbackRequest {
  conversationId: string
  messageId: string
  rating: string
  replyMessage: string
}