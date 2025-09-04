# Sidebar Navigation Component

A clean, responsive left sidebar navigation component for Next.js + Tailwind CSS dashboards.

## Features

- ✅ Fixed left sidebar (260px width on desktop)
- ✅ Collapsible on medium screens and up
- ✅ Mobile slide-over menu with overlay
- ✅ Active route highlighting
- ✅ NEW and count badges
- ✅ Keyboard accessible
- ✅ Responsive design
- ✅ TypeScript support

## Components

### 1. `<Sidebar />` - Main sidebar component

```tsx
import { Sidebar } from '@/components/Sidebar';

<Sidebar
  savedCount={15}           // Number for Saved Ideas count badge
  marketingIsNew={true}     // Boolean to show NEW badge on Marketing Ideas
  collapsed={false}         // Boolean for collapsed state
  onCollapse={() => {}}     // Function to handle collapse toggle
/>
```

### 2. `<DashboardLayout />` - Complete layout wrapper

```tsx
import { DashboardLayout } from '@/components/DashboardLayout';

<DashboardLayout savedCount={15} marketingIsNew={true}>
  <YourDashboardContent />
</DashboardLayout>
```

### 3. Mobile Components

```tsx
import { 
  MobileSidebar, 
  MobileSidebarToggle, 
  MobileSidebarOverlay 
} from '@/components/Sidebar';

// Mobile sidebar toggle button
<MobileSidebarToggle 
  isOpen={isOpen} 
  onToggle={toggleSidebar} 
/>

// Mobile sidebar with overlay
<MobileSidebar
  isOpen={isOpen}
  onClose={closeSidebar}
  savedCount={15}
  marketingIsNew={true}
/>
```

## Navigation Structure

### MAIN
- Dashboard → `/dashboard`

### IDEAS
- Business Ideas → `/ideas/business`
- Marketing Ideas → `/ideas/marketing` (shows NEW badge if `marketingIsNew={true}`)
- Saved Ideas → `/ideas/saved` (shows count badge if `savedCount > 0`)

### ACCOUNT
- Settings → `/settings`
- Logout → `/`
- Upgrade to Pro → `/`

## Usage Examples

### Basic Usage

```tsx
import { Sidebar } from '@/components/Sidebar';

function MyDashboard() {
  return (
    <div className="flex h-screen">
      <Sidebar savedCount={15} marketingIsNew={true} />
      <main className="flex-1 p-6">
        {/* Your dashboard content */}
      </main>
    </div>
  );
}
```

### With Layout Wrapper

```tsx
import { DashboardLayout } from '@/components/DashboardLayout';

function MyDashboard() {
  return (
    <DashboardLayout savedCount={15} marketingIsNew={true}>
      <div className="p-6">
        <h1>Dashboard Content</h1>
        {/* Your content */}
      </div>
    </DashboardLayout>
  );
}
```

### Custom Integration

```tsx
import { useSidebar } from '@/hooks/useSidebar';
import { Sidebar, MobileSidebar, MobileSidebarToggle } from '@/components/Sidebar';

function CustomDashboard() {
  const { isMobileOpen, isCollapsed, toggleMobile, closeMobile, toggleCollapse } = useSidebar();

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          savedCount={15}
          marketingIsNew={true}
          collapsed={isCollapsed}
          onCollapse={toggleCollapse}
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileOpen}
        onClose={closeMobile}
        savedCount={15}
        marketingIsNew={true}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden p-4 bg-white border-b">
          <MobileSidebarToggle isOpen={isMobileOpen} onToggle={toggleMobile} />
        </header>
        <main className="flex-1 p-6">
          {/* Your content */}
        </main>
      </div>
    </div>
  );
}
```

## Styling

The component uses Tailwind CSS classes and follows the design system:

- **Background**: `bg-gray-50` (light gray)
- **Active item**: `bg-gray-100` with rounded corners
- **Hover state**: `hover:bg-gray-50`
- **NEW badge**: Purple text on light purple background
- **Count badge**: Gray text on light gray background
- **Icons**: Lucide React icons (5x5 size)

## Accessibility

- ✅ Keyboard navigable with tab focus
- ✅ `aria-current="page"` on active items
- ✅ `aria-expanded` and `aria-controls` on mobile toggle
- ✅ Proper ARIA labels for screen readers
- ✅ Focus management

## Responsive Behavior

- **Desktop (md+)**: Fixed sidebar, collapsible
- **Mobile (<md)**: Slide-over menu with overlay
- **Tablet**: Same as desktop with collapsible option

## Props

### Sidebar Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `savedCount` | `number` | `0` | Number for Saved Ideas count badge |
| `marketingIsNew` | `boolean` | `false` | Show NEW badge on Marketing Ideas |
| `collapsed` | `boolean` | `false` | Collapsed state (icon-only) |
| `onCollapse` | `function` | - | Callback for collapse toggle |

### MobileSidebar Props

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Whether mobile sidebar is open |
| `onClose` | `function` | Callback to close mobile sidebar |
| `savedCount` | `number` | Same as Sidebar |
| `marketingIsNew` | `boolean` | Same as Sidebar |

## Customization

To customize the navigation items, edit the `navigation` array in `Sidebar.tsx`:

```tsx
const navigation = [
  {
    section: 'YOUR_SECTION',
    items: [
      {
        href: '/your-route',
        icon: YourIcon,
        label: 'Your Label',
        badge: { type: 'new', value: 'NEW' }, // Optional
      },
    ],
  },
];
```
