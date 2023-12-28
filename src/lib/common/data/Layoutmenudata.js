const Navdata = [
  {
    "icon": "bx bx-home-circle",
    "label": "Dashboard",
    "link": "/dashboard"
  },  
  {
    label: 'Agent',
    isHeader: true
  },
  {
    "icon": "bx bx-map-pin",
    "label": "Router",
    "link": "/agent/router"
  },  
  {
    "icon": "bx bx-bot",
    "label": "Agents",
    "link": "/agent"
  },
  {
    label: 'Conversation',
    isHeader: true
  },
  {
    "icon": "bx bx-conversation",
    "label": "Conversations",
    "link": "/conversation"
  },
  {
    label: 'RAG',
    isHeader: true
  },   
  {
    "icon": "bx bx-book-open",
    "label": "Knowledge Base",
    "link": "/rag/knowledge-base"
  },  
  {
    label: 'System',
    isHeader: true
  }, 
  {
    "icon": "bx bx-plug",
    "label": "Plugins",
    "link": "/plugin"
  }, 
  {
    "icon": "bx bx-cog",
    "label": "Settings",
    "link": "/setting"
  }
]

const MOCK_DATA = {
  Navdata
}

export default MOCK_DATA;