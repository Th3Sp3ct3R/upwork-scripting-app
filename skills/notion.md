# Notion Integration Skill

You have access to the VANTA Notion workspace via API.

## API Key
Use this for all Notion API calls:
```
ntn_t83693759662JYJIGuYdw4Tpa3D13xEE4yoUMCOcKc0fJ0
```

## Core Databases

| Database | ID | Purpose |
|----------|-----|---------|
| 🏛️ The Vault | `2b21f2da-8ade-80e4-b0eb-e4bb2ea68980` | Tasks & priorities |
| 🤖 Claude Code Sessions | `c4a47e3e-5b1f-48a5-b89f-5b065a5b1fa0` | Dev session logs |
| 👤 Account Registry | `ca080bce-43b0-466d-a13e-0d219f19e475` | Instagram accounts |
| 📱 Device Fleet | `3b23245a-735e-4bee-86e1-4899d69c3971` | GeeLark devices |
| 🛠️ GLSB Dev Tracker | `aa7a8458-8866-4250-8209-df1b7b7e92bf` | Development tasks |
| Client CRM | `2601f2da-8ade-808f-b0ca-c1ecb0e9509b` | Client management |

## API Usage

### List pages in a database
```bash
curl -X POST 'https://api.notion.com/v1/databases/{DATABASE_ID}/query' \
  -H 'Authorization: Bearer {API_KEY}' \
  -H 'Notion-Version: 2022-06-28' \
  -H 'Content-Type: application/json'
```

### Create a task in The Vault
```bash
curl -X POST 'https://api.notion.com/v1/pages' \
  -H 'Authorization: Bearer {API_KEY}' \
  -H 'Notion-Version: 2022-06-28' \
  -H 'Content-Type: application/json' \
  -d '{
    "parent": {"database_id": "2b21f2da-8ade-80e4-b0eb-e4bb2ea68980"},
    "properties": {
      "Name": {"title": [{"text": {"content": "Task title"}}]},
      "Status": {"select": {"name": "To Do"}}
    }
  }'
```

### Update a page
```bash
curl -X PATCH 'https://api.notion.com/v1/pages/{PAGE_ID}' \
  -H 'Authorization: Bearer {API_KEY}' \
  -H 'Notion-Version: 2022-06-28' \
  -H 'Content-Type: application/json' \
  -d '{
    "properties": {
      "Status": {"select": {"name": "Done"}}
    }
  }'
```

## Quick Actions

- **Add task**: Create page in The Vault with title and status
- **Log session**: Create page in Claude Code Sessions
- **Update device**: Update page in Device Fleet
- **Check accounts**: Query Account Registry

When the user asks about Notion, tasks, or wants to log something, use this skill.
