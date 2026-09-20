---
name: school-saas-nextjs-frontend
description: >-
  Best practices and conventions for the Next.js 15 frontend with TailwindCSS in
  the School SaaS project. Use when creating or modifying any page, component,
  layout, hook, or API client in apps/web/. Covers App Router patterns, component
  architecture, TailwindCSS design system, form handling, data fetching, and
  responsive design conventions.
---

# Next.js Frontend — Best Practices & Conventions

## App Router Structure

```
app/
├── (auth)/                     # Auth group (no layout chrome)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── layout.tsx              # Minimal centered layout
├── (dashboard)/                # Dashboard group (sidebar + header)
│   ├── layout.tsx              # Sidebar + Header + Breadcrumbs
│   ├── overview/page.tsx       # Dashboard home
│   ├── students/
│   │   ├── page.tsx            # Student list
│   │   ├── new/page.tsx        # Create student form
│   │   └── [id]/page.tsx       # Student detail/edit
│   ├── teachers/...
│   ├── sections/...
│   ├── subjects/...
│   ├── attendance/...
│   ├── rfid-devices/...
│   ├── users/...
│   └── settings/...
├── layout.tsx                  # Root layout (html, body, fonts, providers)
└── page.tsx                    # Landing page
```

## Component Architecture

### Component Folder Structure
```
components/
├── ui/                         # Generic, reusable UI primitives
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── modal.tsx
│   ├── data-table.tsx
│   ├── badge.tsx
│   ├── card.tsx
│   ├── toast.tsx
│   ├── dropdown-menu.tsx
│   ├── avatar.tsx
│   ├── skeleton.tsx
│   └── pagination.tsx
├── layout/
│   ├── sidebar.tsx
│   ├── header.tsx
│   ├── breadcrumbs.tsx
│   └── mobile-nav.tsx
└── forms/
    ├── student-form.tsx
    ├── teacher-form.tsx
    └── section-form.tsx
```

### Component Rules
- **UI components** are generic, zero business logic, fully reusable
- **Form components** combine UI components + validation + API calls
- **Page components** (`page.tsx`) compose form/layout/UI components
- Always export components as named exports, not default
- Use `'use client'` only when necessary (event handlers, hooks, browser APIs)

## TailwindCSS v4 Design System

### Custom Theme Tokens (in `app.css` or `globals.css`)
```css
@import 'tailwindcss';

@theme {
  /* Colors — Premium education-themed palette */
  --color-primary-50: oklch(0.97 0.02 250);
  --color-primary-100: oklch(0.93 0.04 250);
  --color-primary-200: oklch(0.86 0.08 250);
  --color-primary-300: oklch(0.76 0.12 250);
  --color-primary-400: oklch(0.66 0.16 250);
  --color-primary-500: oklch(0.55 0.18 250);   /* Main brand */
  --color-primary-600: oklch(0.47 0.18 250);
  --color-primary-700: oklch(0.40 0.16 250);
  --color-primary-800: oklch(0.33 0.12 250);
  --color-primary-900: oklch(0.27 0.08 250);

  --color-success-500: oklch(0.65 0.18 145);
  --color-warning-500: oklch(0.75 0.15 75);
  --color-danger-500: oklch(0.60 0.20 25);

  /* Sidebar */
  --color-sidebar-bg: oklch(0.15 0.02 250);
  --color-sidebar-text: oklch(0.85 0.02 250);
  --color-sidebar-hover: oklch(0.20 0.03 250);
  --color-sidebar-active: oklch(0.25 0.05 250);

  /* Typography */
  --font-sans: 'Inter', 'system-ui', sans-serif;

  /* Border radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;

  /* Shadows */
  --shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-modal: 0 20px 60px rgba(0,0,0,0.15);
}
```

### Design Principles
- **Dark sidebar** with light main content area (dashboard pattern)
- **Glassmorphism** cards on landing page (backdrop-blur + semi-transparent bg)
- **Micro-animations** on hover states, page transitions, loading states
- **Consistent spacing**: Use Tailwind spacing scale (p-4, gap-6, etc.)
- **Mobile-first**: Always design responsive, test at 375px, 768px, 1024px, 1440px

## Data Fetching with API Client

### API Client Setup (`lib/api.ts`)
```typescript
class ApiClient {
  private baseUrl: string;

  async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      credentials: 'include', // Send HttpOnly cookies
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (res.status === 401) {
      // Try refresh, then retry
      await this.refreshToken();
      return this.request(endpoint, options);
    }

    return res.json();
  }

  get<T>(endpoint: string) { ... }
  post<T>(endpoint: string, data: unknown) { ... }
  patch<T>(endpoint: string, data: unknown) { ... }
  delete<T>(endpoint: string) { ... }
}

export const api = new ApiClient();
```

### Data Fetching Patterns
```typescript
// In page.tsx — prefer server components for initial data
// In client components — use React hooks for interactive data

// Custom hook pattern
export function useStudents(params: StudentListParams) {
  const [data, setData] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta>();

  useEffect(() => {
    api.get<PaginatedResponse<Student>>('/api/students', { params })
      .then(res => { setData(res.data); setMeta(res.meta); })
      .finally(() => setLoading(false));
  }, [params]);

  return { data, loading, meta };
}
```

## Form Handling

- Use **React Hook Form** + **Zod** for validation
- Share Zod schemas with backend via `packages/shared/`
- Always show loading state on submit buttons
- Always show inline field validation errors
- Disable submit button until form is valid

```typescript
const schema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;
```

## Loading & Error States

- Use **Skeleton** components for loading (not spinners for lists/tables)
- Use **toast notifications** for success/error feedback on mutations
- Use **empty states** with helpful messages and CTAs when no data exists
- Use **error boundaries** for unexpected errors

## Authentication Flow

- JWT access token stored in HttpOnly cookie (set by backend)
- API client sends cookies automatically with `credentials: 'include'`
- Auth context/provider wraps dashboard layout
- Redirect to `/login` on 401 after failed refresh
- Protect dashboard routes with middleware (`middleware.ts`)

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Component files | kebab-case | `data-table.tsx`, `student-form.tsx` |
| Component names | PascalCase | `DataTable`, `StudentForm` |
| Hooks | camelCase with `use` prefix | `useStudents`, `useAuth` |
| Pages | `page.tsx` in route folder | `students/page.tsx` |
| Layouts | `layout.tsx` in route folder | `(dashboard)/layout.tsx` |
| CSS classes | Tailwind utilities | `className="flex items-center gap-2"` |
| API types | PascalCase | `Student`, `CreateStudentInput` |

## Unit Testing Best Practices

- Use **Vitest** + **React Testing Library** + `@testing-library/jest-dom`.
- Query by accessible ARIA roles (`screen.getByRole`) rather than CSS classes or IDs.
- Simulate real user interactions using `@testing-library/user-event`.
- Mock external dependencies (`next/navigation`, `useAuth`, `api`) in isolation.
- Test loading skeletons, empty states, and error alerts.
- For complete frontend unit testing patterns, see [`school-saas-testing`](file:///Users/aldrich/Desktop/workspace/next/saas/.agents/skills/school-saas-testing/SKILL.md).
