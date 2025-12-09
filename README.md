# Covalent Sales API

API for Covalent Sales CRM app.
Built with Express.js, Node.js and MongoDB.

Link to Frontend Repo:
[Frontend Repo](https://github.com/mayank-singh-12/frontend_CovalentSales.git)

## Base API: https://backend-covalent-sales.vercel.app/

### GET /leads

Get all leads.<br>
Sample response:

```
[
  {
    _id: ...,
    name: ...,
    source: ...,
    salesAgent: { _id: ..., name: ..., email: ..., createdAt: ... },
    status: ...,
    tags: [...],
    timeToClose: ...,
    priority: ...,
    createdAt: ...,
    updatedAt: ...,
    closedAt: ...,
  }, ...
]
```

### GET /leads/:id

Get details for a lead.<br>
Sample response:

```
{
  _id: ...,
  name: ...,
  source: ...,
  salesAgent: { _id: ..., name: ..., email: ..., createdAt: ... },
  status: ...,
  tags: [...],
  timeToClose: ...,
  priority: ...,
  createdAt: ...,
  updatedAt: ...,
  closedAt: ...,
}

```

### GET /leads/:id/comments

Get all comments for a lead.<br>
Sample response:

```
[
  {
    _id: ...,
    lead: ...,
    author: ...,
    commentText: ...,
    createdAt: ...
  }, ...
]
```

### GET /tags

Get all tags.<br>
Sample response:

```
[
  {
    _id: ...,
    name: ...,
    createdAt: ...,
  }, ...
]
```

### GET /agents

Get all leads.<br>
Sample response:

```
[
  {
    _id: ...,
    name: ...,
    email: ...,
    createdAt: ...
  }, ...
]
```

### GET /agents/:id

Get an agent.<br>
Sample response:

```
{
    _id: ...,
    name: ...,
    email: ...,
    createdAt: ...
}
```

### GET /report/last-week

Get leads that were closed last week.<br>
Sample response:

```
[
  {
    _id: ...,
    name: ...,
    source: ...,
    salesAgent: { _id: ..., name: ..., email: ..., createdAt: ... },
    status: Closed,
    tags: [...],
    timeToClose: ...,
    priority: ...,
    createdAt: ...,
    updatedAt: ...,
    closedAt: ...,
  }, ...
]
```

### GET /report/pipeline

Get count of leads that are still in pipeline.

```
{ totalLeadsInPipeline: ... }
```

### POST /leads

Create a new lead.<br>
Sample response:

```
{
  _id: ...,
  name: ...,
  source: ...,
  salesAgent: { _id: ..., name: ..., email: ..., createdAt: ... },
  status: Closed,
  tags: [...],
  timeToClose: ...,
  priority: ...,
  createdAt: ...,
  updatedAt: ...,
  closedAt: ...,
}
```

### POST /leads/:id/update

Update a lead.<br>
Sample response:

```
{
  _id: ...,
  name: ...,
  source: ...,
  salesAgent: { _id: ..., name: ..., email: ..., createdAt: ... },
  status: ...,
  tags: [...],
  timeToClose: ...,
  priority: ...,
  createdAt: ...,
  updatedAt: ...,
  closedAt: ...,
}
```

### POST /agents

Create a new agent.<br>
Sample response:

```
{
  message: "New Agent added!",
  newAgent: { _id: ..., name: ..., email: ..., createdAt: ... }
}
```

### POST /tags

Add a new tag.<br>
Sample response:

```
{
  _id: ...,
  name: ...,
  createdAt: ...,
}
```

### POST /leads/:id/comments

Add new comment to a lead.<br>
Sample response:

```
{
  message: "Comment added successfully!",
  comment: { _id: ..., lead: ..., author: ..., commentText: ..., createdAt: ... }
}
```

### DELETE /leads/:id

Delete a lead.<br>
Sample response:

```
{ message: "Lead deleted successfully." }
```

### DELETE /agents/:id

Delete a sales agent.<br>
Sample response:

```
{ message: "Sales Agent deleted successfully!" }
```

---

For bugs or feature request, please reach out to dev.by.mayank@gmail.com
