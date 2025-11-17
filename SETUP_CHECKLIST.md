# Setup Checklist for New Developers

## Prerequisites Installation
- [ ] Node.js installed (v14+)
- [ ] MySQL installed (v5.7+)
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

## Clone & Setup
- [ ] Clone repository from GitHub
- [ ] Navigate to project folder

## Database Setup
- [ ] MySQL server is running
- [ ] Created database: `tawasol_crm`
- [ ] Ran `Backend/schema.sql` script
- [ ] Verified tables created (companies, customers, company_customer_relationship, leads)

## Backend Setup
- [ ] Navigated to Backend folder
- [ ] Ran `npm install`
- [ ] Created `.env` file (copy from `.env.example`)
- [ ] Updated `DB_PASSWORD` in `.env`
- [ ] Updated `JWT_SECRET` in `.env`
- [ ] Started backend: `npm run dev`
- [ ] Verified: "Database connected successfully" message

## Frontend Setup
- [ ] Navigated to Frontend folder
- [ ] Ran `npm install`
- [ ] Started frontend: `npm run dev`
- [ ] Verified: Application running on http://localhost:5173

## Testing
- [ ] Accessed http://localhost:5173
- [ ] Created company account
- [ ] Logged into company dashboard
- [ ] Created customer account
- [ ] Logged into customer dashboard
- [ ] Tested adding leads
- [ ] Tested customer-company relationship

## Troubleshooting Checks (if issues occur)
- [ ] Both Backend and Frontend terminals are running
- [ ] MySQL service is running
- [ ] Port 3000 is not in use
- [ ] Port 5173 is not in use
- [ ] No errors in Backend terminal
- [ ] No errors in Frontend terminal
- [ ] Browser console has no errors (F12)

## Common Issues & Solutions

### Backend won't connect to database
- Check MySQL is running
- Verify DB_PASSWORD in .env
- Check database name is correct: `tawasol_crm`

### Frontend can't reach backend
- Ensure backend is running on port 3000
- Check for CORS errors in browser console
- Verify API URLs are http://localhost:3000

### Port already in use
- **Windows:** `netstat -ano | findstr :3000` then `taskkill /PID <PID> /F`
- Or change port in .env file

### npm install fails
- Delete `node_modules` folder
- Delete `package-lock.json`
- Run `npm install` again

---

**All checks complete? You're ready to code! 🎉**
