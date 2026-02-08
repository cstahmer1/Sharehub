import { db } from "../server/db";
import { sql } from "drizzle-orm";

interface OrphanCheck {
  table: string;
  fkColumn: string;
  orphanCount: number;
  sampleIds: (number | string)[];
}

async function checkOrphans(): Promise<OrphanCheck[]> {
  const results: OrphanCheck[] = [];

  // Check profiles.user_id → users.id
  const profileOrphans = await db.execute(sql`
    SELECT p.user_id, COUNT(*) as count
    FROM profiles p
    LEFT JOIN users u ON u.id = p.user_id
    WHERE p.user_id IS NOT NULL AND u.id IS NULL
    GROUP BY p.user_id
  `);
  
  if (profileOrphans.rows.length > 0) {
    const sampleIds = profileOrphans.rows.slice(0, 10).map((r: any) => r.user_id);
    const count = profileOrphans.rows.reduce((sum: number, r: any) => sum + parseInt(r.count), 0);
    results.push({
      table: 'profiles',
      fkColumn: 'user_id',
      orphanCount: count,
      sampleIds
    });
  }

  // Check listings.owner_user_id → users.id
  const listingOrphans = await db.execute(sql`
    SELECT l.owner_user_id, COUNT(*) as count
    FROM listings l
    LEFT JOIN users u ON u.id = l.owner_user_id
    WHERE l.owner_user_id IS NOT NULL AND u.id IS NULL
    GROUP BY l.owner_user_id
  `);
  
  if (listingOrphans.rows.length > 0) {
    const sampleIds = listingOrphans.rows.slice(0, 10).map((r: any) => r.owner_user_id);
    const count = listingOrphans.rows.reduce((sum: number, r: any) => sum + parseInt(r.count), 0);
    results.push({
      table: 'listings',
      fkColumn: 'owner_user_id',
      orphanCount: count,
      sampleIds
    });
  }

  // Check bookings - buyer_user_id and seller_user_id
  const bookingBuyerOrphans = await db.execute(sql`
    SELECT b.buyer_user_id, COUNT(*) as count
    FROM bookings b
    LEFT JOIN users u ON u.id = b.buyer_user_id
    WHERE b.buyer_user_id IS NOT NULL AND u.id IS NULL
    GROUP BY b.buyer_user_id
  `);
  
  if (bookingBuyerOrphans.rows.length > 0) {
    const sampleIds = bookingBuyerOrphans.rows.slice(0, 10).map((r: any) => r.buyer_user_id);
    const count = bookingBuyerOrphans.rows.reduce((sum: number, r: any) => sum + parseInt(r.count), 0);
    results.push({
      table: 'bookings',
      fkColumn: 'buyer_user_id',
      orphanCount: count,
      sampleIds
    });
  }

  const bookingSellerOrphans = await db.execute(sql`
    SELECT b.seller_user_id, COUNT(*) as count
    FROM bookings b
    LEFT JOIN users u ON u.id = b.seller_user_id
    WHERE b.seller_user_id IS NOT NULL AND u.id IS NULL
    GROUP BY b.seller_user_id
  `);
  
  if (bookingSellerOrphans.rows.length > 0) {
    const sampleIds = bookingSellerOrphans.rows.slice(0, 10).map((r: any) => r.seller_user_id);
    const count = bookingSellerOrphans.rows.reduce((sum: number, r: any) => sum + parseInt(r.count), 0);
    results.push({
      table: 'bookings',
      fkColumn: 'seller_user_id',
      orphanCount: count,
      sampleIds
    });
  }

  // Check threads - participant_a_id and participant_b_id
  const threadAOrphans = await db.execute(sql`
    SELECT t.participant_a_id, COUNT(*) as count
    FROM threads t
    LEFT JOIN users u ON u.id = t.participant_a_id
    WHERE t.participant_a_id IS NOT NULL AND u.id IS NULL
    GROUP BY t.participant_a_id
  `);
  
  if (threadAOrphans.rows.length > 0) {
    const sampleIds = threadAOrphans.rows.slice(0, 10).map((r: any) => r.participant_a_id);
    const count = threadAOrphans.rows.reduce((sum: number, r: any) => sum + parseInt(r.count), 0);
    results.push({
      table: 'threads',
      fkColumn: 'participant_a_id',
      orphanCount: count,
      sampleIds
    });
  }

  const threadBOrphans = await db.execute(sql`
    SELECT t.participant_b_id, COUNT(*) as count
    FROM threads t
    LEFT JOIN users u ON u.id = t.participant_b_id
    WHERE t.participant_b_id IS NOT NULL AND u.id IS NULL
    GROUP BY t.participant_b_id
  `);
  
  if (threadBOrphans.rows.length > 0) {
    const sampleIds = threadBOrphans.rows.slice(0, 10).map((r: any) => r.participant_b_id);
    const count = threadBOrphans.rows.reduce((sum: number, r: any) => sum + parseInt(r.count), 0);
    results.push({
      table: 'threads',
      fkColumn: 'participant_b_id',
      orphanCount: count,
      sampleIds
    });
  }

  // Check messages.sender_user_id → users.id
  const messageOrphans = await db.execute(sql`
    SELECT m.sender_user_id, COUNT(*) as count
    FROM messages m
    LEFT JOIN users u ON u.id = m.sender_user_id
    WHERE m.sender_user_id IS NOT NULL AND u.id IS NULL
    GROUP BY m.sender_user_id
  `);
  
  if (messageOrphans.rows.length > 0) {
    const sampleIds = messageOrphans.rows.slice(0, 10).map((r: any) => r.sender_user_id);
    const count = messageOrphans.rows.reduce((sum: number, r: any) => sum + parseInt(r.count), 0);
    results.push({
      table: 'messages',
      fkColumn: 'sender_user_id',
      orphanCount: count,
      sampleIds
    });
  }

  // Check reviews - reviewer_user_id and reviewee_user_id
  const reviewerOrphans = await db.execute(sql`
    SELECT r.reviewer_user_id, COUNT(*) as count
    FROM reviews r
    LEFT JOIN users u ON u.id = r.reviewer_user_id
    WHERE r.reviewer_user_id IS NOT NULL AND u.id IS NULL
    GROUP BY r.reviewer_user_id
  `);
  
  if (reviewerOrphans.rows.length > 0) {
    const sampleIds = reviewerOrphans.rows.slice(0, 10).map((r: any) => r.reviewer_user_id);
    const count = reviewerOrphans.rows.reduce((sum: number, r: any) => sum + parseInt(r.count), 0);
    results.push({
      table: 'reviews',
      fkColumn: 'reviewer_user_id',
      orphanCount: count,
      sampleIds
    });
  }

  const revieweeOrphans = await db.execute(sql`
    SELECT r.reviewee_user_id, COUNT(*) as count
    FROM reviews r
    LEFT JOIN users u ON u.id = r.reviewee_user_id
    WHERE r.reviewee_user_id IS NOT NULL AND u.id IS NULL
    GROUP BY r.reviewee_user_id
  `);
  
  if (revieweeOrphans.rows.length > 0) {
    const sampleIds = revieweeOrphans.rows.slice(0, 10).map((r: any) => r.reviewee_user_id);
    const count = revieweeOrphans.rows.reduce((sum: number, r: any) => sum + parseInt(r.count), 0);
    results.push({
      table: 'reviews',
      fkColumn: 'reviewee_user_id',
      orphanCount: count,
      sampleIds
    });
  }

  // Check optional FK fields that should be nullable
  
  // analytics_events.user_id → users.id (optional)
  const analyticsOrphans = await db.execute(sql`
    SELECT a.user_id, COUNT(*) as count
    FROM analytics_events a
    LEFT JOIN users u ON u.id = a.user_id
    WHERE a.user_id IS NOT NULL AND u.id IS NULL
    GROUP BY a.user_id
  `);
  
  if (analyticsOrphans.rows.length > 0) {
    const sampleIds = analyticsOrphans.rows.slice(0, 10).map((r: any) => r.user_id);
    const count = analyticsOrphans.rows.reduce((sum: number, r: any) => sum + parseInt(r.count), 0);
    results.push({
      table: 'analytics_events',
      fkColumn: 'user_id',
      orphanCount: count,
      sampleIds
    });
  }

  // audit_log.admin_user_id → users.id (optional)
  const auditOrphans = await db.execute(sql`
    SELECT a.admin_user_id, COUNT(*) as count
    FROM audit_log a
    LEFT JOIN users u ON u.id = a.admin_user_id
    WHERE a.admin_user_id IS NOT NULL AND u.id IS NULL
    GROUP BY a.admin_user_id
  `);
  
  if (auditOrphans.rows.length > 0) {
    const sampleIds = auditOrphans.rows.slice(0, 10).map((r: any) => r.admin_user_id);
    const count = auditOrphans.rows.reduce((sum: number, r: any) => sum + parseInt(r.count), 0);
    results.push({
      table: 'audit_log',
      fkColumn: 'admin_user_id',
      orphanCount: count,
      sampleIds
    });
  }

  // disputes.resolved_by → users.id (optional)
  const disputeResolvedOrphans = await db.execute(sql`
    SELECT d.resolved_by, COUNT(*) as count
    FROM disputes d
    LEFT JOIN users u ON u.id = d.resolved_by
    WHERE d.resolved_by IS NOT NULL AND u.id IS NULL
    GROUP BY d.resolved_by
  `);
  
  if (disputeResolvedOrphans.rows.length > 0) {
    const sampleIds = disputeResolvedOrphans.rows.slice(0, 10).map((r: any) => r.resolved_by);
    const count = disputeResolvedOrphans.rows.reduce((sum: number, r: any) => sum + parseInt(r.count), 0);
    results.push({
      table: 'disputes',
      fkColumn: 'resolved_by',
      orphanCount: count,
      sampleIds
    });
  }

  // email_queue.recipient_user_id → users.id (optional)
  const emailQueueOrphans = await db.execute(sql`
    SELECT e.recipient_user_id, COUNT(*) as count
    FROM email_queue e
    LEFT JOIN users u ON u.id = e.recipient_user_id
    WHERE e.recipient_user_id IS NOT NULL AND u.id IS NULL
    GROUP BY e.recipient_user_id
  `);
  
  if (emailQueueOrphans.rows.length > 0) {
    const sampleIds = emailQueueOrphans.rows.slice(0, 10).map((r: any) => r.recipient_user_id);
    const count = emailQueueOrphans.rows.reduce((sum: number, r: any) => sum + parseInt(r.count), 0);
    results.push({
      table: 'email_queue',
      fkColumn: 'recipient_user_id',
      orphanCount: count,
      sampleIds
    });
  }

  return results;
}

async function main() {
  console.log('Checking for orphaned foreign key references...\n');
  
  const orphans = await checkOrphans();
  
  if (orphans.length === 0) {
    console.log('✓ No orphaned records found!');
  } else {
    console.log('⚠ Found orphaned records:\n');
    console.table(orphans.map(o => ({
      Table: o.table,
      Column: o.fkColumn,
      'Orphan Count': o.orphanCount,
      'Sample IDs': o.sampleIds.join(', ')
    })));
    
    console.log('\nRecommended actions:');
    console.log('1. For critical FKs (profiles, listings, bookings, etc): These should CASCADE on delete');
    console.log('2. For optional FKs (analytics, audit_log, etc): SET NULL on delete');
    console.log('3. Run migrations to add proper onDelete rules to prevent future orphans');
    process.exit(1);
  }
  
  process.exit(0);
}

main().catch((err) => {
  console.error('Error checking orphans:', err);
  process.exit(1);
});
