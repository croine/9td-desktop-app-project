# 9TD Task Dashboard - Usage Guide

## 🎨 Features Implemented

### ✨ Glassmorphism Design
- **Beautiful frosted glass effects** throughout the entire dashboard
- Backdrop blur and transparency for modern aesthetic
- Gradient backgrounds for depth and visual interest
- Applied to sidebar, header, cards, and all UI components

### 🎬 Animated Icons
- **Total Tasks**: Floating animation (gentle up/down movement)
- **Completed Tasks**: Pulse glow animation (glowing effect)
- **In Progress**: Rotating animation (continuous 360° spin)
- **Overdue Tasks**: Bounce-in animation (elastic entrance)
- Additional animations on dashboard elements (Zap, Flame, Calendar, etc.)

### 📱 Mobile Responsive
- Fully optimized for all screen sizes (mobile, tablet, desktop)
- Touch-friendly interface with proper spacing
- Responsive grid layouts that adapt to screen width
- Mobile-optimized text sizes and button layouts
- Horizontal scrolling for Kanban board on mobile

## 🚀 How to Use This Project

### Prerequisites
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Visual Studio Code** - [Download here](https://code.visualstudio.com/)
- **npm** or **bun** (comes with Node.js)

### Step 1: Open in Visual Studio Code
1. Open Visual Studio Code
2. Go to **File > Open Folder**
3. Select the project folder containing this README
4. VS Code will open the entire project

### Step 2: Install Dependencies
Open the **integrated terminal** in VS Code (`Ctrl+\`` or `View > Terminal`) and run:

```bash
npm install
# or if you prefer bun:
bun install
```

### Step 3: Run the Development Server
In the terminal, run:

```bash
npm run dev
# or
bun dev
```

The application will start at **http://localhost:3000**

### Step 4: Open in Browser
- Open your browser and go to `http://localhost:3000`
- You'll see your beautiful glassmorphism task dashboard! 🎉

## 🖥️ Desktop Application Options

This is already a **live web application** that runs in your browser. If you want to convert it to a native desktop app, you have two options:

### Option 1: Electron (Recommended for Desktop App)
Electron wraps your web app in a native desktop window:

```bash
npm install electron electron-builder --save-dev
```

Create `electron.js`:
```javascript
const { app, BrowserWindow } = require('electron')

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })
  
  win.loadURL('http://localhost:3000')
}

app.whenReady().then(createWindow)
```

### Option 2: Tauri (Lighter Alternative)
Tauri is a lighter alternative to Electron using Rust:

```bash
npm install @tauri-apps/cli @tauri-apps/api --save-dev
npx tauri init
```

### Option 3: Progressive Web App (PWA)
Convert to a PWA that can be installed on desktop/mobile without app stores.

## 📂 Project Structure

```
9TD-Task-Dashboard/
├── src/
│   ├── app/                  # Next.js pages
│   │   ├── page.tsx         # Main dashboard page
│   │   ├── layout.tsx       # Root layout
│   │   └── globals.css      # Global styles with glassmorphism
│   ├── components/          # React components
│   │   ├── Dashboard.tsx    # Main dashboard with animated icons
│   │   ├── TaskCard.tsx     # Glassmorphism task cards
│   │   ├── KanbanBoard.tsx  # Drag-and-drop board
│   │   └── ui/              # Reusable UI components
│   ├── lib/                 # Utilities and storage
│   └── types/               # TypeScript types
├── public/                  # Static assets
├── package.json            # Dependencies
└── README-USAGE.md         # This file
```

## 🎯 Key Features

### Dashboard View
- **Glassmorphism stat cards** with animated icons
- Real-time task statistics
- Today's focus section
- Productivity streak tracker
- Weekly productivity chart
- Completion rate progress

### Task Management
- **Create, edit, delete tasks**
- Subtasks with progress tracking
- Priority levels (low, medium, high, urgent)
- Status tracking (todo, in-progress, review, completed)
- Due dates and assignees
- Tags and categories with colors

### Kanban Board
- Drag-and-drop functionality
- Four columns: To Do, In Progress, Review, Completed
- Visual task organization
- Mobile-responsive horizontal scroll

### Mobile Experience
- Touch-optimized interface
- Responsive layouts for all screen sizes
- Readable text at any viewport size
- Easy navigation on small screens

## 🎨 Glassmorphism Customization

The glassmorphism effects are defined in `src/app/globals.css`:

```css
.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
}
```

You can adjust:
- `background` opacity for more/less transparency
- `backdrop-filter blur()` for sharper/softer blur
- `border` opacity for stronger/softer edges
- `box-shadow` for depth

## 🎬 Animation Customization

Animations are also in `globals.css`:

```css
.animate-float { animation: float 3s ease-in-out infinite; }
.animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
.animate-rotate { animation: rotate-360 3s linear infinite; }
.animate-bounce-in { animation: bounce-in 0.6s cubic-bezier(...); }
```

Adjust the duration (e.g., `3s` to `5s`) to make animations slower/faster.

## 💡 Tips

1. **Dark Mode**: Toggle in Settings → Theme → Dark/Light/System
2. **Data Persistence**: All data is stored in browser localStorage
3. **Export Data**: Use browser dev tools → Application → Local Storage to backup
4. **Performance**: Glassmorphism effects work best on modern browsers (Chrome, Edge, Safari, Firefox)

## 🐛 Troubleshooting

### Port Already in Use
If port 3000 is busy:
```bash
npm run dev -- -p 3001
```

### Glassmorphism Not Working
- Ensure your browser supports `backdrop-filter`
- Check if hardware acceleration is enabled
- Try Chrome/Edge for best compatibility

### Build for Production
```bash
npm run build
npm run start
```

## 📚 Tech Stack

- **Framework**: Next.js 15 (React 19)
- **Styling**: Tailwind CSS v4 with custom glassmorphism
- **Animations**: Framer Motion + CSS animations
- **UI Components**: Shadcn/UI (Radix UI primitives)
- **Icons**: Lucide React
- **Type Safety**: TypeScript
- **Storage**: Browser localStorage

## 🎉 You're All Set!

Your glassmorphism task dashboard is now ready to use! The project is:
- ✅ Already a live web application
- ✅ Runs in Visual Studio Code
- ✅ Uses React (via Next.js)
- ✅ Mobile-friendly and responsive
- ✅ Beautiful glassmorphism design
- ✅ Animated icons throughout

Enjoy your stunning task management dashboard! 🚀
