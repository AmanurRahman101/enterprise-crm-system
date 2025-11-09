# 🔍 Calling Feature Debug Steps

## Quick Diagnostic

I've added a **CallDiagnostics** component that will appear in the bottom-right corner of your screen when you're logged in.

### Steps to Test:

1. **Start/Restart your servers** (if not running):
   ```powershell
   # Terminal 1 - Backend
   cd C:\Projects\tawasol-crm\backend
   npm start
   
   # Terminal 2 - Frontend
   cd C:\Projects\tawasol-crm\frontend
   npm start
   ```

2. **Open your browser** and go to `http://localhost:3000`

3. **Login** to your CRM account

4. **Check the diagnostic panel** (bottom-right corner):
   - ✅ Socket: Connected
   - ✅ Authenticated: Yes
   
   If you see ❌ or ⏳, that's your issue!

5. **Click "Test Call (to self)"**
   - You should see an incoming call popup appear
   - This tests the full socket flow without needing two users

---

## What Each Status Means:

### ❌ Socket: Disconnected
**Problem**: Frontend can't connect to backend Socket.IO server

**Fix**:
- Make sure backend is running on port 5000
- Check browser console for CORS errors
- Verify `http://localhost:5000` or `http://<your-ip>:5000` is accessible

### ⏳ Authenticated: Waiting...
**Problem**: Socket connected but not authenticated

**Fix**:
- Check browser console for authentication errors
- Verify your JWT token is valid (check localStorage)
- Check backend logs for authentication failures

### ✅ Both Connected and Authenticated
**Good!** Socket signaling is working. If calls still don't work:

---

## Testing Real Call Between Two Users:

### Option 1: Two Browsers (Same Computer)
1. Open Chrome (or regular browser)
2. Login as User A
3. Open Chrome Incognito (or different browser)
4. Login as User B
5. Go to a contact that represents User B in User A's browser
6. Click Call button
7. You should see incoming call in User B's browser

### Option 2: Two Devices (Network Testing)
1. Computer: Login as User A at `http://192.168.1.7:3000`
2. Phone/Laptop: Login as User B at `http://192.168.1.7:3000`
3. Click Call from one device
4. See incoming call on other device

---

## Common Issues & Solutions:

### Issue: "Contact not registered" message
**Cause**: Contact record is not linked to a user account

**Fix**:
1. The contact must have registered as a customer user
2. Email must match between contact and user
3. Auto-linking happens on registration

### Issue: Call timeout after 30 seconds
**Cause**: Target user is offline or didn't receive the signal

**Fix**:
- Check if target user has socket connected (diagnostic panel)
- Check backend logs for call-offer events
- Verify userIds match correctly

### Issue: Call accepted but Jitsi doesn't load
**Cause**: Jitsi external API not loaded or room name issue

**Fix**:
- Check browser console for Jitsi errors
- Verify `https://meet.jit.si/external_api.js` is loaded
- Check Network tab for blocked resources

---

## Browser Console Commands:

Test socket connection manually:
```javascript
// Check if socket is connected
console.log('Socket connected:', socketService.isConnected());

// Check stored token
console.log('Token:', localStorage.getItem('token'));

// Check current user
console.log('User:', JSON.parse(localStorage.getItem('user')));
```

---

## Next Steps After Fixing:

Once the diagnostic panel shows all green (✅):

1. Remove the `<CallDiagnostics />` from `App.tsx` (it's just for debugging)
2. Test real calls between two users
3. Verify call logging in database (check Activities)

---

## Files Modified for Debugging:

- `frontend/src/components/common/CallDiagnostics.tsx` - New diagnostic component
- `frontend/src/App.tsx` - Added diagnostic component temporarily

**Remember to remove `<CallDiagnostics />` from App.tsx after testing!**
