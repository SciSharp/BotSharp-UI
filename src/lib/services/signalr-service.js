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
      if (conversationId === conversation.id) {
        console.log(`[OnConversationInitFromClient] ${conversation.id}: ${conversation.title}`);
        this.onConversationInitFromClient(conversation);
      }
    });

    // register handlers for the hub methods
    connection.on('OnMessageReceivedFromClient', (message) => {
      // do something when receiving a message, such as updating the UI or showing a notification
      if (conversationId === message.conversation_id) {
        console.log(`[OnMessageReceivedFromClient] ${message.sender.role}: ${message.text}`);
        this.onMessageReceivedFromClient(message);
      }
    });

    connection.on('OnMessageReceivedFromCsr', (message) => {
      // do something when receiving a message, such as updating the UI or showing a notification
      if (conversationId === message.conversation_id) {
        console.log(`[OnMessageReceivedFromCsr] ${message.role}: ${message.content}`);
        this.onMessageReceivedFromCsr(message);
      }
    });

    connection.on('OnMessageReceivedFromAssistant', (json) => {
      // do something when receiving a message, such as updating the UI or showing a notification
      const message = JSON.parse(json);
      if (conversationId === message.conversation_id) {
        console.log(`[OnMessageReceivedFromAssistant] ${message.sender.role}: ${message.text}`);
        this.onMessageReceivedFromAssistant(message);
      }
    });

    connection.on('OnNotificationGenerated', (json) => {
      const message = JSON.parse(json);
      if (conversationId === message?.conversation_id) {
        this.onNotificationGenerated(message);
      }
    });

    connection.on('OnConversationContentLogGenerated', (log) => {
      const jsonLog = JSON.parse(log);
      if (conversationId === jsonLog?.conversation_id) {
        this.onConversationContentLogGenerated(jsonLog);
      }
    });

    connection.on('OnConversateStateLogGenerated', (log) => {
      const jsonData = JSON.parse(log);
      if (conversationId === jsonData?.conversation_id) {
        this.onConversationStateLogGenerated(jsonData);
      }
    });

    connection.on('OnStateChangeGenerated', (log) => {
      const jsonData = JSON.parse(log);
      if (conversationId === jsonData?.conversation_id) {
        this.onStateChangeGenerated(jsonData);
      }
    });

    connection.on('OnAgentQueueChanged', (log) => {
      const jsonData = JSON.parse(log);
      if (conversationId === jsonData?.conversation_id) {
        this.onAgentQueueChanged(jsonData);
      }
    });

    connection.on('OnSenderActionGenerated', (data) => {
      if (conversationId === data?.conversation_id) {
        this.onSenderActionGenerated(data);
      }
    });

    connection.on('OnMessageDeleted', (data) => {
      if (conversationId === data?.conversation_id) {
        this.onConversationMessageDeleted(data);
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
