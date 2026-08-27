## Mezban — AI-Powered Restaurant Management & Customer Service Platform

# What is Mezban?

**Mezban** is a full-stack restaurant management and AI customer-service platform designed to help restaurants manage their daily operations while providing customers with an intelligent conversational experience through Telegram.

The system combines a restaurant dashboard with an AI agent layer that can understand customer requests, retrieve restaurant-specific information, take food orders, track orders, handle customer complaints, and escalate requests to human staff when AI cannot safely resolve them.

The platform uses **Zaika** as the restaurant/business in the current system.

### What the System Does

Mezban provides two major sides:

### Restaurant Dashboard

Restaurant staff can manage:

* Business information
* Business knowledge
* Operating hours
* Menu categories
* Menu items
* Deals
* Customers
* Orders
* Order statuses
* Reservations
* Customer conversations
* Escalated customer requests
* Business analytics
* AI analytics

### Customer AI Assistant

Customers communicate with the restaurant through Telegram.

The AI assistant can:

* Welcome new and returning customers
* Answer restaurant-related questions
* Provide menu information
* Show available food items
* Show available deals
* Provide food prices
* Explain delivery information
* Explain payment methods
* Take food orders
* Collect customer delivery information
* Reuse previous delivery information when appropriate
* Ask for confirmation before placing an order
* Track orders
* Handle eligible order cancellations
* Escalate requests that require human intervention
* Handle customer complaints
* Provide restaurant information
* Provide operating hours
* Handle reservation-related requests according to the current reservation policy

---

# Tech Stack

## Frontend

* **Next.js 16.2.12**
* **React**
* **Tailwind CSS**
* **shadcn/ui**
* **Redux Toolkit**
* **Axios**
* **TanStack Query**
* **React Hook Form**
* **Zod**

## Backend

* **Node.js**
* **Express.js**
* **Prisma ORM**
* **PostgreSQL**
* **pgvector**

## Authentication

* **Clerk**

The frontend uses Clerk authentication while the backend validates authenticated requests and associates users with their businesses.

## Database

* **PostgreSQL**
* **Prisma ORM**
* **pgvector**

The database stores restaurant data, customers, orders, reservations, conversations, AI executions, tool executions, and RAG knowledge.

## Customer Communication

* **Telegram Bot API**

Telegram is used as the customer-facing communication channel.

---

# AI Layer

Mezban uses the **Google Agent Development Kit (ADK)** to build and orchestrate the restaurant AI system.

The AI layer is designed around specialized agents rather than using one agent to handle every operation.

### AI Architecture

```text
Customer
   │
   ▼
Telegram
   │
   ▼
Root Agent
   │
   ├── General Agent
   ├── Order Agent
   ├── Reservation Agent
   └── Support Agent
          │
          ▼
       Tools
          │
          ▼
 PostgreSQL / RAG / Business Data
```

## LLM

The system uses Google's Gemini models through the Google ADK integration.

The configured model can be controlled through the backend environment configuration.

---

# Agents

## Root Agent

The **Root Agent** acts as the orchestrator.

Its primary responsibility is to understand the customer's intent and transfer the request to the appropriate specialized agent.

It handles routing for:

* General information
* Food information
* Menu requests
* Deals
* Orders
* Reservations
* Complaints
* Customer support

The Root Agent does not perform restaurant operations itself.

---

## General Agent

The **General Agent** handles general restaurant information and customer greetings.

It handles:

* Greetings
* Restaurant information
* Restaurant story
* Food variety
* Cuisine information
* Delivery information
* Payment information
* Operating hours
* Reservation policy
* Contact information
* Location information
* General restaurant questions

The General Agent uses the RAG knowledge base and business-information tools when required.

---

## Order Agent

The **Order Agent** handles food ordering and order-related operations.

It handles:

* Menu search
* Menu item information
* Menu item availability
* Deal search
* Deal information
* Creating orders
* Order confirmation
* Order tracking
* Previous orders
* Order cancellation
* Delivery information collection
* Payment method collection

The Order Agent also validates that menu items and deals are currently available before allowing them to be ordered.

### Order Statuses

Orders use the following statuses:

```text
PENDING
CONFIRMED
PREPARING
OUT_FOR_DELIVERY
COMPLETED
CANCELLED
```

Completed and cancelled orders cannot be changed to another status.

---

# Reservation Agent

The **Reservation Agent** is responsible for reservation-related functionality.

It supports:

* Table availability
* Reservation creation
* Reservation status
* Reservation cancellation

The reservation functionality remains part of the system architecture and database.

---

# Support Agent

The **Support Agent** handles customer complaints and support requests.

It can:

* Ask the customer to explain their complaint
* Record the customer's complaint
* Provide a short acknowledgement
* Escalate issues that require human intervention
* Route unresolved customer problems to restaurant staff

---

# RAG — Retrieval-Augmented Generation

Mezban uses a RAG architecture for restaurant-specific knowledge.

Restaurant knowledge is stored in PostgreSQL and represented through knowledge documents and knowledge chunks.

The system uses **pgvector** for vector embeddings.

### Knowledge Types

The database supports knowledge for:

* Business information
* Food information
* Delivery
* Payment
* Reservations
* Operating hours

The AI retrieves relevant restaurant knowledge before answering applicable information requests.

This prevents the AI from relying on generic knowledge when answering restaurant-specific questions.

---

# Restaurant Data

The current system manages the following restaurant information:

* Business profile
* Business identity
* Address
* Phone
* Email
* Website
* Operating hours
* Food variety
* Delivery information
* Payment information
* Reservation information

The current restaurant/business is:

**Zaika**

---

# Menu Management

Restaurant staff can manage:

* Categories
* Menu items
* Prices
* Descriptions
* Images
* Availability

### Menu Item Status

```text
AVAILABLE
UNAVAILABLE
```

The AI must only present and offer menu items that are currently available.

Unavailable menu items must not be offered for ordering.

---

# Deal Management

Restaurant staff can create and manage deals.

Deals contain:

* Name
* Description
* Price
* Image
* Included menu items
* Availability status

### Deal Status

```text
ACTIVE
INACTIVE
```

The AI only presents active deals to customers.

Inactive deals must never be presented as available offers or included in new orders.

---

# Order Management

Restaurant staff can view and manage customer orders from the dashboard.

Each order contains:

* Order number
* Customer
* Order items
* Menu items
* Deals
* Quantity
* Prices
* Subtotal
* Tax
* Shipping
* Total
* Order type
* Payment information
* Delivery address
* Customer notes
* Current order status

### Supported Order Types

```text
DELIVERY
PICKUP
DINE_IN
```

### Order Processing

The AI collects the required information before creating an order.

The customer receives a final confirmation containing:

* Items/deals being ordered
* Quantities
* Delivery information
* Payment method
* Total amount

The order is created only after the customer confirms it.

---

# Customer Management

Mezban maintains customer records for each restaurant.

Customer information can include:

* Name
* Phone number
* Email
* Telegram chat ID
* Telegram user ID
* Username
* First name
* Last name
* Language
* Previous orders
* Reservations
* Conversations

Previous order information can be used by the Order Agent to make the ordering process faster.

For returning customers, the agent can ask whether the previously used delivery information should be reused or modified before proceeding with the order.

---

# Conversations

The dashboard provides a conversation management system for customer conversations.

Staff can:

* View customer conversations
* Read customer messages
* Read AI responses
* View agent activity
* View escalations
* Send messages to customers
* Resolve escalated conversations

Conversation records are stored in PostgreSQL.

---

# Human Escalation

Mezban supports human-in-the-loop escalation.

When an AI agent cannot safely complete an operation, the conversation can be escalated to restaurant staff.

Examples include:

* Cancelling an order that is already being prepared
* Customer complaints requiring staff intervention
* Requests that cannot be safely resolved automatically
* Operational issues requiring a human decision

The dashboard provides an escalation panel where staff can review the request and take action.

For supported escalation types, staff can accept or reject the customer's request.

The customer is notified of the staff decision.

Human staff can also send a direct message to the customer from the conversation interface.

---

# Analytics

Mezban provides two major analytics areas.

## Business Analytics

Business analytics provides operational insights such as:

* Order performance
* Sales information
* Category performance
* Order statistics
* Business activity

The analytics are generated from actual database records rather than static frontend data.

## AI Analytics

AI analytics provides information about the AI system, including:

* Total conversations
* AI-resolved conversations
* AI-generated orders
* Resolution rate
* Conversation volume
* Intent distribution
* Agent usage
* Agent performance
* AI resolution information

These analytics are calculated from conversation, agent, order, and agent execution data stored in PostgreSQL.

---

# AI Execution Tracking

Mezban tracks AI execution through dedicated database records.

## AgentRun

Records an AI agent execution, including:

* Business
* Conversation
* Agent
* User message
* Final response
* Execution status
* Start time
* Completion time

## ToolExecution

Records individual tool executions, including:

* Tool name
* Input
* Output
* Status
* Error information
* Execution time

This provides visibility into how the AI handled each customer request.

---

# Database Architecture

The core database entities include:

```text
User
Business
BusinessKnowledge
BusinessHour
TelegramConfig

Category
MenuItem
Deal
DealItem

Customer
Order
OrderItem
Reservation

Conversation
Message

AgentRun
ToolExecution

KnowledgeDocument
KnowledgeChunk
```

The database uses Prisma ORM with PostgreSQL.

Vector embeddings for RAG knowledge are stored using PostgreSQL's `pgvector` extension.

---

# Backend API Architecture

The backend follows a modular Express architecture.

Major backend responsibilities include:

* Authentication
* Business management
* Menu management
* Category management
* Deal management
* Customer management
* Order management
* Reservation management
* Conversation management
* AI processing
* RAG retrieval
* Analytics
* Telegram integration
* Agent execution tracking
* Escalation handling

The backend acts as the source of truth for persistent restaurant and customer data.

---

# Frontend Dashboard

The Next.js dashboard provides restaurant staff with interfaces for:

```text
Dashboard
├── Business Analytics
├── AI Analytics
├── Orders
├── Menu
├── Categories
├── Deals
├── Customers
├── Conversations
├── Business Profile
├── Business Knowledge
├── Telegram Integration
└── My Profile
```

All major dashboard pages are connected to backend APIs and use database-backed data.

---

# Data Flow

A typical customer request follows this flow:

```text
Customer
   │
   ▼
Telegram
   │
   ▼
Backend
   │
   ▼
Conversation / Customer Context
   │
   ▼
Root Agent
   │
   ▼
Intent Routing
   │
   ▼
Specialized Agent
   │
   ├── RAG Tool
   ├── Menu Tools
   ├── Deal Tools
   ├── Order Tools
   ├── Customer Tools
   ├── Reservation Tools
   └── Business Tools
           │
           ▼
      PostgreSQL
           │
           ▼
     Agent Response
           │
           ▼
       Telegram
```

---

# Core Principles

Mezban follows several important principles:

* **Database as the source of truth**
* **Restaurant-specific RAG knowledge**
* **Specialized AI agents**
* **Tool-based operations**
* **Availability-aware menu and deals**
* **Human escalation when required**
* **Persistent conversation history**
* **AI execution tracking**
* **Real backend data for analytics**
* **Telegram-based customer interaction**

---

# Project Identity

**Project Name:** Mezban

**Current Restaurant:** Zaika

**Platform Type:** AI-Powered Restaurant Management & Customer Service Platform

**AI Framework:** Google Agent Development Kit (ADK)

**LLM:** Gemini

**Backend:** Node.js + Express

**Frontend:** Next.js + React

**Database:** PostgreSQL + Prisma + pgvector

**Customer Channel:** Telegram
