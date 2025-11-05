# 🎯 9TD Task Dashboard

<div align="center">

![9TD Logo](https://img.shields.io/badge/9TD-Professional_Edition-8b5cf6?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=for-the-badge&logo=tailwind-css)

**A beautiful, professional-grade task management desktop application with 3D animations**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](DOCUMENTATION.md) • [Screenshots](#-screenshots)

</div>

---

## ✨ Features

### 🎨 **Stunning UI/UX**
- **3D Animated Title**: Eye-catching rotating 9TD logo with gradient effects
- **Bright Professional Theme**: Cozy, modern design with perfect color harmony
- **Smooth Animations**: Framer Motion powered transitions and micro-interactions
- **Responsive Layout**: Desktop-optimized with sidebar navigation

### 📋 **Advanced Task Management**
- Create, edit, and delete tasks with rich metadata
- Priority levels: Low, Medium, High, Urgent
- Status tracking: Todo, In Progress, Review, Completed, Cancelled
- Due date management with overdue alerts
- Multi-user assignee support
- Detailed descriptions and notes

### 🏷️ **Smart Organization**
- **Tags**: Flexible labeling with custom colors (#Bug, #Feature, etc.)
- **Categories**: Hierarchical organization with emoji icons (💻 Development, 🎨 Design)
- **Color-coded System**: Visual identification at a glance
- **Unlimited Combinations**: Mix and match tags/categories per task

### 🔍 **Powerful Search & Filtering**
- Real-time text search across titles and descriptions
- Multi-criteria filtering (priority, status, tags, categories)
- Visual filter chips with one-click removal
- Instant results with no lag

### 📊 **Analytics Dashboard**
- Task completion rate with progress bars
- Priority breakdown visualization
- Upcoming deadlines calendar view
- Category and tag usage statistics
- System health monitoring

### 📝 **Activity Logging**
- Complete audit trail of all operations
- Action types: Created, Updated, Deleted, Status Changed
- Timestamp tracking with relative time display
- Automatic log retention (last 500 entries)

### 🎛️ **Owner Panel**
- Tag management with color customization
- Category management with icon selection
- 16 preset colors + custom color picker
- Real-time analytics and storage metrics

### ⚙️ **Settings & Preferences**
- Theme selection (Light/Dark/System)
- View modes (Grid/List)
- Compact mode for dense displays
- Notification toggles
- Data export (JSON backup)
- Clear all data option

### 💾 **Local Storage Persistence**
- All data stored in browser LocalStorage
- No server required - runs completely offline
- Automatic save on every action
- Export/import capabilities

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone or download the project
cd your-project-directory

# Install dependencies
npm install
# or
bun install
```

### Development

```bash
# Start development server
npm run dev
# or
bun dev

# Open http://localhost:3000 in your browser
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 📖 Usage

### Getting Started

1. **Launch the app** - Open http://localhost:3000
2. **Explore the Dashboard** - View your task overview and statistics
3. **Create your first task** - Click "Create Task" or use the sidebar
4. **Organize** - Add tags and categories to your tasks
5. **Filter & Search** - Use the search bar to find specific tasks
6. **Track Progress** - Update task statuses as you work

### Key Actions

| Action | How To |
|--------|--------|
| Create Task | Sidebar → Create Task → Fill form → Create |
| Edit Task | Your Tasks → Click ⋮ → Edit Task |
| Delete Task | Your Tasks → Click ⋮ → Delete Task |
| Filter Tasks | Your Tasks → Filters button → Select criteria |
| Manage Tags | Owner Panel → Tags tab → Add/Edit/Delete |
| View Analytics | Dashboard or Owner Panel → Analytics tab |
| Export Data | Settings → Data Management → Export All Data |

---

## 🎨 Screenshots

### Dashboard View
Beautiful analytics with task statistics, completion rates, and upcoming deadlines.

### Task Management
Grid layout with colorful cards showing priority, status, tags, and categories.

### Owner Panel
Comprehensive tag and category management with visual customization.

### Activity Logs
Complete audit trail with timestamps and action types.

---

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn/UI + Radix UI
- **Animations**: Framer Motion
- **Date Handling**: date-fns
- **Notifications**: Sonner (Toast)
- **Storage**: Browser LocalStorage API

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main app component
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles & theme
├── components/
│   ├── AnimatedTitle.tsx     # 3D animated header
│   ├── Sidebar.tsx           # Navigation sidebar
│   ├── Dashboard.tsx         # Analytics dashboard
│   ├── TaskCard.tsx          # Individual task
│   ├── TaskList.tsx          # Task grid/list
│   ├── CreateTaskModal.tsx   # Task form modal
│   ├── SearchBar.tsx         # Search & filters
│   ├── ActivityLog.tsx       # Activity logs
│   ├── OwnerPanel.tsx        # Tag/category mgmt
│   ├── Settings.tsx          # App settings
│   └── ui/                   # Shadcn components
├── types/
│   └── task.ts               # TypeScript types
└── lib/
    └── storage.ts            # LocalStorage API
```

---

## 🔧 Configuration

### Default Tags (6 pre-configured)
- 🐛 Bug (Red)
- ✨ Feature (Blue)
- 🚀 Enhancement (Purple)
- 📚 Documentation (Teal)
- ⚠️ Urgent (Orange)
- 🎨 Design (Pink)

### Default Categories (6 pre-configured)
- 💻 Development (Blue)
- 🎨 Design (Pink)
- 📢 Marketing (Teal)
- 💰 Sales (Orange)
- 🛟 Support (Purple)
- 🔬 Research (Cyan)

---

## 💾 Data Storage

All data is stored locally in your browser using LocalStorage:

- **Tasks**: `ntd_tasks`
- **Tags**: `ntd_tags`
- **Categories**: `ntd_categories`
- **Activity Logs**: `ntd_logs`
- **Settings**: `ntd_settings`

**Storage Capacity**: ~5-10MB (varies by browser)
**Estimated Capacity**: 2,500-5,000 tasks

---

## 📚 Documentation

For comprehensive documentation including:
- Detailed architecture explanation
- Complete API reference
- LocalStorage data schemas
- User guide and tutorials
- Troubleshooting tips

See [DOCUMENTATION.md](DOCUMENTATION.md)

---

## 🎯 Features Checklist

- ✅ Advanced task management (CRUD operations)
- ✅ Priority and status tracking
- ✅ Tags and categories with colors
- ✅ Due date management
- ✅ Search and advanced filtering
- ✅ Real-time dashboard analytics
- ✅ Activity logging system
- ✅ Owner panel for customization
- ✅ Settings and preferences
- ✅ LocalStorage persistence
- ✅ Data export/import
- ✅ 3D animated title
- ✅ Bright professional UI theme
- ✅ Toast notifications
- ✅ Responsive design
- ✅ Comprehensive documentation

---

## 🐛 Troubleshooting

**Tasks not saving?**
- Ensure LocalStorage is enabled in browser settings
- Check browser storage quota hasn't been exceeded

**UI not updating?**
- Hard refresh: `Ctrl/Cmd + Shift + R`
- Clear browser cache

**Performance issues?**
- Enable compact mode in Settings
- Archive or delete old completed tasks
- Check browser console for errors

---

## 🤝 Contributing

This is a demonstration project showcasing modern web development practices with Next.js, TypeScript, and Shadcn/UI.

---

## 📄 License

This project is provided as-is for demonstration purposes.

---

## 🌟 Highlights

- **Zero Configuration**: Works out of the box
- **No Backend Required**: Fully client-side
- **Privacy First**: All data stays in your browser
- **Fast**: Instant operations with no network delay
- **Beautiful**: Modern, professional design
- **Powerful**: Enterprise-grade features

---

<div align="center">

**Built with ❤️ using Next.js, TypeScript, and Shadcn/UI**

[📖 Read Full Documentation](DOCUMENTATION.md) | [🐛 Report Issues](#) | [✨ Request Features](#)

</div>
