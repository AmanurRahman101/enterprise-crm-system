# **Product Requirements Document (PRD)**

# **Project Name:Tawasol CRM**

| Document Status | Draft |
| :---- | :---- |
| **Version** | 1.2 |
| **Last Updated** | October 26, 2025 |

## 

## **1.Project Vision**

The **Project Vision** describes the ultimate "why" behind Tawasol CRM. It sets a high-level goal that goes far beyond just building another customer database.

* **Traditional CRM as a "System of Record":** Most standard CRMs are *passive*. They are essentially digital filing cabinets. A salesperson has a call, then they must go into the CRM and manually enter notes about that call. The CRM *records* what happened, but it doesn't *do* anything with that information on its own. It relies 100% on the user to input data and then remember to look it up later.  
* **Tawasol's Vision as an "Intelligent System of Action":** Tawasol is envisioned as an *active* partner. It's designed to be a "system of action," meaning it actively works *for* the user to make their job easier and more effective.  
  * Instead of just *storing* a customer's support ticket (recording), the system *proactively enhances engagement* by automatically showing that ticket to a sales rep before they make their next call.  
  * Instead of just *holding* a list of tasks, its "powerful automation" would automatically schedule a follow-up reminder in the user's Google Calendar.  
  * The "AI-driven insights" move it from *reactive* to *proactive*. A traditional CRM can tell you *what* happened. An intelligent CRM tells you *what is likely to happen next* (e.g., "This customer's activity has dropped 50%, suggesting they are at risk of churning") and *what you should do about it* (e.g., "Here is a suggested talking point for your next call").

In short, the vision is to create a platform that reduces manual work and provides intelligent guidance, allowing employees to focus on the *relationship* with the customer, not the data entry.

###     	**1.1 Problem Statement**

This section defines the specific, tangible pains that Tawasol CRM is being built to solve. These problems are what justify the project's existence.

* **Data Fragmentation:** This is the "too many tabs" problem.  
  * **Detailed Example:** A support agent is handling an angry email from a client (in **Gmail**). At the same time, a salesperson, unaware of the email, makes a "friendly check-in" call (using their **VoIP phone**). Meanwhile, a project manager has a deliverable for this client due next week (in **Jira** or a **calendar**).  
  * **The Pain:** None of these employees have the full picture. The salesperson looks uninformed, the support agent is working without context, and the client becomes frustrated because they have to repeat themselves to different people. The "customer view" is incomplete and "fragmented" across 3-4 different, disconnected apps.  
* **Process Rigidity:** This is the "my software makes me work *its* way" problem.  
  * **Detailed Example:** A traditional CRM might have a rigid, unchangeable "sales process" that requires a 20-field form to be filled out to create a new "Lead."  
  * **The Pain:** A busy salesperson on the road (using a mobile app) doesn't have time for this. They just met someone and want to quickly add a name and phone number. The *rigid process* gets in the way of *actual work*. Tawasol aims to be "adaptable," meaning the workflow can be simplified or changed to match how the team *actually* operates, not the other way around.  
* **Administrative Overhead:** This is the "I spend more time logging my work than *doing* my work" problem.  
  * **Detailed Example:** A support agent spends 8-10 minutes *after every single call* manually typing up call notes, logging the call duration, creating a follow-up task, and updating the ticket status.  
  * **The Pain:** If they take 10 calls a day, that's over 90 minutes (1.5 hours) spent *just on data entry*. This is valuable time that could have been spent solving more customer problems. This "manual data entry" is a direct drain on efficiency and employee morale.

  ### 

  ### 

  ### **1.2 Solution Overview**

This section directly answers the problems from 1.1 by explaining *how* the vision from 1.0 will be achieved. It's the bridge between the "why" and the "what."

* **Solving Data Fragmentation with a "Single Ecosystem":**  
  * The core of the solution is **centralization**. By "integrating with tools like Gmail, Google Calendar, Telegram, Jira, and LinkedIn," Tawasol pulls all those fragmented pieces of data into *one place*.  
  * **The Result:** When that sales rep opens the client's profile, they *will* see the angry email from Gmail and the open support ticket from Telegram right in the customer's timeline. This "seamless data flow" creates the "Single Source of Truth" and gives every employee a complete, 360-degree view of the customer.  
* **Solving Process Rigidity & Admin Overhead with "AI-Powered Automation":**  
  * This is the "intelligent" part of the vision in action. It directly attacks the "administrative overhead" problem.  
  * **Example (Reduces manual effort):** When the support agent finishes their call, Tawasol will have *already* logged that the call happened, and the AI will analyze the transcript to *automatically* summarize the call and suggest a follow-up task. The 8-10 minutes of manual work is reduced to 30 seconds of review.  
  * **Example (Provides predictive insights):** The AI doesn't just store data; it analyzes it. It can provide insights like "This sales deal has been in the 'Proposal' stage for 30 days, which is 20 days longer than average. Would you like to schedule a follow-up?" This helps the team focus on the right tasks at the right time, solving the "rigidity" problem by offering intelligent, flexible suggestions instead of forcing a strict process.

## 

## 

## **2\. Product Goals & Objectives**

The primary goals for this product are:

###  **Create a Single Source of Truth**

* **What this means:** This goal directly solves the "Data Fragmentation" problem. It means that any employee, whether in sales, support, or management, can look at a single customer profile and see *every* interaction that has ever happened with them.  
* **Why it matters:** Without this, a sales rep might try to upsell a customer who is already angry about an unresolved support ticket. This is a terrible customer experience. By consolidating contacts, deals, tickets, calls, and chats into one unified view ,Tawasol ensures every employee has the complete context. This prevents mistakes, builds trust, and allows for truly personal and intelligent interactions.

  ###  **Increase Sales Efficiency**

* **What this means:** This goal is about making the sales team faster and more effective. "Streamline the sales process" means removing unnecessary clicks, data entry, and administrative work that slows salespeople down.  
* **Why it matters:** A salesperson's most valuable skill is building relationships and closing deals, not filling out forms. By providing a "clear, visual pipeline" , a sales manager can instantly see where every deal is stuck and how to help. The "task management tools" ensure that no follow-up is ever missed. This goal directly impacts revenue by giving the sales team more time to actually sell.

  ###  **Improve Customer Support**

* **What this means:** This objective is focused on the helpdesk. The key metric for success here is "reduce ticket resolution time." It's about solving customer problems faster.  
* **Why it matters:** Fast, efficient support is a key driver of customer loyalty. The "one inbox" approach  is the core of this. It stops support agents from having to jump between Gmail, the Telegram app, and a separate phone system. By funneling all support channels (phone, email, app, Telegram) into one unified queue, agents can work through issues systematically, and managers can track performance easily.

  ###  **Enhance Communication**

* **What this means:** This goal has two parts: "modernize" and "log."  
  1. **Modernize:** This means moving beyond just email and phone calls. It involves integrating the channels customers actually use, like chat and in-app communication .  
  2. **Log:** This is the most critical part. If a communication isn't logged in the CRM, it's invisible to the rest of the company.  
* **Why it matters:** By building VoIP calling and chat *into* Tawasol, every conversation is automatically captured and attached to the correct customer record. This feeds directly back into the primary goal of creating a "Single Source of Truth." It stops valuable information from being lost in an employee's private phone logs or chat history.

  ###  **Empower Mobile Teams**

* **What this means:** This objective recognizes that work doesn't just happen at a desk. It's about giving employees who are "on-the-go" (like field sales reps, service technicians, or managers) the power to do their jobs from their phones.  
* **Why it matters:** A sales rep who finishes a meeting needs to update the deal status *immediately*, while the details are fresh. If they have to wait until they are back at their laptop, the data becomes stale and often forgotten. The native Android app is the solution. It empowers employees to access customer data, manage deals, and complete tasks from anywhere, making the entire CRM more accurate and up-to-date.


## 

## **3\. Target Market & Audience**

 Tawasol CRM is designed to serve a wide range of users across industries and business   sizes:

*  **Enterprise B2B Organizations** : managing complex, multi-stakeholder sales cycles.  
* **High-Volume B2C Operations** : requiring efficient management of thousands of customer interactions.  
*  **Small to Medium Enterprises** : seeking powerful yet affordable CRM capabilities.  
*  **Distributed & Remote Teams** : enabling real-time collaboration across geographies.  
* **Professional Freelancers** :managing clients, leads, and project pipelines in one place.

## 

## **4\. Features & Requirements**

Here is the information formatted into tables as requested.

### **Phase 1 — Core Platform & Integrated Communication**

**Objective:** To deliver a unified CRM ecosystem that centralizes customer data, communication channels, and operational workflows into a single, intuitive platform.

| Feature ID | Feature Name | Formal Description & Functional Scope | Key Benefits | Dependencies |
| :---- | :---- | :---- | :---- | :---- |
| 1.1 | Unified Contact Management | Enables a single, consolidated customer profile encompassing all contact details, organizational associations, and a chronological record of every interaction (emails, calls, tickets, chats). The system provides advanced filtering, segmentation, and search capabilities. | Eliminates data fragmentation, improves collaboration, and provides 360° visibility into customer relationships. | Gmail and VoIP API integrations. |
| 1.2 | Sales Pipeline Management | Provides a Kanban-style visual pipeline that tracks opportunities across customizable sales stages (e.g., Lead → Qualified → Proposal → Closed). Supports drag-and-drop functionality, probability weighting, and real-time revenue forecasting. | Enhances deal visibility, identifies process bottlenecks, and improves forecasting accuracy. |  |
| 1.3 | Task & Activity Management | Centralized task board allowing users to create, assign, and monitor activities linked to contacts or deals. Includes auto-logging of calls and emails, calendar synchronization, and reminder notifications. | Ensures accountability, prevents missed follow-ups, and aligns schedules with Google calendars. |  |
| 1.4 | Analytics & Dashboards | Pre-configured dashboards display core KPIs such as sales performance, deal closures, ticket resolution time, and agent activity. Interactive charts and export options (PDF, CSV) are included. | Delivers actionable insights for management through real-time analytics and visualized data trends. |  |
| 1.5 | Integrated Helpdesk System | A multi-channel ticketing platform that consolidates support requests from phone, email, mobile app into a unified queue. Includes SLA tracking, prioritization rules, and escalation workflows. We will try to integrate Jira here. | Reduces response latency, centralizes customer communication, and enhances support efficiency. |  |
| 1.6 | Tawasol Native Employee App (Android) | A native Android application offering mobile access to contacts, deals, tasks, and notifications. Includes offline functionality with auto-sync once connected. This Android application allows customers to raise new tickets, track existing ones.  | Equips field sales teams with real-time access, improves mobility, and increases productivity.  |  |

---

### 

### **Phase 2 — Advanced Analytics & Intelligent Automation**

**Objective:** To evolve Tawasol CRM from a system of record into a system of intelligence — empowering users through automation, AI-driven insights, and contextual assistance.

| Feature ID | Feature Name | Formal Description & Functional Scope | Key Benefits | Technology Stack |
| :---- | :---- | :---- | :---- | :---- |
| 2.1 | AI Chatbot (Internal Assistant) | An integrated conversational assistant enabling users to execute quick commands via text or voice (e.g., “Create a deal for Acme Corp worth $5,000”). Supports contextual understanding and role-based access control. | Reduces operational friction and simplifies CRM interactions. | NLP engine (OpenAI or equivalent). |
| 2.2 | AI Auto-Updating Records | Automatically interprets data from call transcripts, emails, and messages to update contact or deal records. The AI engine can infer changes in status, value, or next steps and enrich information from verified external sources. | Minimizes manual data entry, enhances data quality, and keeps records perpetually current. |  |
| 2.3 | AI Interaction Prep | Before each customer interaction, the system generates an AI-driven summary of the client’s history, sentiment analysis, and recommended talking points. | Improves agent preparedness, personalization, and efficiency. |  |
| 2.4 | Built-in App-to-App VoIP Calling | Integrates secure VoIP functionality allowing support agents to initiate in-app audio calls with customers (Tawasol-to-customer app). Calls are automatically logged and linked to the customer profile. | Minimizes communication costs, ensures complete conversation traceability, and accelerates issue resolution. |  |
| 2.5 | Telegram Bot Integration | Enables customers to interact with a dedicated Telegram bot to log tickets or send queries. Messages are automatically converted into support tickets within Tawasol. Agents can reply directly from the CRM interface. | Expands communication reach and provides a frictionless omnichannel experience. |  |

## 

## **5\. Assumptions & Dependencies**

* **Technical:** We have access to reliable APIs for Telegram, Google Calendar, and Gmail. We can source or build a stable VoIP infrastructure.  
* **User:** Employees have access to a modern web browser and a company-issued or BYOD Android device.  
* **Customer:** Customers are willing to download a self-service app or use Telegram for support.

## **6.Summary**

This document outlines the product requirements for **Tawasol CRM**, a platform envisioned as an "Intelligent System of Action". Unlike traditional CRMs that act as passive "Systems of Record", Tawasol is designed to be an active partner. Its core vision is to use AI and automation to proactively guide users and reduce manual work, allowing employees to focus on customer relationships rather than data entry.

The project addresses three primary business problems: **Data Fragmentation**, where customer data is scattered across disconnected tools like Gmail, Jira, and calendars, preventing a complete view; **Process Rigidity**, where inflexible software forces users into inefficient workflows ; and **Administrative Overhead**, which drains productivity as employees spend excessive time on manual tasks like logging calls.

Tawasol's solution is twofold. First, it will create a **Single Source of Truth** by integrating with essential tools like Gmail, Google Calendar, Telegram, and Jira. This will centralize all contacts, deals, tickets, and communications into one unified profile, providing every employee with a complete 360-degree customer view. Second, the platform will use **AI-powered Automation** to reduce administrative overhead and streamline processes, such as by unifying all support channels into one inbox and providing predictive insights.

Designed for a broad audience ranging from B2B enterprises to SMEs and freelancers , the product's primary goals are to create a single source of truth , increase sales efficiency with visual pipelines , improve customer support by reducing ticket resolution time , enhance communication by automatically logging all interactions , and empower mobile teams with a native Android application.

Development is planned in two phases. **Phase 1** builds the core platform, including unified contact management, a sales pipeline, an integrated helpdesk, task management, and the native Android app. **Phase 2** evolves the platform into a "system of intelligence" , adding an internal AI chatbot, AI-powered record updates, AI-driven interaction summaries, built-in VoIP calling, and a Telegram bot integration. The project assumes reliable API access for Google and Telegram and user adoption of Android devices.

---

## 

## 

>>>>>>> origin/development
