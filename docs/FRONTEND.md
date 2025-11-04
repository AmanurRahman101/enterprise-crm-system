# Tawasol CRM - Frontend Documentation

## Getting Started

### Prerequisites
- Node.js v18 or higher
- npm or yarn

### Installation

1. **Install dependencies**
```bash
cd frontend
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your API URL
```

3. **Start development server**
```bash
npm start
```

The app will be available at `http://localhost:3000`

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── common/      # Buttons, inputs, etc.
│   │   ├── layout/      # Header, sidebar, etc.
│   │   └── ...
│   ├── pages/           # Page components
│   │   ├── Dashboard/
│   │   ├── Contacts/
│   │   ├── Deals/
│   │   └── ...
│   ├── services/        # API services
│   │   ├── api.ts      # Axios instance
│   │   └── ...
│   ├── store/           # Redux store
│   │   ├── slices/     # Redux slices
│   │   └── index.ts
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript types
│   ├── assets/          # Images, fonts, etc.
│   ├── App.tsx          # Main app component
│   └── index.tsx        # Entry point
├── public/
│   └── index.html
└── package.json
```

## Architecture

### Component Structure

```
Component/
├── Component.tsx        # Main component
├── Component.styles.ts  # Styled components (if needed)
├── Component.test.tsx   # Unit tests
└── index.ts            # Barrel export
```

### State Management

**Redux Toolkit** is used for global state:
- `store/slices/authSlice.ts` - Authentication state
- `store/slices/contactSlice.ts` - Contacts state
- `store/slices/dealSlice.ts` - Deals state
- etc.

### Routing Structure

```
/ - Dashboard
/login - Login page
/contacts - Contact list
/contacts/:id - Contact detail
/deals - Deal pipeline
/deals/:id - Deal detail
/tasks - Task board
/tickets - Support tickets
/settings - Settings
```

## UI Framework

**Material-UI (MUI)** is used for components:
- Consistent design system
- Responsive components
- Theme customization
- Accessibility built-in

### Theme Customization

Edit `src/index.tsx` to customize the theme:
```typescript
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});
```

## API Integration

### Using the API Client

```typescript
import apiClient from '@services/api';

// GET request
const contacts = await apiClient.get('/contacts');

// POST request
const newContact = await apiClient.post('/contacts', data);

// PUT request
const updated = await apiClient.put('/contacts/:id', data);

// DELETE request
await apiClient.delete('/contacts/:id');
```

### Authentication

Token is automatically included in requests:
```typescript
// Login stores token
localStorage.setItem('accessToken', token);

// API client reads from localStorage
// All requests include: Authorization: Bearer <token>
```

## Best Practices

### Component Guidelines

1. **Functional Components**: Use hooks, not classes
2. **TypeScript**: Always define prop types
3. **Small Components**: Keep components focused
4. **Reusability**: Extract common patterns
5. **Props Drilling**: Use Context or Redux for deep trees

### Code Example

```typescript
import React from 'react';
import { Box, Typography } from '@mui/material';

interface ContactCardProps {
  name: string;
  email: string;
}

export const ContactCard: React.FC<ContactCardProps> = ({ 
  name, 
  email 
}) => {
  return (
    <Box sx={{ p: 2, border: 1 }}>
      <Typography variant="h6">{name}</Typography>
      <Typography variant="body2">{email}</Typography>
    </Box>
  );
};
```

## Testing

```bash
npm test
```

## Build for Production

```bash
npm run build
```

Outputs to `build/` directory.

## Development Tips

### Hot Reload
- Changes auto-refresh
- State is preserved when possible

### Debugging
- React DevTools extension
- Redux DevTools extension

### Performance
- Use `React.memo` for expensive components
- Implement lazy loading with `React.lazy`
- Optimize images and assets

## Common Tasks

### Adding a New Page

1. Create page component in `src/pages/`
2. Add route in `App.tsx`
3. Add navigation link in layout

### Creating an API Service

```typescript
// src/services/contactService.ts
import apiClient from './api';

export const contactService = {
  getAll: () => apiClient.get('/contacts'),
  getById: (id: string) => apiClient.get(`/contacts/${id}`),
  create: (data: any) => apiClient.post('/contacts', data),
  update: (id: string, data: any) => apiClient.put(`/contacts/${id}`, data),
  delete: (id: string) => apiClient.delete(`/contacts/${id}`),
};
```

### Adding Redux State

```typescript
// src/store/slices/exampleSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ExampleState {
  items: any[];
}

const initialState: ExampleState = {
  items: [],
};

const exampleSlice = createSlice({
  name: 'example',
  initialState,
  reducers: {
    setItems: (state, action: PayloadAction<any[]>) => {
      state.items = action.payload;
    },
  },
});

export const { setItems } = exampleSlice.actions;
export default exampleSlice.reducer;
```

## Troubleshooting

### Common Issues

1. **Module not found**
   - Run `npm install`
   - Check import paths

2. **API connection errors**
   - Verify backend is running
   - Check REACT_APP_API_URL in .env

3. **Build failures**
   - Clear cache: `npm run build --reset-cache`
   - Delete node_modules and reinstall

## Next Steps

1. Implement authentication pages
2. Build contact management UI
3. Create deal pipeline visualization
4. Develop task board interface
5. Add real-time updates with Socket.IO
