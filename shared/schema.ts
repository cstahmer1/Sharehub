import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, numeric, serial, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with role support
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  roleOwner: boolean("role_owner").default(false).notNull(),
  roleProvider: boolean("role_provider").default(false).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  forcePasswordChange: boolean("force_password_change").default(false).notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeConnectAccountId: text("stripe_connect_account_id"),
  payoutStatus: text("payout_status").$type<"UNSET" | "PENDING" | "READY" | "RESTRICTED">().default("UNSET").notNull(),
  stripeRequirements: jsonb("stripe_requirements").$type<{ currently_due?: string[]; disabled_reason?: string | null }>(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// User profiles with additional info
export const profiles = pgTable("profiles", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  headline: text("headline"),
  bio: text("bio"),
  location: jsonb("location").$type<{
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    lat?: number;
    lng?: number;
  }>(),
  ratingAvg: numeric("rating_avg", { precision: 3, scale: 2 }).default("0.00"),
  ratingCount: integer("rating_count").default(0).notNull(),
  completedProjects: integer("completed_projects").default(0).notNull(),
});

// Categories for projects
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  parentId: integer("parent_id"),
});

// Project listings
export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  ownerUserId: integer("owner_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").default("USD").notNull(),
  status: text("status").$type<"draft" | "published" | "paused" | "completed">().default("draft").notNull(),
  lat: numeric("lat", { precision: 10, scale: 8 }),
  lng: numeric("lng", { precision: 11, scale: 8 }),
  address: text("address"),
  timeline: text("timeline"),
  requirements: text("requirements"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Project images
export const listingImages = pgTable("listing_images", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").references(() => listings.id, { onDelete: "cascade" }).notNull(),
  url: text("url").notNull(),
  altText: text("alt_text"),
  sortOrder: integer("sort_order").default(0).notNull(),
});

// Availability rules for scheduling
export const availabilityRules = pgTable("availability_rules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  listingId: integer("listing_id").references(() => listings.id, { onDelete: "cascade" }),
  rrule: text("rrule").notNull(),
  timezone: text("timezone").default("America/Chicago").notNull(),
  isProvider: boolean("is_provider").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Availability exceptions
export const availabilityExceptions = pgTable("availability_exceptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  listingId: integer("listing_id").references(() => listings.id, { onDelete: "cascade" }),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  reason: text("reason"),
});

// Message threads
export const threads = pgTable("threads", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").references(() => listings.id, { onDelete: "cascade" }),
  participantAId: integer("participant_a_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  participantBId: integer("participant_b_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  subject: text("subject"),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Individual messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").references(() => threads.id, { onDelete: "cascade" }).notNull(),
  senderUserId: integer("sender_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  body: text("body").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Bookings with Stripe integration and deposit-based escrow
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").references(() => listings.id, { onDelete: "cascade" }).notNull(),
  buyerUserId: integer("buyer_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  sellerUserId: integer("seller_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  qty: integer("qty").default(1).notNull(),
  unit: text("unit").$type<"hour" | "day" | "fixed">().default("fixed").notNull(),
  subtotalCents: integer("subtotal_cents").notNull(),
  platformFeeCents: integer("platform_fee_cents").default(0).notNull(),
  totalCents: integer("total_cents").notNull(),
  status: text("status").$type<"pending" | "accepted" | "declined" | "unfunded" | "funded" | "final_proposed" | "final_approved" | "paid" | "in_progress" | "partial_released" | "completed" | "settled" | "canceled" | "disputed">().default("pending").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeTransferId: text("stripe_transfer_id"),
  notes: text("notes"),
  
  // Deposit-based escrow fields
  amountBudgetedCents: integer("amount_budgeted_cents"),
  amountDepositCents: integer("amount_deposit_cents"),
  amountFinalCents: integer("amount_final_cents"),
  amountDeltaCents: integer("amount_delta_cents"),
  amountFundedCents: integer("amount_funded_cents").default(0),
  retainageBps: integer("retainage_bps").default(0).notNull(),
  retainageHoldCents: integer("retainage_hold_cents").default(0),
  homeownerPmSaved: boolean("homeowner_pm_saved").default(false).notNull(),
  depositChargeId: text("deposit_charge_id"),
  deltaChargeId: text("delta_charge_id"),
  finalProposalNote: text("final_proposal_note"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Reviews system
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id, { onDelete: "cascade" }).notNull(),
  reviewerUserId: integer("reviewer_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  revieweeUserId: integer("reviewee_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  rating: integer("rating").notNull(),
  body: text("body"),
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Favorites/saved listings
export const favorites = pgTable("favorites", {
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  listingId: integer("listing_id").references(() => listings.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: { name: "favorites_pkey", columns: [table.userId, table.listingId] }
}));

// Provider skills and portfolios
export const providerSkills = pgTable("provider_skills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  skillName: text("skill_name").notNull(),
  experienceYears: integer("experience_years"),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Portfolio items for providers
export const portfolioItems = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrls: jsonb("image_urls").$type<string[]>().default([]),
  projectDate: timestamp("project_date", { withTimezone: true }),
  categoryId: integer("category_id").references(() => categories.id),
  featured: boolean("featured").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Email notification preferences
export const notificationPreferences = pgTable("notification_preferences", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  emailNewMessages: boolean("email_new_messages").default(true).notNull(),
  emailBookingUpdates: boolean("email_booking_updates").default(true).notNull(),
  emailReviewRequests: boolean("email_review_requests").default(true).notNull(),
  emailPayoutNotifications: boolean("email_payout_notifications").default(true).notNull(),
  emailMarketing: boolean("email_marketing").default(false).notNull(),
  smsBookingReminders: boolean("sms_booking_reminders").default(false).notNull(),
  pushNotifications: boolean("push_notifications").default(true).notNull(),
});

// Email notification queue
export const emailQueue = pgTable("email_queue", {
  id: serial("id").primaryKey(),
  recipientUserId: integer("recipient_user_id").references(() => users.id, { onDelete: "set null" }),
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  templateId: text("template_id"),
  templateData: jsonb("template_data").$type<Record<string, any>>(),
  status: text("status").$type<"pending" | "sent" | "failed" | "retrying">().default("pending").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Payment/payout tracking
export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  bookingId: integer("booking_id").references(() => bookings.id),
  amountCents: integer("amount_cents").notNull(),
  feeCents: integer("fee_cents").default(0).notNull(),
  netAmountCents: integer("net_amount_cents").notNull(),
  currency: text("currency").default("USD").notNull(),
  status: text("status").$type<"pending" | "processing" | "paid" | "failed" | "canceled">().default("pending").notNull(),
  stripePayoutId: text("stripe_payout_id"),
  failureReason: text("failure_reason"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Analytics tracking
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  sessionId: text("session_id"),
  eventType: text("event_type").notNull(),
  eventData: jsonb("event_data").$type<Record<string, any>>(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  referrer: text("referrer"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Platform metrics aggregation
export const platformMetrics = pgTable("platform_metrics", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  metric: text("metric").notNull(),
  value: numeric("value", { precision: 15, scale: 2 }).notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueDateMetric: { name: "platform_metrics_date_metric_key", columns: [table.date, table.metric] }
}));

// Audit log for admin actions
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  adminUserId: integer("admin_user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  details: jsonb("details").$type<Record<string, any>>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Dispute resolution
export const disputes = pgTable("disputes", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id, { onDelete: "cascade" }).notNull(),
  reporterUserId: integer("reporter_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  reportedUserId: integer("reported_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  reason: text("reason").notNull(),
  description: text("description").notNull(),
  status: text("status").$type<"open" | "investigating" | "resolved" | "closed">().default("open").notNull(),
  adminNotes: text("admin_notes"),
  resolvedBy: integer("resolved_by").references(() => users.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Search analytics
export const searchQueries = pgTable("search_queries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  query: text("query").notNull(),
  filters: jsonb("filters").$type<Record<string, any>>(),
  resultsCount: integer("results_count").default(0).notNull(),
  clickedListingId: integer("clicked_listing_id").references(() => listings.id, { onDelete: "set null" }),
  location: jsonb("location").$type<{ lat: number; lng: number; address: string }>(),
  sessionId: text("session_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Platform settings (key-value store for configuration)
export const platformSettings = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<any>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true}).defaultNow().notNull(),
});

// Admin pages (static content)
export const adminPages = pgTable("admin_pages", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Contact form submissions
export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").$type<"new" | "read" | "responded" | "archived">().default("new").notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Session table (managed by connect-pg-simple, read-only stub for Drizzle)
export const session = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { withTimezone: true }).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  notificationPreferences: one(notificationPreferences, { fields: [users.id], references: [notificationPreferences.userId] }),
  ownedListings: many(listings),
  buyerBookings: many(bookings, { relationName: "buyer" }),
  sellerBookings: many(bookings, { relationName: "seller" }),
  sentMessages: many(messages),
  reviewsGiven: many(reviews, { relationName: "reviewer" }),
  reviewsReceived: many(reviews, { relationName: "reviewee" }),
  favorites: many(favorites),
  threadsAsA: many(threads, { relationName: "participantA" }),
  threadsAsB: many(threads, { relationName: "participantB" }),
  providerSkills: many(providerSkills),
  portfolioItems: many(portfolioItems),
  payouts: many(payouts),
  analyticsEvents: many(analyticsEvents),
  disputesReported: many(disputes, { relationName: "reporter" }),
  disputesReceived: many(disputes, { relationName: "reported" }),
  disputesResolved: many(disputes, { relationName: "resolvedBy" }),
  searchQueries: many(searchQueries),
  emailQueue: many(emailQueue),
  auditActions: many(auditLog),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  children: many(categories),
  listings: many(listings),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  owner: one(users, { fields: [listings.ownerUserId], references: [users.id] }),
  category: one(categories, { fields: [listings.categoryId], references: [categories.id] }),
  images: many(listingImages),
  bookings: many(bookings),
  threads: many(threads),
  favorites: many(favorites),
}));

export const listingImagesRelations = relations(listingImages, ({ one }) => ({
  listing: one(listings, { fields: [listingImages.listingId], references: [listings.id] }),
}));

export const threadsRelations = relations(threads, ({ one, many }) => ({
  listing: one(listings, { fields: [threads.listingId], references: [listings.id] }),
  participantA: one(users, { fields: [threads.participantAId], references: [users.id], relationName: "participantA" }),
  participantB: one(users, { fields: [threads.participantBId], references: [users.id], relationName: "participantB" }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  thread: one(threads, { fields: [messages.threadId], references: [threads.id] }),
  sender: one(users, { fields: [messages.senderUserId], references: [users.id] }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  listing: one(listings, { fields: [bookings.listingId], references: [listings.id] }),
  buyer: one(users, { fields: [bookings.buyerUserId], references: [users.id], relationName: "buyer" }),
  seller: one(users, { fields: [bookings.sellerUserId], references: [users.id], relationName: "seller" }),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  booking: one(bookings, { fields: [reviews.bookingId], references: [bookings.id] }),
  reviewer: one(users, { fields: [reviews.reviewerUserId], references: [users.id], relationName: "reviewer" }),
  reviewee: one(users, { fields: [reviews.revieweeUserId], references: [users.id], relationName: "reviewee" }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  listing: one(listings, { fields: [favorites.listingId], references: [listings.id] }),
}));

export const providerSkillsRelations = relations(providerSkills, ({ one }) => ({
  user: one(users, { fields: [providerSkills.userId], references: [users.id] }),
  category: one(categories, { fields: [providerSkills.categoryId], references: [categories.id] }),
}));

export const portfolioItemsRelations = relations(portfolioItems, ({ one }) => ({
  user: one(users, { fields: [portfolioItems.userId], references: [users.id] }),
  category: one(categories, { fields: [portfolioItems.categoryId], references: [categories.id] }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, { fields: [notificationPreferences.userId], references: [users.id] }),
}));

export const emailQueueRelations = relations(emailQueue, ({ one }) => ({
  recipientUser: one(users, { fields: [emailQueue.recipientUserId], references: [users.id] }),
}));

export const payoutsRelations = relations(payouts, ({ one }) => ({
  user: one(users, { fields: [payouts.userId], references: [users.id] }),
  booking: one(bookings, { fields: [payouts.bookingId], references: [bookings.id] }),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  user: one(users, { fields: [analyticsEvents.userId], references: [users.id] }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  adminUser: one(users, { fields: [auditLog.adminUserId], references: [users.id] }),
}));

export const disputesRelations = relations(disputes, ({ one }) => ({
  booking: one(bookings, { fields: [disputes.bookingId], references: [bookings.id] }),
  reporter: one(users, { fields: [disputes.reporterUserId], references: [users.id], relationName: "reporter" }),
  reported: one(users, { fields: [disputes.reportedUserId], references: [users.id], relationName: "reported" }),
  resolvedByUser: one(users, { fields: [disputes.resolvedBy], references: [users.id], relationName: "resolvedBy" }),
}));

export const searchQueriesRelations = relations(searchQueries, ({ one }) => ({
  user: one(users, { fields: [searchQueries.userId], references: [users.id] }),
  clickedListing: one(listings, { fields: [searchQueries.clickedListingId], references: [listings.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  userId: true,
});

export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertProviderSkillSchema = createInsertSchema(providerSkills).omit({
  id: true,
  createdAt: true,
});

export const insertPortfolioItemSchema = createInsertSchema(portfolioItems).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences);

export const insertEmailQueueSchema = createInsertSchema(emailQueue).omit({
  id: true,
  createdAt: true,
});

export const insertPayoutSchema = createInsertSchema(payouts).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  createdAt: true,
});

export const insertPlatformMetricSchema = createInsertSchema(platformMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  createdAt: true,
});

export const insertDisputeSchema = createInsertSchema(disputes).omit({
  id: true,
  createdAt: true,
});

export const insertSearchQuerySchema = createInsertSchema(searchQueries).omit({
  id: true,
  createdAt: true,
});

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  createdAt: true,
  status: true,
});

// Update schemas - only allow specific fields to be updated
export const updateListingSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  priceCents: z.number().int().min(0).optional(),
  images: z.array(z.object({
    url: z.string(),
    altText: z.string().optional(),
  })).optional(),
});

export const updateProfileSchema = z.object({
  bio: z.string().optional(),
  phoneNumber: z.string().optional(),
  location: z.string().optional(),
  serviceRadius: z.number().optional(),
  hourlyRate: z.number().optional(),
  yearsExperience: z.number().optional(),
  licenseNumber: z.string().optional(),
  insuranceInfo: z.string().optional(),
  profileImage: z.string().optional(),
});

export const updateBookingSchema = z.object({
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  notes: z.string().optional(),
  // Explicitly exclude: status, totalCents, escrowStatus, providerUserId, listingId
});

export const updatePortfolioItemSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  completedAt: z.string().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Listing = typeof listings.$inferSelect;
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Category = typeof categories.$inferSelect;
export type Thread = typeof threads.$inferSelect;
export type ProviderSkill = typeof providerSkills.$inferSelect;
export type InsertProviderSkill = z.infer<typeof insertProviderSkillSchema>;
export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type EmailQueue = typeof emailQueue.$inferSelect;
export type InsertEmailQueue = z.infer<typeof insertEmailQueueSchema>;
export type Payout = typeof payouts.$inferSelect;
export type InsertPayout = z.infer<typeof insertPayoutSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type PlatformMetric = typeof platformMetrics.$inferSelect;
export type InsertPlatformMetric = z.infer<typeof insertPlatformMetricSchema>;
export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type SearchQuery = typeof searchQueries.$inferSelect;
export type InsertSearchQuery = z.infer<typeof insertSearchQuerySchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;
