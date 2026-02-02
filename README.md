# Mission Control

A real-time, high-performance dashboard for managing autonomous agents and complex task queues. Built with **Convex**, **React**, and **Tailwind CSS**, Mission Control provides a "Command Center" experience for monitoring and orchestrating operations.

## ✨ Features

- 🚀 **Real-time Synchronization**: Powered by Convex, every change (task moves, agent updates, comments) propagates instantly to all connected clients.
- 🤖 **Agent Oversight**: Monitor the status and activity of your agent roster (Jarvis, Friday, Shuri, etc.) in real-time.
- 📦 **Mission Queue**: A kanban-style overview of tasks categorized by status: Inbox, Assigned, In Progress, Review, and Done.
- 📡 **Live Activity Feed**: A streaming log of all operational events, comments, and status changes.
- 🔐 **Secure Access**: Integrated Convex Auth for secure terminal login and management.
- 📱 **Responsive Design**: Premium, centered layout that works seamlessly across all devices.

## 🛠 Tech Stack

- **Backend**: [Convex](https://convex.dev/) (Real-time Database, Functions, Auth)
- **Frontend**: [React](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Tabler Icons](https://tabler-icons.io/)

## 🚀 Getting Started

### 1. Initial Setup
Run the following commands to install dependencies and start the development environment:

```bash
bun install
bun dev
```

### 2. Seeding Data
To populate your local dashboard with the initial roster of agents and tasks, run the seed script:

```bash
npx convex run seed:run
```

### 3. Terminal Access
1. Open the app in your browser (usually `http://localhost:5173`).
2. Use the **Sign Up** flow to create your commander credentials.
3. Access the dashboard to start monitoring operations.

### Self-hosted Convex
If you are self-hosting Convex, see the setup guide in
[docs/convex-self-hosting.md](docs/convex-self-hosting.md).

## 📖 Learn More

- [Convex Documentation](https://docs.convex.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/)

---

*Mission Control // Secure Terminal Access // Ref: 2026*

