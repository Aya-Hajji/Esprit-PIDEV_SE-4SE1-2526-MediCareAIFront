# MediCareAI Admin Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Angular CLI 17+ installed
- Backend API running on `http://localhost:8805`

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Update API endpoint** (if different):
Edit `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://your-backend-url/api'
};
```

3. **Run the development server**:
```bash
ng serve
```

4. **Access the admin panel**:
- Login page: `http://localhost:4200/login`
- Use admin credentials from your backend
- After login, you'll be redirected to: `http://localhost:4200/admin/dashboard`

## 📋 Admin Features

### Available Modules:
✅ **Dashboard** - System overview and metrics  
✅ **User Management** - CRUD operations for all users  
✅ **Appointments** - View and manage all appointments  
✅ **Medical Data** - Specialties, diseases, and symptoms  
✅ **Health Events** - Event management and participants  
✅ **Subscriptions** - Premium subscription plans  
✅ **Forum** - Community post moderation  

### Navigation Routes:
- `/admin/dashboard` - Main dashboard
- `/admin/users` - User management
- `/admin/appointments` - Appointments
- `/admin/medical` - Medical data
- `/admin/events` - Health events
- `/admin/subscriptions` - Subscription plans
- `/admin/forum` - Forum management

## 🔑 Authentication

1. **Login** at `/login`
2. Enter admin credentials (role must be `ADMIN`)
3. Token is stored automatically
4. All API requests include the token
5. **Logout** button in sidebar footer

## 🎨 UI Components

### Tables
- Searchable and filterable
- Sort by columns
- Inline actions (edit, delete)
- Status badges

### Cards
- Used for events and subscription plans
- Visual presentation
- Quick actions

### Tabs
- Medical data module uses tabs
- Switch between specialties, diseases, symptoms

## 🛠️ Development

### Adding New Data

**Create User**:
- Navigate to User Management
- Click "Add New User"
- Fill in the form
- User receives email credentials

**Create Event**:
- Go to Health Events
- Click "Create Event"
- Set title, description, date, location
- Event appears immediately

**Create Subscription Plan**:
- Visit Subscriptions
- Click "Create Plan"
- Set name, price, duration
- Plan becomes available to users

## 🔒 Security Notes

- Only users with role `ADMIN` can access admin panel
- AuthGuard protects all admin routes
- Tokens expire based on backend configuration
- Manual logout clears all session data

## 📊 Data Flow

```
User Action → Component → Service → HTTP Request
    ↓              ↓           ↓
Backend API ← Interceptor ← Add Token
    ↓
Response → Service → Component → Update UI
```

## 🐛 Troubleshooting

### Cannot login:
- Check backend is running
- Verify user has `ADMIN` role
- Check browser console for errors

### API errors:
- Verify `environment.ts` has correct API URL
- Check CORS settings on backend
- Verify token is valid

### Routing issues:
- Clear browser cache
- Check route guards
- Verify authentication token

## 📱 Mobile Support

The admin panel is responsive:
- Sidebar toggles on mobile
- Tables scroll horizontally
- Cards stack vertically
- Touch-friendly buttons

## 🔄 Updates

### Pulling Latest Changes:
```bash
git pull origin main
npm install
ng serve
```

### Building for Production:
```bash
ng build --configuration production
```

## 📞 Support

For issues or questions:
- Check `ADMIN_ARCHITECTURE.md` for detailed documentation
- Review component code for examples
- Contact MediCareAI development team

---

**Ready to manage the platform! 🎉**
