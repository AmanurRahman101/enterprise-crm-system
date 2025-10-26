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

* **Create a Single Source of Truth:** Consolidate all customer information and interactions (contacts, deals, tickets, calls, chats) into one unified profile.  
* **Increase Sales Efficiency:** Streamline the sales process by providing a clear, visual pipeline and task management tools.  
* **Improve Customer Support:** Reduce ticket resolution time by managing all support channels (phone, email, app, Telegram) from one inbox.  
* **Enhance Communication:** Modernize and log all communication through built-in VoIP calling and chat integrations.  
* **Empower Mobile Teams:** Give employees on-the-go access to essential CRM data and functions via a dedicated native Android app.

## 