# Kanban-Board

Modern Kanban board application built with **Angular 21**, **Signals**, **Firebase Authentication** and **Cloud Firestore**.

The project was designed as a portfolio-ready frontend application with a strong focus on modern Angular architecture, clean UI structure, real-time data handling and a product-like user experience.

## Overview

Nocturnal Kanban is a dark themed task management app inspired by modern B2B product interfaces.  
Users can register, log in, continue as a guest and manage their own board with real-time updates.

Each authenticated user works on their own board. Data is stored in Firestore and protected with user-based security rules.

## Features

- Authentication with Firebase
  - Register with email and password
  - Login with email and password
  - Guest login for quick product testing
- User-based Firestore data ownership
  - Every board belongs to one specific user
  - Firestore rules protect access by `ownerId`
- Kanban board functionality
  - Create tasks
  - Edit tasks
  - Delete tasks
  - Move tasks with drag and drop
- Real-time updates with Firestore listeners
- Toast feedback states for create, update and delete actions
- Loading states during write operations
- Dark product-inspired UI
- Unit tests with Vitest

## Tech Stack

- Angular 21
- TypeScript
- Angular Signals
- Angular CDK Drag & Drop
- SCSS
- Firebase Authentication
- Cloud Firestore
- Vitest

## Architecture Notes

The application follows a structured feature-based approach.

### Example structure

- `src/app/core`
  - app shell
  - firebase client
  - shared core UI like toast feedback
- `src/app/features/auth`
  - authentication pages
  - auth service
  - auth models
- `src/app/features/kanban`
  - board page
  - dialogs
  - board store
  - Firestore query/command/seed services
  - models

### Data access split

Firestore logic is separated by responsibility:

- `BoardQueryService` → reads and realtime listeners
- `BoardCommandService` → create, update, delete, move
- `BoardSeedService` → initial board creation for new users

This keeps responsibilities focused and makes the codebase easier to maintain and test.

## Authentication and Data Model

### Auth

The app uses Firebase Authentication for:

- registered users
- anonymous guest sessions

### Firestore collections

- `boards`
- `columns`
- `tasks`

### Ownership model

Each board stores an `ownerId`.  
Columns and tasks are linked to a board via `boardId`.

This allows Firestore security rules to ensure that users can only read and modify their own data.

## Realtime Behavior

The board uses Firestore realtime listeners so UI updates happen automatically after data changes.

This means:

- no manual board reload after task creation
- no manual board reload after editing
- no manual board reload after drag and drop
- data stays reactive and closer to real product behavior

## UI / UX Focus

The UI was intentionally redesigned from a basic starter layout into a more polished dark product interface.

Focus points:

- strong visual hierarchy
- modern dark dashboard feeling
- consistent dialogs and forms
- feedback to users through toast notifications
- loading states during async actions

## Local Setup

### Requirements

- Node.js 20+
- npm 10+
- Angular CLI
- Firebase project with Authentication and Firestore enabled

### Install dependencies

```bash
npm install
```

### Start development server

```bash
ng serve
```

#### Open:
http://localhost:4200/

### Environment Setup:
## Create your Firebase environment configuration inside:
ts:
export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_AUTH_DOMAIN',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_STORAGE_BUCKET',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },
};

### Firebase Setup Notes
## To run the app properly, make sure your Firebase project includes:
	•	Authentication
	    •	Email/Password enabled
	•	Anonymous authentication enabled
	•	Cloud Firestore
	•	Firestore security rules deployed
	•	Required Firestore indexes created

### Build:
```bash
npm build
```

### Run Tests
## Unit tests are executed with Vitest:
```bash
npx vitest run
```
## If your Angular setup maps test execution through Angular CLI, you can also use:
```bash
ng test
```

### Current Status
## Implemented:
	•	authentication flow
	•	guest access
	•	board ownership
	•	Firestore rules
	•	realtime board updates
	•	drag and drop
	•	toast notifications
	•	write loading states
	•	unit tests for core services

### Author
Matthias Hammelehle
Frontend developer focused on modern Angular, TypeScript and scalable frontend architecture.
