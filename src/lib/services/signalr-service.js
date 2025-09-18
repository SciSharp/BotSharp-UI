import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { endpoints } from '$lib/services/api-endpoints.js';
import { getUserStore } from '$lib/helpers/store.js';

// create a writable store to store the connection object
/** @type {HubConnection} */
let connection;

// create a SignalR service object that exposes methods to interact with the hub
export const signalr = {

  /** @type {import('$conversationTypes').OnConversationInitialized} */
  onConversationInitFromClient: () => {},

  /** @type {import('$conversationTypes').OnMessageReceived} */
  onMessageReceivedFromClient: () => {},

  /** @type {import('$conversationTypes').OnMessageReceived} */
  onMessageReceivedFromCsr: () => {},
  
  /** @type {import('$conversationTypes').OnMessageReceived} */
  onMessageReceivedFromAssistant: () => {},

  /** @type {import('$conversationTypes').OnMessageReceived} */
  onIntermediateMessageReceivedFromAssistant: () => {},

  /** @type {import('$conversationTypes').OnMessageReceived} */
  onNotificationGenerated: () => {},

  /** @type {import('$conversationTypes').OnConversationContentLogReceived} */
  onConversationContentLogGenerated: () => {},

  /** @type {import('$conversationTypes').OnConversationStateLogGenerated} */
  onConversationStateLogGenerated: () => {},

  /** @type {import('$conversationTypes').OnStateChangeGenerated} */
  onStateChangeGenerated: () => {},

  /** @type {import('$conversationTypes').OnAgentQueueChanged} */
  onAgentQueueChanged: () => {},

  /** @type {import('$conversationTypes').OnSenderActionGenerated} */
  onSenderActionGenerated: () => {},

  /** @type {import('$conversationTypes').OnConversationMessageDeleted} */
  onConversationMessageDeleted: () => {},

  /** @type {import('$conversationTypes').OnMessageReceived} */
  beforeReceiveLlmStreamMessage: () => {},
  /** @type {import('$conversationTypes').OnMessageReceived} */
  onReceiveLlmStreamMessage: async () => {},
  /** @type {import('$conversationTypes').OnMessageReceived} */
  afterReceiveLlmStreamMessage: () => {},

  /** @type {import('$conversationTypes').OnMessageReceived} */
  onIndicationReceived: () => {},

  // start the connection
  /** @param {string} conversationId */
  async start(conversationId) {
    // create a new connection object with the hub URL and some options
    let user = getUserStore();
    connection = new HubConnectionBuilder()
      .withUrl(endpoints.chatHubUrl + `?conversation-id=${conversationId}&access_token=${user.token}`) // the hub URL, change it according to your server
      .withAutomaticReconnect() // enable automatic reconnection
      .configureLogging(LogLevel.Information) // configure the logging level
      .build();

    // start the connection
    try {
      await connection.start();
      console.log('Connected to SignalR hub');
    } catch (err) {
      console.error(err);
    }

    // register handlers for the hub methods
    connection.on('OnConversationInitFromClient', (conversation) => {
      // do something when receiving a message, such as updating the UI or showing a notification
      const obj = JSON.parse(conversation);
      if (conversationId === obj?.id) {
        console.log(`[OnConversationInitFromClient] ${obj.id}: ${obj.title}`);
        this.onConversationInitFromClient(obj);
      }
    });

    // register handlers for the hub methods
    connection.on('OnMessageReceivedFromClient', (message) => {
      // do something when receiving a message, such as updating the UI or showing a notification
      const obj = JSON.parse(message);
      if (conversationId === obj?.conversation_id) {
        console.log(`[OnMessageReceivedFromClient] ${obj.sender.role}: ${obj.text}`);
        this.onMessageReceivedFromClient(obj);
      }
    });

    connection.on('OnMessageReceivedFromCsr', (message) => {
      // do something when receiving a message, such as updating the UI or showing a notification
      const obj = JSON.parse(message);
      if (conversationId === obj?.conversation_id) {
        console.log(`[OnMessageReceivedFromCsr] ${obj.role}: ${obj.content}`);
        this.onMessageReceivedFromCsr(obj);
      }
    });

    connection.on('OnMessageReceivedFromAssistant', (message) => {
      // do something when receiving a message, such as updating the UI or showing a notification
      const obj = JSON.parse(message);
      if (conversationId === obj?.conversation_id) {
        console.log(`[OnMessageReceivedFromAssistant] ${obj.sender.role}: ${obj.text}`);
        this.onMessageReceivedFromAssistant(obj);
      }
    });

    connection.on('OnIntermediateMessageReceivedFromAssistant', (message) => {
      // do something when receiving a message, such as updating the UI or showing a notification
      const obj = JSON.parse(message);
      if (conversationId === obj?.conversation_id) {
        console.log(`[OnIntermediateMessageReceivedFromAssistant] ${obj.sender.role}: ${obj.text}`);
        this.onIntermediateMessageReceivedFromAssistant(obj);
      }
    });

    connection.on('OnNotificationGenerated', (message) => {
      const obj = JSON.parse(message);
      if (conversationId === obj?.conversation_id) {
        this.onNotificationGenerated(obj);
      }
    });

    connection.on('OnConversationContentLogGenerated', (log) => {
      const obj = JSON.parse(log);
      if (conversationId === obj?.conversation_id) {
        this.onConversationContentLogGenerated(obj);
      }
    });

    connection.on('OnConversateStateLogGenerated', (log) => {
      const obj = JSON.parse(log);
      if (conversationId === obj?.conversation_id) {
        this.onConversationStateLogGenerated(obj);
      }
    });

    connection.on('OnStateChangeGenerated', (log) => {
      const obj = JSON.parse(log);
      if (conversationId === obj?.conversation_id) {
        this.onStateChangeGenerated(obj);
      }
    });

    connection.on('OnAgentQueueChanged', (log) => {
      const obj = JSON.parse(log);
      if (conversationId === obj?.conversation_id) {
        this.onAgentQueueChanged(obj);
      }
    });

    connection.on('OnSenderActionGenerated', (data) => {
      const obj = JSON.parse(data);
      if (conversationId === obj?.conversation_id) {
        this.onSenderActionGenerated(obj);
      }
    });

    connection.on('OnMessageDeleted', (data) => {
      const obj = JSON.parse(data);
      if (conversationId === obj?.conversation_id) {
        this.onConversationMessageDeleted(obj);
      }
    });

    connection.on('BeforeReceiveLlmStreamMessage', data => {
      const obj = JSON.parse(data);
      if (conversationId === obj?.conversation_id) {
        this.beforeReceiveLlmStreamMessage(obj);
      }
    });

    connection.on('OnReceiveLlmStreamMessage', data => {
      const obj = JSON.parse(data);
      if (conversationId === obj?.conversation_id) {
        this.onReceiveLlmStreamMessage(obj);
      }
    });

    connection.on('AfterReceiveLlmStreamMessage', data => {
      const obj = JSON.parse(data);
      if (conversationId === obj?.conversation_id) {
        this.afterReceiveLlmStreamMessage(obj);
      }
    });

    connection.on('OnIndicationReceived', data => {
      const obj = JSON.parse(data);
      if (conversationId === obj?.conversation_id) {
        this.onIndicationReceived(obj);
      }
    });
  },

  // stop the connection
  async stop() {
    // get the connection object from the store
    // const connection = connection.get();
    // stop the connection if it exists
    if (connection) {
      try {
        await connection.stop();
        console.log('Disconnected from SignalR hub');
      } catch (err) {
        console.error(err);
      }
    }
  },

      // get the connection object from the store
    // const connection = connection.get();
    // invoke the hub method if the connection exists and is connected
    /*if (connection && connection.state === HubConnectionState.Connected) {
        try {
        await connection.invoke('OnMessageReceivedFromClient', message);
        console.log(`Sent message from client: ${message}`);
        } catch (err) {
        console.error(err);
        }
    }*/
};
