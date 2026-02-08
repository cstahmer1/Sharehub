# User Deletion Safety Guide

## ⚠️ IMPORTANT: Safe User Deletion Practices

After the production incident where manual user deletions caused HTTP 500 errors, follow these guidelines:

## Recommended Approach: Soft Delete

**Always prefer soft-delete over hard-delete:**

```typescript
// ✅ RECOMMENDED: Soft delete (sets deletedAt timestamp)
await storage.softDeleteUser(userId);
```

Soft-delete:
- ✅ Preserves data integrity
- ✅ Allows for potential recovery
- ✅ Maintains audit trail
- ✅ Prevents orphaned records
- ✅ Won't break related data or cause 500 errors

## Hard Delete (Use with Extreme Caution)

If you **must** hard-delete a user:

### 1. Check for Orphans First

Run the orphan checker to see what will be affected:

```bash
tsx scripts/check-orphans.ts
```

or visit the debug endpoint (development/staging only):

```bash
curl http://localhost:5000/debug/orphans
```

### 2. Review Foreign Key Constraints

The following tables have CASCADE delete (auto-delete when user is deleted):
- `profiles` - User profiles
- `listings` - User's listings
- `bookings` - User's bookings (buyer and seller)
- `threads` - Message threads
- `messages` - Individual messages
- `reviews` - Reviews given and received
- `favorites` - Saved listings
- `provider_skills` - Provider skills
- `portfolio_items` - Portfolio items
- `notification_preferences` - Notification settings
- `payouts` - Payout records

The following tables have SET NULL (FK set to null when user is deleted):
- `analytics_events.user_id` - Analytics will remain but user_id nullified
- `audit_log.admin_user_id` - Audit logs preserved without admin reference
- `disputes.resolved_by` - Disputes preserved without resolver reference
- `email_queue.recipient_user_id` - Emails preserved without user reference
- `search_queries.user_id` - Search analytics preserved
- `contact_submissions.user_id` - Contact forms preserved

### 3. Production Deletion Steps

```bash
# 1. Check for orphans before deletion
npm run check:orphans

# 2. If hard delete is required, use the soft delete API first to verify impact
curl -X POST http://your-app.com/api/admin/users/123/soft-delete \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 3. Monitor for any issues
# 4. Only then proceed with hard delete if absolutely necessary
```

## System Hardening Implemented

### 1. Enhanced Middleware
- ✅ `requireAuth` now checks for deleted users and returns 401
- ✅ Global error handler logs errors with unique IDs for debugging
- ✅ Defensive null checks prevent crashes from missing user data

### 2. Monitoring Endpoints
- ✅ `GET /health` - Check if app and database are healthy
- ✅ `GET /debug/orphans` - Check for orphaned records (dev/staging only)

### 3. FK Constraints
- ✅ Critical tables cascade on user delete
- ✅ Optional references use SET NULL to preserve data
- ✅ Soft delete column (`deleted_at`) on users table

### 4. Diagnostics
- ✅ Run `tsx scripts/check-orphans.ts` to find orphaned records
- ✅ Run `tsx scripts/test-orphan-handling.ts` to test deletion handling

## Quick Recovery from Production Issues

If you discover orphaned records in production:

```sql
-- Find orphaned profiles
SELECT p.* FROM profiles p
LEFT JOIN users u ON u.id = p.user_id
WHERE p.user_id IS NOT NULL AND u.id IS NULL;

-- FIX: Delete orphaned profiles (CASCADE should have done this)
DELETE FROM profiles p
WHERE p.user_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.user_id);

-- For optional FKs, set to NULL instead
UPDATE analytics_events a
SET user_id = NULL
WHERE user_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = a.user_id);
```

## Key Takeaways

1. **Always use soft-delete** unless there's a legal/compliance requirement for hard delete
2. **Check for orphans** before and after any manual database operations
3. **Use the API** for deletions rather than direct SQL
4. **Monitor** the `/health` endpoint and error logs after any user deletions
5. **Test** in staging first with `scripts/test-orphan-handling.ts`

## Contact

If you encounter issues with user deletion, check:
- Error logs for the unique error ID
- `/debug/orphans` endpoint for orphaned records
- Run the orphan checker script for detailed analysis
