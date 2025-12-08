# DataProvider - Centralized Data Caching

## Overview

The `DataProvider` is a React context that provides centralized caching and real-time synchronization for courses and study programs data. It eliminates redundant API calls and ensures data consistency across the application.

## Features

- **Single Initial Fetch**: Data is fetched once when the app loads
- **Real-time Updates**: Automatic synchronization with Supabase database changes
- **Global State**: All components access the same cached data
- **Performance**: Reduces API calls and improves app responsiveness

## Usage

### Accessing Data

Import and use the `useData` hook in any client component:

```tsx
import { useData } from "@/lib/data-provider";

function MyComponent() {
  const { courses, studyPrograms, loading, error } = useData();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {studyPrograms.map(program => (
        <div key={program.id}>{program.name}</div>
      ))}
    </div>
  );
}
```

### Available Properties

- `courses`: Array of all user's courses
- `studyPrograms`: Array of all user's study programs
- `loading`: Boolean indicating if initial data is being fetched
- `error`: Error message string or null
- `refreshCourses()`: Function to manually refresh courses data
- `refreshStudyPrograms()`: Function to manually refresh study programs data

## Implementation Details

### Real-time Subscriptions

The provider automatically subscribes to Supabase real-time changes:

- Monitors the `courses` table for INSERT, UPDATE, DELETE operations
- Monitors the `study_programs` table for INSERT, UPDATE, DELETE operations
- Automatically re-fetches data when changes are detected
- Filters changes by the current user's ID

### Data Flow

1. **App Load**: DataProvider fetches all courses and study programs
2. **User Action**: User creates/updates/deletes a course or program
3. **Database Update**: Change is saved to Supabase
4. **Real-time Trigger**: Supabase notifies the DataProvider via subscription
5. **Auto Refresh**: DataProvider re-fetches the updated data
6. **UI Update**: All components using the data automatically re-render

## Migration Guide

### Before (Old Pattern)
```tsx
// Each component fetched its own data
useEffect(() => {
  const fetchPrograms = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("study_programs")
      .select("*");
    setPrograms(data);
  };
  fetchPrograms();
}, []);
```

### After (New Pattern)
```tsx
// Components use cached data
const { studyPrograms } = useData();
```

## Benefits

1. **Reduced API Calls**: From N fetches (one per component) to 1 fetch (at app load)
2. **Consistency**: All components see the same data at the same time
3. **Real-time**: Changes propagate automatically to all components
4. **Performance**: Faster page loads and navigation
5. **Simplified Code**: Less boilerplate in components

## Notes

- The provider is wrapped at the root layout level (`app/layout.tsx`)
- Data is scoped per user (filtered by `user_id`)
- Subscriptions are automatically cleaned up on unmount
- Error handling is built-in and non-blocking
