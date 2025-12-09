# Architecture and Patterns

This document describes the software engineering patterns and architectural decisions used in this codebase.

## Table of Contents

- [Overview](#overview)
- [Design Patterns](#design-patterns)
- [Directory Structure](#directory-structure)
- [Supabase Client Usage](#supabase-client-usage)
- [Data Access Layer](#data-access-layer)
- [Custom Hooks](#custom-hooks)
- [Best Practices](#best-practices)

## Overview

This codebase follows modern React and Next.js best practices with a focus on:

- **Separation of Concerns**: Clear separation between client/server code, data access, and UI
- **Code Reusability**: Shared components, hooks, and utilities
- **Type Safety**: Full TypeScript coverage with proper type definitions
- **Maintainability**: Well-documented code with consistent patterns

## Design Patterns

### 1. Factory Pattern (Supabase Clients)

Location: `lib/supabase/`

The Factory pattern is used to create different types of Supabase clients based on the execution context:

```typescript
// Client-side (browser)
import { createBrowserClient } from '@/lib/supabase';
const supabase = createBrowserClient();

// Server-side (Next.js components/routes)
import { createServerClient } from '@/lib/supabase';
const supabase = await createServerClient();

// Admin operations (server-side only)
import { createAdminClient } from '@/lib/supabase';
const adminClient = createAdminClient();
```

**Benefits**:
- Clear separation of client types
- Encapsulates client creation logic
- Easy to test and mock
- Prevents misuse of privileged clients

### 2. Repository Pattern (Data Access)

Location: `lib/repositories/`

The Repository pattern abstracts database operations behind a clean interface:

```typescript
// Example: Using CourseRepository
import { CourseRepository } from '@/lib/repositories';

const courseRepo = new CourseRepository(supabaseClient);
const { data, error } = await courseRepo.findAll();
```

**Key Classes**:
- `BaseRepository<T>`: Abstract base class with common CRUD operations
- `CourseRepository`: Course-specific operations
- `StudyProgramRepository`: Study program operations
- `PreferencesRepository`: User preferences operations

**Benefits**:
- Single source of truth for data operations
- Easy to add caching or logging
- Consistent error handling
- Testable without database access

### 3. Hook Pattern (React Hooks)

Location: `hooks/`

Custom hooks encapsulate reusable logic:

```typescript
// Form submission with loading/error states
import { useFormSubmit } from '@/hooks/use-form-submit';

const { isSubmitting, error, handleSubmit } = useFormSubmit(
  async (formData) => {
    return await api.createUser(formData);
  },
  {
    onSuccess: () => router.push('/success'),
    onError: (error) => toast.error(error.message)
  }
);

// Repository access
import { useRepositories } from '@/hooks/use-repositories';

const { courseRepo, programRepo } = useRepositories();
```

**Benefits**:
- Reusable stateful logic
- Cleaner component code
- Easier to test
- Consistent patterns across components

### 4. Provider Pattern (React Context)

Location: `lib/data-provider.tsx`

The Provider pattern shares data across the component tree:

```typescript
// In layout
<DataProvider>
  <YourApp />
</DataProvider>

// In components
const { courses, studyPrograms, preferences, loading } = useData();
```

**Features**:
- Centralized data management
- Real-time subscriptions to Supabase
- Automatic refetching on data changes
- Loading and error states

## Directory Structure

```
lib/
├── supabase/           # Supabase client factories
│   ├── client.ts       # Browser client
│   ├── server.ts       # Server client
│   ├── admin.ts        # Admin client (privileged)
│   ├── proxy.ts        # Middleware session management
│   └── index.ts        # Clean exports
├── repositories/       # Data access layer
│   ├── base-repository.ts
│   ├── course-repository.ts
│   ├── study-program-repository.ts
│   ├── preferences-repository.ts
│   └── index.ts
├── auth.ts            # Server actions for authentication
├── data-provider.tsx  # Context provider for global data
└── utils.ts           # Utility functions

hooks/
├── use-form-submit.ts    # Form submission hook
├── use-repositories.ts   # Repository access hook
├── use-auth.ts          # Authentication hook
└── use-mobile.ts        # Mobile detection hook
```

## Supabase Client Usage

### When to Use Each Client

#### Browser Client (`createBrowserClient`)
- **Use in**: Client components, client-side operations
- **Session**: Browser cookies
- **Example**: Form submissions, real-time subscriptions

```typescript
'use client';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
await supabase.from('courses').select();
```

#### Server Client (`createServerClient`)
- **Use in**: Server components, API routes, server actions
- **Session**: Next.js cookies
- **Example**: SSR data fetching, protected routes

```typescript
'use server';
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data } = await supabase.from('courses').select();
```

#### Admin Client (`createAdminClient`)
- **Use in**: Server-side only, privileged operations
- **Session**: None (uses service role key)
- **Example**: User management, bypassing RLS

```typescript
'use server';
import { createAdminClient } from '@/lib/supabase/admin';

const admin = createAdminClient();
await admin.auth.admin.deleteUser(userId);
```

⚠️ **Warning**: Never expose the admin client to the browser!

## Data Access Layer

### Using Repositories

Instead of directly calling Supabase in components, use repositories:

❌ **Bad** (direct database access in component):
```typescript
const supabase = createClient();
const { data } = await supabase
  .from('courses')
  .select()
  .eq('user_id', userId);
```

✅ **Good** (using repository):
```typescript
const { courseRepo } = useRepositories();
const { data, error } = await courseRepo.findAll();
```

### Repository Methods

All repositories extend `BaseRepository` and provide:

- `findAll()`: Get all records for current user
- `findById(id)`: Get a single record
- `create(data)`: Create a new record
- `update(id, data)`: Update a record
- `delete(id)`: Delete a record

Plus entity-specific methods:
- `CourseRepository.findByProgramId(programId)`
- `StudyProgramRepository.findActive()`
- `PreferencesRepository.upsert(preferences)`

## Custom Hooks

### useFormSubmit

Handles form submission with loading and error states:

```typescript
const { isSubmitting, error, handleSubmit } = useFormSubmit(
  async (formData) => {
    const name = formData.get('name');
    return await courseRepo.create({ name });
  },
  {
    onSuccess: () => toast.success('Created!'),
    onError: (err) => toast.error(err.message)
  }
);

<form onSubmit={handleSubmit}>
  {/* form fields */}
  <button disabled={isSubmitting}>Submit</button>
  {error && <p>{error}</p>}
</form>
```

### useRepositories

Provides memoized repository instances:

```typescript
const { courseRepo, programRepo, preferencesRepo } = useRepositories();

// Use repositories for data operations
const { data } = await courseRepo.findAll();
```

## Best Practices

### 1. Client vs Server Code

- Use `'use client'` directive only when necessary
- Prefer server components for data fetching
- Use client components for interactivity

### 2. Error Handling

Always handle errors from repository methods:

```typescript
const { data, error } = await courseRepo.create(courseData);
if (error) {
  toast.error(error.message);
  return;
}
// Use data...
```

### 3. Type Safety

Import and use proper types:

```typescript
import type { Course } from '@/types/course';
import type { StudyProgram } from '@/types/study-program';
```

### 4. Documentation

All public functions should have JSDoc comments:

```typescript
/**
 * Creates a new course for the current user.
 * @param data - Course data to create
 * @returns The created course or error
 */
async create(data: Partial<Course>) {
  // ...
}
```

### 5. Imports

Use the index files for cleaner imports:

```typescript
// Instead of:
import { CourseRepository } from '@/lib/repositories/course-repository';
import { createClient } from '@/lib/supabase/client';

// Do:
import { CourseRepository } from '@/lib/repositories';
import { createBrowserClient } from '@/lib/supabase';
```

## Migration Guide

If you have existing code that directly uses Supabase:

1. **Replace direct Supabase calls with repositories**:
   ```typescript
   // Before
   const { data } = await supabase.from('courses').select();
   
   // After
   const { courseRepo } = useRepositories();
   const { data } = await courseRepo.findAll();
   ```

2. **Use the new client factories**:
   ```typescript
   // Before
   import { createClient } from '@supabase/ssr';
   
   // After
   import { createBrowserClient } from '@/lib/supabase';
   ```

3. **Add proper error handling**:
   ```typescript
   const { data, error } = await courseRepo.create(data);
   if (error) {
     // Handle error
   }
   ```

## Summary

This architecture provides:

- ✅ Clear separation of concerns
- ✅ Reusable, testable code
- ✅ Type-safe operations
- ✅ Consistent patterns across the codebase
- ✅ Easy to extend and maintain

For questions or improvements, please refer to the code documentation or create an issue.
