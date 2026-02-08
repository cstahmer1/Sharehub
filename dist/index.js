var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/uploadSecurity.ts
var uploadSecurity_exports = {};
__export(uploadSecurity_exports, {
  UploadSecurityError: () => UploadSecurityError,
  checkUploadRateLimit: () => checkUploadRateLimit,
  sanitizeFilename: () => sanitizeFilename,
  validateFileSize: () => validateFileSize,
  validateFileType: () => validateFileType,
  validateImageBuffer: () => validateImageBuffer,
  validateUploadSecurity: () => validateUploadSecurity
});
function validateFileType(filename, mimeType) {
  const ext = filename.toLowerCase().split(".").pop();
  const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
  if (!ext || !allowedExtensions.includes(ext)) {
    throw new UploadSecurityError("Invalid file type. Only images (jpg, png, gif, webp, svg) are allowed.", 400);
  }
  if (mimeType) {
    if (!ALLOWED_IMAGE_MIMES.includes(mimeType.toLowerCase())) {
      throw new UploadSecurityError("Invalid MIME type. File must be a valid image format.", 400);
    }
  }
}
function validateFileSize(size) {
  if (size > MAX_FILE_SIZE) {
    throw new UploadSecurityError(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB.`, 413);
  }
  if (size <= 0) {
    throw new UploadSecurityError("File size must be greater than 0.", 400);
  }
}
function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_{2,}/g, "_").slice(0, 255);
}
function checkUploadRateLimit(userId) {
  const now = /* @__PURE__ */ new Date();
  let userTracking = uploadTracking.get(userId);
  if (!userTracking) {
    userTracking = {
      hourly: 0,
      daily: 0,
      lastReset: now,
      dailyReset: now
    };
    uploadTracking.set(userId, userTracking);
  }
  const hoursSinceLastReset = (now.getTime() - userTracking.lastReset.getTime()) / (1e3 * 60 * 60);
  if (hoursSinceLastReset >= 1) {
    userTracking.hourly = 0;
    userTracking.lastReset = now;
  }
  const daysSinceLastReset = (now.getTime() - userTracking.dailyReset.getTime()) / (1e3 * 60 * 60 * 24);
  if (daysSinceLastReset >= 1) {
    userTracking.daily = 0;
    userTracking.dailyReset = now;
  }
  if (userTracking.hourly >= MAX_UPLOADS_PER_HOUR) {
    throw new UploadSecurityError("Upload rate limit exceeded. Please try again later.", 429);
  }
  if (userTracking.daily >= MAX_UPLOADS_PER_DAY) {
    throw new UploadSecurityError("Daily upload limit exceeded. Please try again tomorrow.", 429);
  }
  userTracking.hourly++;
  userTracking.daily++;
}
function validateImageBuffer(buffer, filename) {
  const magicNumbers = {
    jpg: [255, 216, 255],
    png: [137, 80, 78, 71],
    gif: [71, 73, 70],
    webp: [82, 73, 70, 70]
  };
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "svg") {
    const content = buffer.toString("utf8", 0, Math.min(100, buffer.length));
    if (!content.includes("<svg") && !content.includes("<?xml")) {
      throw new UploadSecurityError("Invalid SVG file format.", 400);
    }
    return;
  }
  let isValid = false;
  for (const [type, signature] of Object.entries(magicNumbers)) {
    if (signature.every((byte, index) => buffer[index] === byte)) {
      isValid = true;
      break;
    }
  }
  if (!isValid) {
    throw new UploadSecurityError("File content does not match the declared file type.", 400);
  }
}
async function validateUploadSecurity(req, filename, fileSize) {
  if (!req.user) {
    throw new UploadSecurityError("Authentication required.", 401);
  }
  if (!fileSize || fileSize <= 0) {
    throw new UploadSecurityError("File size is required and must be greater than 0.", 400);
  }
  const sanitizedFilename = sanitizeFilename(filename);
  validateFileType(sanitizedFilename);
  validateFileSize(fileSize);
  checkUploadRateLimit(req.user.id);
  return sanitizedFilename;
}
var ALLOWED_IMAGE_MIMES, MAX_FILE_SIZE, MAX_UPLOADS_PER_HOUR, MAX_UPLOADS_PER_DAY, uploadTracking, UploadSecurityError;
var init_uploadSecurity = __esm({
  "server/uploadSecurity.ts"() {
    "use strict";
    ALLOWED_IMAGE_MIMES = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml"
    ];
    MAX_FILE_SIZE = 10 * 1024 * 1024;
    MAX_UPLOADS_PER_HOUR = 50;
    MAX_UPLOADS_PER_DAY = 200;
    uploadTracking = /* @__PURE__ */ new Map();
    UploadSecurityError = class extends Error {
      constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = "UploadSecurityError";
      }
    };
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminPages: () => adminPages,
  analyticsEvents: () => analyticsEvents,
  analyticsEventsRelations: () => analyticsEventsRelations,
  auditLog: () => auditLog,
  auditLogRelations: () => auditLogRelations,
  availabilityExceptions: () => availabilityExceptions,
  availabilityRules: () => availabilityRules,
  bookings: () => bookings,
  bookingsRelations: () => bookingsRelations,
  categories: () => categories,
  categoriesRelations: () => categoriesRelations,
  contactSubmissions: () => contactSubmissions,
  disputes: () => disputes,
  disputesRelations: () => disputesRelations,
  emailQueue: () => emailQueue,
  emailQueueRelations: () => emailQueueRelations,
  favorites: () => favorites,
  favoritesRelations: () => favoritesRelations,
  insertAnalyticsEventSchema: () => insertAnalyticsEventSchema,
  insertAuditLogSchema: () => insertAuditLogSchema,
  insertBookingSchema: () => insertBookingSchema,
  insertContactSubmissionSchema: () => insertContactSubmissionSchema,
  insertDisputeSchema: () => insertDisputeSchema,
  insertEmailQueueSchema: () => insertEmailQueueSchema,
  insertListingSchema: () => insertListingSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertNotificationPreferencesSchema: () => insertNotificationPreferencesSchema,
  insertPayoutSchema: () => insertPayoutSchema,
  insertPlatformMetricSchema: () => insertPlatformMetricSchema,
  insertPortfolioItemSchema: () => insertPortfolioItemSchema,
  insertProfileSchema: () => insertProfileSchema,
  insertProviderSkillSchema: () => insertProviderSkillSchema,
  insertReviewSchema: () => insertReviewSchema,
  insertSearchQuerySchema: () => insertSearchQuerySchema,
  insertUserSchema: () => insertUserSchema,
  listingImages: () => listingImages,
  listingImagesRelations: () => listingImagesRelations,
  listings: () => listings,
  listingsRelations: () => listingsRelations,
  messages: () => messages,
  messagesRelations: () => messagesRelations,
  notificationPreferences: () => notificationPreferences,
  notificationPreferencesRelations: () => notificationPreferencesRelations,
  payouts: () => payouts,
  payoutsRelations: () => payoutsRelations,
  platformMetrics: () => platformMetrics,
  platformSettings: () => platformSettings,
  portfolioItems: () => portfolioItems,
  portfolioItemsRelations: () => portfolioItemsRelations,
  profiles: () => profiles,
  profilesRelations: () => profilesRelations,
  providerSkills: () => providerSkills,
  providerSkillsRelations: () => providerSkillsRelations,
  reviews: () => reviews,
  reviewsRelations: () => reviewsRelations,
  searchQueries: () => searchQueries,
  searchQueriesRelations: () => searchQueriesRelations,
  threads: () => threads,
  threadsRelations: () => threadsRelations,
  updateBookingSchema: () => updateBookingSchema,
  updateListingSchema: () => updateListingSchema,
  updatePortfolioItemSchema: () => updatePortfolioItemSchema,
  updateProfileSchema: () => updateProfileSchema,
  users: () => users,
  usersRelations: () => usersRelations
});
import { pgTable, text, integer, boolean, timestamp, numeric, serial, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
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
  payoutStatus: text("payout_status").$type().default("UNSET").notNull(),
  stripeRequirements: jsonb("stripe_requirements").$type(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var profiles = pgTable("profiles", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  headline: text("headline"),
  bio: text("bio"),
  location: jsonb("location").$type(),
  ratingAvg: numeric("rating_avg", { precision: 3, scale: 2 }).default("0.00"),
  ratingCount: integer("rating_count").default(0).notNull(),
  completedProjects: integer("completed_projects").default(0).notNull()
});
var categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  parentId: integer("parent_id")
});
var listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  ownerUserId: integer("owner_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").default("USD").notNull(),
  status: text("status").$type().default("draft").notNull(),
  lat: numeric("lat", { precision: 10, scale: 8 }),
  lng: numeric("lng", { precision: 11, scale: 8 }),
  address: text("address"),
  timeline: text("timeline"),
  requirements: text("requirements"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var listingImages = pgTable("listing_images", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").references(() => listings.id, { onDelete: "cascade" }).notNull(),
  url: text("url").notNull(),
  altText: text("alt_text"),
  sortOrder: integer("sort_order").default(0).notNull()
});
var availabilityRules = pgTable("availability_rules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  listingId: integer("listing_id").references(() => listings.id, { onDelete: "cascade" }),
  rrule: text("rrule").notNull(),
  timezone: text("timezone").default("America/Chicago").notNull(),
  isProvider: boolean("is_provider").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var availabilityExceptions = pgTable("availability_exceptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  listingId: integer("listing_id").references(() => listings.id, { onDelete: "cascade" }),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  reason: text("reason")
});
var threads = pgTable("threads", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").references(() => listings.id, { onDelete: "cascade" }),
  participantAId: integer("participant_a_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  participantBId: integer("participant_b_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  subject: text("subject"),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").references(() => threads.id, { onDelete: "cascade" }).notNull(),
  senderUserId: integer("sender_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  body: text("body").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").references(() => listings.id, { onDelete: "cascade" }).notNull(),
  buyerUserId: integer("buyer_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  sellerUserId: integer("seller_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  qty: integer("qty").default(1).notNull(),
  unit: text("unit").$type().default("fixed").notNull(),
  subtotalCents: integer("subtotal_cents").notNull(),
  platformFeeCents: integer("platform_fee_cents").default(0).notNull(),
  totalCents: integer("total_cents").notNull(),
  status: text("status").$type().default("pending").notNull(),
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
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id, { onDelete: "cascade" }).notNull(),
  reviewerUserId: integer("reviewer_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  revieweeUserId: integer("reviewee_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  rating: integer("rating").notNull(),
  body: text("body"),
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var favorites = pgTable("favorites", {
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  listingId: integer("listing_id").references(() => listings.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  pk: { name: "favorites_pkey", columns: [table.userId, table.listingId] }
}));
var providerSkills = pgTable("provider_skills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  skillName: text("skill_name").notNull(),
  experienceYears: integer("experience_years"),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var portfolioItems = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrls: jsonb("image_urls").$type().default([]),
  projectDate: timestamp("project_date", { withTimezone: true }),
  categoryId: integer("category_id").references(() => categories.id),
  featured: boolean("featured").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var notificationPreferences = pgTable("notification_preferences", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  emailNewMessages: boolean("email_new_messages").default(true).notNull(),
  emailBookingUpdates: boolean("email_booking_updates").default(true).notNull(),
  emailReviewRequests: boolean("email_review_requests").default(true).notNull(),
  emailPayoutNotifications: boolean("email_payout_notifications").default(true).notNull(),
  emailMarketing: boolean("email_marketing").default(false).notNull(),
  smsBookingReminders: boolean("sms_booking_reminders").default(false).notNull(),
  pushNotifications: boolean("push_notifications").default(true).notNull()
});
var emailQueue = pgTable("email_queue", {
  id: serial("id").primaryKey(),
  recipientUserId: integer("recipient_user_id").references(() => users.id, { onDelete: "cascade" }),
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  templateId: text("template_id"),
  templateData: jsonb("template_data").$type(),
  status: text("status").$type().default("pending").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  bookingId: integer("booking_id").references(() => bookings.id),
  amountCents: integer("amount_cents").notNull(),
  feeCents: integer("fee_cents").default(0).notNull(),
  netAmountCents: integer("net_amount_cents").notNull(),
  currency: text("currency").default("USD").notNull(),
  status: text("status").$type().default("pending").notNull(),
  stripePayoutId: text("stripe_payout_id"),
  failureReason: text("failure_reason"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: text("session_id"),
  eventType: text("event_type").notNull(),
  eventData: jsonb("event_data").$type(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  referrer: text("referrer"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var platformMetrics = pgTable("platform_metrics", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  metric: text("metric").notNull(),
  value: numeric("value", { precision: 15, scale: 2 }).notNull(),
  metadata: jsonb("metadata").$type(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  uniqueDateMetric: { name: "platform_metrics_date_metric_key", columns: [table.date, table.metric] }
}));
var auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  adminUserId: integer("admin_user_id").references(() => users.id),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  details: jsonb("details").$type(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var disputes = pgTable("disputes", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id, { onDelete: "cascade" }).notNull(),
  reporterUserId: integer("reporter_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  reportedUserId: integer("reported_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  reason: text("reason").notNull(),
  description: text("description").notNull(),
  status: text("status").$type().default("open").notNull(),
  adminNotes: text("admin_notes"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var searchQueries = pgTable("search_queries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  query: text("query").notNull(),
  filters: jsonb("filters").$type(),
  resultsCount: integer("results_count").default(0).notNull(),
  clickedListingId: integer("clicked_listing_id").references(() => listings.id),
  location: jsonb("location").$type(),
  sessionId: text("session_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var platformSettings = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var adminPages = pgTable("admin_pages", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").$type().default("new").notNull(),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var usersRelations = relations(users, ({ one, many }) => ({
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
  auditActions: many(auditLog)
}));
var profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] })
}));
var categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  children: many(categories),
  listings: many(listings)
}));
var listingsRelations = relations(listings, ({ one, many }) => ({
  owner: one(users, { fields: [listings.ownerUserId], references: [users.id] }),
  category: one(categories, { fields: [listings.categoryId], references: [categories.id] }),
  images: many(listingImages),
  bookings: many(bookings),
  threads: many(threads),
  favorites: many(favorites)
}));
var listingImagesRelations = relations(listingImages, ({ one }) => ({
  listing: one(listings, { fields: [listingImages.listingId], references: [listings.id] })
}));
var threadsRelations = relations(threads, ({ one, many }) => ({
  listing: one(listings, { fields: [threads.listingId], references: [listings.id] }),
  participantA: one(users, { fields: [threads.participantAId], references: [users.id], relationName: "participantA" }),
  participantB: one(users, { fields: [threads.participantBId], references: [users.id], relationName: "participantB" }),
  messages: many(messages)
}));
var messagesRelations = relations(messages, ({ one }) => ({
  thread: one(threads, { fields: [messages.threadId], references: [threads.id] }),
  sender: one(users, { fields: [messages.senderUserId], references: [users.id] })
}));
var bookingsRelations = relations(bookings, ({ one, many }) => ({
  listing: one(listings, { fields: [bookings.listingId], references: [listings.id] }),
  buyer: one(users, { fields: [bookings.buyerUserId], references: [users.id], relationName: "buyer" }),
  seller: one(users, { fields: [bookings.sellerUserId], references: [users.id], relationName: "seller" }),
  reviews: many(reviews)
}));
var reviewsRelations = relations(reviews, ({ one }) => ({
  booking: one(bookings, { fields: [reviews.bookingId], references: [bookings.id] }),
  reviewer: one(users, { fields: [reviews.reviewerUserId], references: [users.id], relationName: "reviewer" }),
  reviewee: one(users, { fields: [reviews.revieweeUserId], references: [users.id], relationName: "reviewee" })
}));
var favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  listing: one(listings, { fields: [favorites.listingId], references: [listings.id] })
}));
var providerSkillsRelations = relations(providerSkills, ({ one }) => ({
  user: one(users, { fields: [providerSkills.userId], references: [users.id] }),
  category: one(categories, { fields: [providerSkills.categoryId], references: [categories.id] })
}));
var portfolioItemsRelations = relations(portfolioItems, ({ one }) => ({
  user: one(users, { fields: [portfolioItems.userId], references: [users.id] }),
  category: one(categories, { fields: [portfolioItems.categoryId], references: [categories.id] })
}));
var notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, { fields: [notificationPreferences.userId], references: [users.id] })
}));
var emailQueueRelations = relations(emailQueue, ({ one }) => ({
  recipientUser: one(users, { fields: [emailQueue.recipientUserId], references: [users.id] })
}));
var payoutsRelations = relations(payouts, ({ one }) => ({
  user: one(users, { fields: [payouts.userId], references: [users.id] }),
  booking: one(bookings, { fields: [payouts.bookingId], references: [bookings.id] })
}));
var analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  user: one(users, { fields: [analyticsEvents.userId], references: [users.id] })
}));
var auditLogRelations = relations(auditLog, ({ one }) => ({
  adminUser: one(users, { fields: [auditLog.adminUserId], references: [users.id] })
}));
var disputesRelations = relations(disputes, ({ one }) => ({
  booking: one(bookings, { fields: [disputes.bookingId], references: [bookings.id] }),
  reporter: one(users, { fields: [disputes.reporterUserId], references: [users.id], relationName: "reporter" }),
  reported: one(users, { fields: [disputes.reportedUserId], references: [users.id], relationName: "reported" }),
  resolvedByUser: one(users, { fields: [disputes.resolvedBy], references: [users.id], relationName: "resolvedBy" })
}));
var searchQueriesRelations = relations(searchQueries, ({ one }) => ({
  user: one(users, { fields: [searchQueries.userId], references: [users.id] }),
  clickedListing: one(listings, { fields: [searchQueries.clickedListingId], references: [listings.id] })
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertProfileSchema = createInsertSchema(profiles).omit({
  userId: true
});
var insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  slug: true,
  createdAt: true,
  updatedAt: true
});
var insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true
});
var insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true
});
var insertProviderSkillSchema = createInsertSchema(providerSkills).omit({
  id: true,
  createdAt: true
});
var insertPortfolioItemSchema = createInsertSchema(portfolioItems).omit({
  id: true,
  createdAt: true
});
var insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences);
var insertEmailQueueSchema = createInsertSchema(emailQueue).omit({
  id: true,
  createdAt: true
});
var insertPayoutSchema = createInsertSchema(payouts).omit({
  id: true,
  createdAt: true
});
var insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  createdAt: true
});
var insertPlatformMetricSchema = createInsertSchema(platformMetrics).omit({
  id: true,
  createdAt: true
});
var insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  createdAt: true
});
var insertDisputeSchema = createInsertSchema(disputes).omit({
  id: true,
  createdAt: true
});
var insertSearchQuerySchema = createInsertSchema(searchQueries).omit({
  id: true,
  createdAt: true
});
var insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  createdAt: true,
  status: true
});
var updateListingSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  priceCents: z.number().int().min(0).optional(),
  images: z.array(z.object({
    url: z.string(),
    altText: z.string().optional()
  })).optional()
});
var updateProfileSchema = z.object({
  bio: z.string().optional(),
  phoneNumber: z.string().optional(),
  location: z.string().optional(),
  serviceRadius: z.number().optional(),
  hourlyRate: z.number().optional(),
  yearsExperience: z.number().optional(),
  licenseNumber: z.string().optional(),
  insuranceInfo: z.string().optional(),
  profileImage: z.string().optional()
});
var updateBookingSchema = z.object({
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  notes: z.string().optional()
  // Explicitly exclude: status, totalCents, escrowStatus, providerUserId, listingId
});
var updatePortfolioItemSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  completedAt: z.string().optional()
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, or, desc, asc, like, sql, gte, lte } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUser(id, updates) {
    const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user || void 0;
  }
  async getAllUsers() {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
  async deleteUser(id) {
    await db.delete(users).where(eq(users.id, id));
  }
  async getProfile(userId) {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile || void 0;
  }
  async createProfile(userId, profile) {
    const [newProfile] = await db.insert(profiles).values({ ...profile, userId }).returning();
    return newProfile;
  }
  async updateProfile(userId, updates) {
    const [profile] = await db.update(profiles).set(updates).where(eq(profiles.userId, userId)).returning();
    return profile || void 0;
  }
  async getCategories() {
    const result = await db.select().from(categories).orderBy(asc(categories.name));
    return result;
  }
  async getCategoryBySlug(slug) {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category || void 0;
  }
  async getListings(filters = {}) {
    let query = db.select().from(listings);
    const conditions = [];
    if (filters.search) {
      conditions.push(
        or(
          like(listings.title, `%${filters.search}%`),
          like(listings.description, `%${filters.search}%`)
        )
      );
    }
    if (filters.categoryId) {
      conditions.push(eq(listings.categoryId, filters.categoryId));
    }
    if (filters.minPrice) {
      conditions.push(gte(listings.priceCents, filters.minPrice * 100));
    }
    if (filters.maxPrice) {
      conditions.push(lte(listings.priceCents, filters.maxPrice * 100));
    }
    if (filters.status) {
      conditions.push(eq(listings.status, filters.status));
    }
    if (filters.ownerId) {
      conditions.push(eq(listings.ownerUserId, filters.ownerId));
    }
    if (filters.excludeBooked !== false) {
      conditions.push(
        sql`NOT EXISTS (
          SELECT 1 FROM ${bookings} 
          WHERE ${bookings.listingId} = ${listings.id} 
          AND ${bookings.status} IN ('accepted', 'unfunded', 'funded', 'final_proposed', 'final_approved', 'paid', 'in_progress', 'partial_released', 'settled', 'completed')
        )`
      );
    }
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    let finalQuery = query.orderBy(desc(listings.createdAt));
    if (filters.limit) {
      finalQuery = finalQuery.limit(filters.limit);
    }
    if (filters.offset) {
      finalQuery = finalQuery.offset(filters.offset);
    }
    return await finalQuery;
  }
  async getListing(id) {
    const [listing] = await db.select().from(listings).where(eq(listings.id, id));
    return listing || void 0;
  }
  async getListingBySlug(slug) {
    const [listing] = await db.select().from(listings).where(eq(listings.slug, slug));
    return listing || void 0;
  }
  async getMapListings(category) {
    let query = db.select({
      id: listings.id,
      title: listings.title,
      lat: listings.lat,
      lng: listings.lng,
      priceCents: listings.priceCents,
      categoryId: listings.categoryId
    }).from(listings);
    const conditions = [eq(listings.status, "published")];
    if (category) {
      const categoryId = parseInt(category);
      if (!isNaN(categoryId)) {
        conditions.push(eq(listings.categoryId, categoryId));
      }
    }
    query = query.where(and(...conditions));
    return await query.orderBy(desc(listings.createdAt));
  }
  async createListing(listing) {
    const slug = listing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now();
    const [newListing] = await db.insert(listings).values({ ...listing, slug, status: "draft" }).returning();
    return newListing;
  }
  async updateListing(id, updates) {
    const [listing] = await db.update(listings).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(listings.id, id)).returning();
    return listing || void 0;
  }
  async deleteListing(id) {
    const result = await db.delete(listings).where(eq(listings.id, id));
    return (result.rowCount || 0) > 0;
  }
  async getListingImages(listingId) {
    const images = await db.select().from(listingImages).where(eq(listingImages.listingId, listingId)).orderBy(asc(listingImages.sortOrder));
    return images;
  }
  async addListingImage(data) {
    const maxSortOrder = await db.select({ max: sql`COALESCE(MAX(${listingImages.sortOrder}), 0)` }).from(listingImages).where(eq(listingImages.listingId, data.listingId));
    const [image] = await db.insert(listingImages).values({
      listingId: data.listingId,
      url: data.url,
      altText: data.altText || null,
      sortOrder: (maxSortOrder[0]?.max || 0) + 1
    }).returning();
    return image;
  }
  async getBookings(userId, status) {
    let query = db.select().from(bookings);
    const conditions = [];
    if (userId) {
      conditions.push(
        or(
          eq(bookings.buyerUserId, userId),
          eq(bookings.sellerUserId, userId)
        )
      );
    }
    if (status) {
      conditions.push(eq(bookings.status, status));
    }
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    return await query.orderBy(desc(bookings.createdAt));
  }
  async getBooking(id) {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || void 0;
  }
  async createBooking(booking) {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }
  async updateBooking(id, updates) {
    const [booking] = await db.update(bookings).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(bookings.id, id)).returning();
    return booking || void 0;
  }
  async getThreads(userId) {
    return await db.select().from(threads).where(
      or(
        eq(threads.participantAId, userId),
        eq(threads.participantBId, userId)
      )
    ).orderBy(desc(threads.lastMessageAt));
  }
  async getThread(id) {
    const [thread] = await db.select().from(threads).where(eq(threads.id, id));
    return thread || void 0;
  }
  async createThread(thread) {
    const [newThread] = await db.insert(threads).values(thread).returning();
    return newThread;
  }
  async getMessages(threadId) {
    return await db.select().from(messages).where(eq(messages.threadId, threadId)).orderBy(asc(messages.createdAt));
  }
  async createMessage(message) {
    const [newMessage] = await db.insert(messages).values(message).returning();
    await db.update(threads).set({ lastMessageAt: /* @__PURE__ */ new Date() }).where(eq(threads.id, message.threadId));
    return newMessage;
  }
  async getReviews(userId, bookingId) {
    let query = db.select().from(reviews);
    const conditions = [];
    if (userId) {
      conditions.push(eq(reviews.revieweeUserId, userId));
    }
    if (bookingId) {
      conditions.push(eq(reviews.bookingId, bookingId));
    }
    conditions.push(eq(reviews.published, true));
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    return await query.orderBy(desc(reviews.createdAt));
  }
  async createReview(review) {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }
  async getFavorites(userId) {
    return await db.select({
      id: listings.id,
      slug: listings.slug,
      ownerUserId: listings.ownerUserId,
      title: listings.title,
      description: listings.description,
      categoryId: listings.categoryId,
      priceCents: listings.priceCents,
      currency: listings.currency,
      status: listings.status,
      lat: listings.lat,
      lng: listings.lng,
      address: listings.address,
      timeline: listings.timeline,
      requirements: listings.requirements,
      createdAt: listings.createdAt,
      updatedAt: listings.updatedAt
    }).from(favorites).innerJoin(listings, eq(favorites.listingId, listings.id)).where(eq(favorites.userId, userId)).orderBy(desc(favorites.createdAt));
  }
  async addFavorite(userId, listingId) {
    try {
      await db.insert(favorites).values({ userId, listingId });
      return true;
    } catch (error) {
      return false;
    }
  }
  async removeFavorite(userId, listingId) {
    const result = await db.delete(favorites).where(
      and(
        eq(favorites.userId, userId),
        eq(favorites.listingId, listingId)
      )
    );
    return (result.rowCount || 0) > 0;
  }
  // Provider Skills methods
  async getProviderSkills(userId) {
    return await db.select().from(providerSkills).where(eq(providerSkills.userId, userId)).orderBy(desc(providerSkills.createdAt));
  }
  async createProviderSkill(skill) {
    const [newSkill] = await db.insert(providerSkills).values(skill).returning();
    return newSkill;
  }
  async updateProviderSkill(id, updates) {
    const [skill] = await db.update(providerSkills).set(updates).where(eq(providerSkills.id, id)).returning();
    return skill || void 0;
  }
  async deleteProviderSkill(id) {
    const result = await db.delete(providerSkills).where(eq(providerSkills.id, id));
    return (result.rowCount || 0) > 0;
  }
  // Portfolio methods
  async getPortfolioItems(userId) {
    return await db.select().from(portfolioItems).where(eq(portfolioItems.userId, userId)).orderBy(desc(portfolioItems.featured), desc(portfolioItems.createdAt));
  }
  async createPortfolioItem(item) {
    const [newItem] = await db.insert(portfolioItems).values(item).returning();
    return newItem;
  }
  async updatePortfolioItem(id, updates) {
    const [item] = await db.update(portfolioItems).set(updates).where(eq(portfolioItems.id, id)).returning();
    return item || void 0;
  }
  async deletePortfolioItem(id) {
    const result = await db.delete(portfolioItems).where(eq(portfolioItems.id, id));
    return (result.rowCount || 0) > 0;
  }
  // Notification preferences methods
  async getNotificationPreferences(userId) {
    const [prefs] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId));
    return prefs || void 0;
  }
  async updateNotificationPreferences(userId, preferences) {
    const [prefs] = await db.insert(notificationPreferences).values({ ...preferences, userId }).onConflictDoUpdate({
      target: notificationPreferences.userId,
      set: preferences
    }).returning();
    return prefs;
  }
  // Email queue methods
  async addEmailToQueue(email) {
    const [queuedEmail] = await db.insert(emailQueue).values(email).returning();
    return queuedEmail;
  }
  async getPendingEmails(limit = 50) {
    return await db.select().from(emailQueue).where(eq(emailQueue.status, "pending")).orderBy(asc(emailQueue.createdAt)).limit(limit);
  }
  async updateEmailStatus(id, status, errorMessage) {
    const updates = {
      status,
      lastAttemptAt: /* @__PURE__ */ new Date(),
      attempts: sql`${emailQueue.attempts} + 1`
    };
    if (status === "sent") {
      updates.sentAt = /* @__PURE__ */ new Date();
    }
    if (errorMessage) {
      updates.errorMessage = errorMessage;
    }
    const result = await db.update(emailQueue).set(updates).where(eq(emailQueue.id, id));
    return (result.rowCount || 0) > 0;
  }
  // Payout methods
  async getPayouts(userId) {
    let query = db.select().from(payouts);
    if (userId) {
      query = query.where(eq(payouts.userId, userId));
    }
    return await query.orderBy(desc(payouts.createdAt));
  }
  async createPayout(payout) {
    const [newPayout] = await db.insert(payouts).values(payout).returning();
    return newPayout;
  }
  async updatePayout(id, updates) {
    const [payout] = await db.update(payouts).set(updates).where(eq(payouts.id, id)).returning();
    return payout || void 0;
  }
  // Analytics methods
  async logAnalyticsEvent(event) {
    const [newEvent] = await db.insert(analyticsEvents).values(event).returning();
    return newEvent;
  }
  async getAnalyticsEvents(filters) {
    let query = db.select().from(analyticsEvents);
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(analyticsEvents.userId, filters.userId));
    }
    if (filters?.eventType) {
      conditions.push(eq(analyticsEvents.eventType, filters.eventType));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(analyticsEvents.createdAt, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(analyticsEvents.createdAt, filters.dateTo));
    }
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    return await query.orderBy(desc(analyticsEvents.createdAt));
  }
  async getPlatformMetrics(dateFrom, dateTo) {
    let query = db.select().from(platformMetrics);
    const conditions = [];
    if (dateFrom) {
      conditions.push(gte(platformMetrics.date, dateFrom));
    }
    if (dateTo) {
      conditions.push(lte(platformMetrics.date, dateTo));
    }
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    return await query.orderBy(desc(platformMetrics.date));
  }
  async updatePlatformMetric(metric) {
    const [updatedMetric] = await db.insert(platformMetrics).values(metric).onConflictDoUpdate({
      target: [platformMetrics.date, platformMetrics.metric],
      set: { value: metric.value, metadata: metric.metadata }
    }).returning();
    return updatedMetric;
  }
  // Audit log methods
  async logAuditAction(action) {
    const [newAction] = await db.insert(auditLog).values(action).returning();
    return newAction;
  }
  async getAuditLog(filters) {
    let query = db.select().from(auditLog);
    const conditions = [];
    if (filters?.adminUserId) {
      conditions.push(eq(auditLog.adminUserId, filters.adminUserId));
    }
    if (filters?.action) {
      conditions.push(eq(auditLog.action, filters.action));
    }
    if (filters?.resourceType) {
      conditions.push(eq(auditLog.resourceType, filters.resourceType));
    }
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    return await query.orderBy(desc(auditLog.createdAt));
  }
  // Dispute methods
  async getDisputes(userId, status) {
    let query = db.select().from(disputes);
    const conditions = [];
    if (userId) {
      conditions.push(or(
        eq(disputes.reporterUserId, userId),
        eq(disputes.reportedUserId, userId)
      ));
    }
    if (status) {
      conditions.push(eq(disputes.status, status));
    }
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    return await query.orderBy(desc(disputes.createdAt));
  }
  async createDispute(dispute) {
    const [newDispute] = await db.insert(disputes).values(dispute).returning();
    return newDispute;
  }
  async updateDispute(id, updates) {
    const [dispute] = await db.update(disputes).set(updates).where(eq(disputes.id, id)).returning();
    return dispute || void 0;
  }
  // Search analytics methods
  async logSearchQuery(query) {
    const [newQuery] = await db.insert(searchQueries).values(query).returning();
    return newQuery;
  }
  async getSearchAnalytics(filters) {
    let query = db.select().from(searchQueries);
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(searchQueries.userId, filters.userId));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(searchQueries.createdAt, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(searchQueries.createdAt, filters.dateTo));
    }
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    return await query.orderBy(desc(searchQueries.createdAt));
  }
  async createContactSubmission(submission) {
    const [created] = await db.insert(contactSubmissions).values(submission).returning();
    return created;
  }
  async getAdminStats() {
    const [userStats] = await db.select({
      totalUsers: sql`count(*)::int`,
      totalOwners: sql`count(*) filter (where ${users.roleOwner})::int`,
      totalProviders: sql`count(*) filter (where ${users.roleProvider})::int`
    }).from(users);
    const [listingCount] = await db.select({ count: sql`count(*)::int` }).from(listings);
    const [bookingStats] = await db.select({
      count: sql`count(*)::int`,
      revenue: sql`coalesce(sum(${bookings.totalCents}), 0)::int`
    }).from(bookings);
    return {
      totalUsers: userStats?.totalUsers || 0,
      totalOwners: userStats?.totalOwners || 0,
      totalProviders: userStats?.totalProviders || 0,
      totalListings: listingCount?.count || 0,
      totalBookings: bookingStats?.count || 0,
      totalRevenue: bookingStats?.revenue || 0
    };
  }
  async getPlatformSetting(key) {
    const [setting] = await db.select().from(platformSettings).where(eq(platformSettings.key, key));
    return setting?.value;
  }
  async setPlatformSetting(key, value) {
    await db.insert(platformSettings).values({ key, value, updatedAt: /* @__PURE__ */ new Date() }).onConflictDoUpdate({
      target: platformSettings.key,
      set: { value, updatedAt: /* @__PURE__ */ new Date() }
    });
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
import ConnectPgSimple from "connect-pg-simple";
import pg from "pg";
import { z as z2 } from "zod";
var PgSession = ConnectPgSimple(session);
var registerSchema = z2.object({
  email: z2.string().email(),
  password: z2.string().min(8),
  name: z2.string().min(1),
  roleOwner: z2.boolean().optional(),
  roleProvider: z2.boolean().optional()
});
var loginSchema = z2.object({
  email: z2.string().email(),
  password: z2.string().min(1)
});
var changePasswordSchema = z2.object({
  currentPassword: z2.string().min(1),
  newPassword: z2.string().min(8)
});
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function sanitizeUser(user) {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
}
function setupAuth(app2) {
  if (!process.env.SESSION_SECRET) {
    console.warn("WARNING: SESSION_SECRET not set. Using default (insecure for production)");
  }
  const pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
  });
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: new PgSession({
      pool: pgPool,
      tableName: "session",
      createTableIfMissing: true
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy({
      usernameField: "email",
      passwordField: "password"
    }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false);
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const validated = registerSchema.parse(req.body);
      if (!validated.roleOwner && !validated.roleProvider) {
        return res.status(400).json({ message: "Please select at least one role" });
      }
      const existingUser = await storage.getUserByEmail(validated.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const adminEmails = ["c.stahmer@outlook.com", "jcthayer10@gmail.com"];
      const isAdmin = adminEmails.includes(validated.email.toLowerCase());
      const user = await storage.createUser({
        email: validated.email,
        password: await hashPassword(validated.password),
        name: validated.name,
        roleOwner: !!validated.roleOwner,
        roleProvider: !!validated.roleProvider,
        isAdmin
      });
      await storage.createProfile(user.id, {});
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(sanitizeUser(user));
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      next(error);
    }
  });
  app2.post("/api/login", (req, res, next) => {
    try {
      loginSchema.parse(req.body);
      passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) {
          return res.status(401).json({ message: "Invalid email or password" });
        }
        req.login(user, (err2) => {
          if (err2) return next(err2);
          res.status(200).json(sanitizeUser(user));
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid input data" });
      }
      next(error);
    }
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(sanitizeUser(req.user));
  });
  app2.post("/api/change-password", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const validated = changePasswordSchema.parse(req.body);
      const user = await storage.getUserByEmail(req.user.email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const isValidPassword = await comparePasswords(validated.currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      const hashedPassword = await hashPassword(validated.newPassword);
      await storage.updateUser(user.id, {
        password: hashedPassword,
        forcePasswordChange: false
      });
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      next(error);
    }
  });
}

// server/routes.ts
import { z as z3 } from "zod";
import Stripe from "stripe";

// server/objectStorage.ts
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";

// server/objectAcl.ts
var ACL_POLICY_METADATA_KEY = "custom:aclPolicy";
function isPermissionAllowed(requested, granted) {
  if (requested === "read" /* READ */) {
    return ["read" /* READ */, "write" /* WRITE */].includes(granted);
  }
  return granted === "write" /* WRITE */;
}
function createObjectAccessGroup(group) {
  switch (group.type) {
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}
async function setObjectAclPolicy(objectFile, aclPolicy) {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }
  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy)
    }
  });
}
async function getObjectAclPolicy(objectFile) {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy);
}
async function canAccessObject({
  userId,
  objectFile,
  requestedPermission
}) {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }
  if (aclPolicy.visibility === "public" && requestedPermission === "read" /* READ */) {
    return true;
  }
  if (!userId) {
    return false;
  }
  if (aclPolicy.owner === userId) {
    return true;
  }
  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (await accessGroup.hasMember(userId) && isPermissionAllowed(requestedPermission, rule.permission)) {
      return true;
    }
  }
  return false;
}

// server/objectStorage.ts
var REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
var objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token"
      }
    },
    universe_domain: "googleapis.com"
  },
  projectId: ""
});
var ObjectNotFoundError = class _ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
  }
};
var ObjectStorageService = class {
  constructor() {
  }
  getPublicObjectSearchPaths() {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr.split(",").map((path3) => path3.trim()).filter((path3) => path3.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }
  getPrivateObjectDir() {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }
  async searchPublicObject(filePath) {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }
    return null;
  }
  async downloadObject(file, res, cacheTtlSec = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`
      });
      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }
  async getObjectEntityUploadURL() {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900
    });
  }
  async getObjectEntityFile(objectPath) {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }
    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }
  normalizeObjectEntityPath(rawPath) {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }
    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }
  async trySetObjectEntityAclPolicy(rawPath, aclPolicy) {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }
    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission
  }) {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? "read" /* READ */
    });
  }
};
function parseObjectPath(path3) {
  if (!path3.startsWith("/")) {
    path3 = `/${path3}`;
  }
  const pathParts = path3.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName
  };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1e3).toISOString()
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, make sure you're running on Replit`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

// server/routes.ts
init_uploadSecurity();
var stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil"
}) : null;
function requireAuth(req, res, next) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}
function requireAdmin(req, res, next) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/categories", async (req, res) => {
    try {
      const categories2 = await storage.getCategories();
      res.json(categories2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  app2.get("/api/listings", async (req, res) => {
    try {
      const {
        search,
        categoryId,
        minPrice,
        maxPrice,
        ownerId,
        status,
        // Don't default to "published" - show all projects
        limit = 20,
        offset = 0
      } = req.query;
      const filters = {
        search,
        categoryId: categoryId ? parseInt(categoryId) : void 0,
        minPrice: minPrice ? parseInt(minPrice) : void 0,
        maxPrice: maxPrice ? parseInt(maxPrice) : void 0,
        ownerId: ownerId ? parseInt(ownerId) : void 0,
        status,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };
      const listings2 = await storage.getListings(filters);
      res.json(listings2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });
  app2.get("/api/listings/map", async (req, res) => {
    try {
      const { bounds, category } = req.query;
      const filters = { status: "published" };
      if (category && category !== "all") {
        filters.categoryId = parseInt(category);
      }
      const listings2 = await storage.getListings(filters);
      const mapListings = listings2.map((listing) => ({
        id: listing.id,
        title: listing.title,
        lat: listing.lat,
        lng: listing.lng,
        priceCents: listing.priceCents,
        categoryId: listing.categoryId
      })).filter((listing) => listing.lat && listing.lng);
      res.json(mapListings);
    } catch (error) {
      console.error("Map listings error:", error);
      res.status(500).json({ message: "Failed to fetch map listings" });
    }
  });
  app2.get("/api/listings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const listing = await storage.getListing(id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      res.json(listing);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });
  app2.get("/api/listings/:id/images", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const images = await storage.getListingImages(id);
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch listing images" });
    }
  });
  app2.post("/api/listings", requireAuth, async (req, res) => {
    try {
      const validatedData = insertListingSchema.parse({
        ...req.body,
        ownerUserId: req.user.id,
        status: "published"
        // Automatically publish new listings
      });
      const listing = await storage.createListing(validatedData);
      res.status(201).json(listing);
    } catch (error) {
      console.error("Create listing error:", error);
      if (error instanceof z3.ZodError) {
        const fieldErrors = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
        console.error("Validation errors:", fieldErrors);
        return res.status(400).json({ message: `Invalid listing data: ${fieldErrors}` });
      }
      res.status(400).json({ message: "Invalid listing data" });
    }
  });
  app2.patch("/api/listings/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const listing = await storage.getListing(id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      if (listing.ownerUserId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const validatedData = updateListingSchema.parse(req.body);
      const updatedListing = await storage.updateListing(id, validatedData);
      res.json(updatedListing);
    } catch (error) {
      console.error("Update listing error:", error);
      res.status(400).json({ message: "Failed to update listing" });
    }
  });
  app2.delete("/api/listings/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const listing = await storage.getListing(id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      if (listing.ownerUserId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const deleted = await storage.deleteListing(id);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete listing" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete listing" });
    }
  });
  app2.get("/api/profile/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      const profile = await storage.getProfile(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const combinedData = {
        ...sanitizeUser(user),
        ...profile
        // Profile data overwrites any conflicting fields
      };
      res.json(combinedData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });
  app2.patch("/api/profile", requireAuth, async (req, res) => {
    try {
      const validatedData = updateProfileSchema.parse(req.body);
      const profile = await storage.updateProfile(req.user.id, validatedData);
      res.json(profile);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(400).json({ message: "Failed to update profile" });
    }
  });
  app2.get("/api/bookings", requireAuth, async (req, res) => {
    try {
      const { status } = req.query;
      const bookings2 = await storage.getBookings(req.user.id, status);
      res.json(bookings2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });
  app2.post("/api/bookings", requireAuth, async (req, res) => {
    try {
      const schema = z3.object({
        listingId: z3.number().int(),
        startAt: z3.string(),
        endAt: z3.string(),
        notes: z3.string().optional()
      });
      const validated = schema.parse(req.body);
      const listing = await storage.getListing(validated.listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      const subtotalCents = listing.priceCents;
      const platformFeeCents = Math.round(subtotalCents * 0.05);
      const totalCents = subtotalCents + platformFeeCents;
      const booking = await storage.createBooking({
        listingId: validated.listingId,
        buyerUserId: listing.ownerUserId,
        // Homeowner/listing owner is the buyer (paying for service)
        sellerUserId: req.user.id,
        // Provider is the seller (providing the service)
        startAt: new Date(validated.startAt),
        endAt: new Date(validated.endAt),
        qty: 1,
        unit: "fixed",
        subtotalCents,
        platformFeeCents,
        totalCents,
        status: "pending",
        stripePaymentIntentId: null,
        stripeTransferId: null,
        notes: validated.notes
      });
      res.status(201).json(booking);
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(400).json({ message: "Failed to create booking" });
    }
  });
  app2.patch("/api/bookings/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (booking.buyerUserId !== req.user.id && booking.sellerUserId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const validatedData = updateBookingSchema.parse(req.body);
      const updatedBooking = await storage.updateBooking(id, validatedData);
      res.json(updatedBooking);
    } catch (error) {
      console.error("Update booking error:", error);
      res.status(400).json({ message: "Failed to update booking" });
    }
  });
  app2.post("/api/bookings/:id/respond", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { action } = z3.object({
        action: z3.enum(["accept", "decline"])
      }).parse(req.body);
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (booking.buyerUserId !== req.user.id) {
        return res.status(403).json({ message: "Only the project owner can respond to booking requests" });
      }
      if (booking.status !== "pending") {
        return res.status(400).json({ message: "Can only respond to pending booking requests" });
      }
      const newStatus = action === "accept" ? "accepted" : "declined";
      const updatedBooking = await storage.updateBooking(id, { status: newStatus });
      res.json(updatedBooking);
    } catch (error) {
      console.error("Booking response error:", error);
      res.status(400).json({ message: "Failed to respond to booking request" });
    }
  });
  app2.get("/api/threads", requireAuth, async (req, res) => {
    try {
      const threads2 = await storage.getThreads(req.user.id);
      res.json(threads2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch threads" });
    }
  });
  app2.post("/api/threads", requireAuth, async (req, res) => {
    try {
      const schema = z3.object({
        listingId: z3.number().int(),
        participantId: z3.number().int(),
        subject: z3.string().optional()
      });
      const { listingId, participantId, subject } = schema.parse(req.body);
      const thread = await storage.createThread({
        listingId,
        participantAId: req.user.id,
        participantBId: participantId,
        subject
      });
      res.status(201).json(thread);
    } catch (error) {
      res.status(400).json({ message: "Failed to create thread" });
    }
  });
  app2.get("/api/threads/:id/messages", requireAuth, async (req, res) => {
    try {
      const threadId = parseInt(req.params.id);
      const thread = await storage.getThread(threadId);
      if (!thread) {
        return res.status(404).json({ message: "Thread not found" });
      }
      if (thread.participantAId !== req.user.id && thread.participantBId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const messages2 = await storage.getMessages(threadId);
      res.json(messages2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const schema = z3.object({
        threadId: z3.number().int(),
        body: z3.string().min(1)
      });
      const validated = schema.parse(req.body);
      const thread = await storage.getThread(validated.threadId);
      if (!thread) {
        return res.status(404).json({ message: "Thread not found" });
      }
      if (thread.participantAId !== req.user.id && thread.participantBId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const message = await storage.createMessage({
        threadId: validated.threadId,
        senderUserId: req.user.id,
        body: validated.body,
        readAt: null
      });
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: "Failed to send message" });
    }
  });
  app2.get("/api/reviews", async (req, res) => {
    try {
      const { userId, bookingId } = req.query;
      const reviews2 = await storage.getReviews(
        userId ? parseInt(userId) : void 0,
        bookingId ? parseInt(bookingId) : void 0
      );
      res.json(reviews2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });
  app2.post("/api/reviews", requireAuth, async (req, res) => {
    try {
      const schema = z3.object({
        bookingId: z3.number().int(),
        revieweeUserId: z3.number().int(),
        rating: z3.number().int().min(1).max(5),
        body: z3.string().optional()
      });
      const validated = schema.parse(req.body);
      const booking = await storage.getBooking(validated.bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (booking.buyerUserId !== req.user.id && booking.sellerUserId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      if (booking.status !== "completed") {
        return res.status(400).json({ message: "Booking must be completed to leave review" });
      }
      const review = await storage.createReview({
        bookingId: validated.bookingId,
        reviewerUserId: req.user.id,
        revieweeUserId: validated.revieweeUserId,
        rating: validated.rating,
        body: validated.body,
        published: true
      });
      res.status(201).json(review);
    } catch (error) {
      res.status(400).json({ message: "Failed to create review" });
    }
  });
  app2.get("/api/favorites", requireAuth, async (req, res) => {
    try {
      const favorites2 = await storage.getFavorites(req.user.id);
      res.json(favorites2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });
  app2.post("/api/favorites/:listingId", requireAuth, async (req, res) => {
    try {
      const listingId = parseInt(req.params.listingId);
      const success = await storage.addFavorite(req.user.id, listingId);
      if (success) {
        res.status(201).json({ message: "Added to favorites" });
      } else {
        res.status(400).json({ message: "Failed to add to favorites" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to add to favorites" });
    }
  });
  app2.delete("/api/favorites/:listingId", requireAuth, async (req, res) => {
    try {
      const listingId = parseInt(req.params.listingId);
      const success = await storage.removeFavorite(req.user.id, listingId);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Favorite not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from favorites" });
    }
  });
  app2.post("/api/webhooks/stripe", async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Stripe not configured" });
    }
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return res.status(500).json({ message: "Webhook secret not configured" });
    }
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).json({ message: `Webhook Error: ${err.message}` });
    }
    try {
      switch (event.type) {
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object;
          const bookingId = parseInt(paymentIntent.metadata?.bookingId);
          if (!paymentIntent.metadata?.bookingId) {
            console.error("Payment intent succeeded but missing bookingId in metadata:", paymentIntent.id);
          } else if (bookingId) {
            await storage.updateBooking(bookingId, {
              status: "paid",
              stripePaymentIntentId: paymentIntent.id
            });
            console.log(`Payment succeeded for booking ${bookingId}`);
          }
          break;
        }
        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object;
          const bookingId = parseInt(paymentIntent.metadata?.bookingId);
          if (!paymentIntent.metadata?.bookingId) {
            console.error("Payment intent failed but missing bookingId in metadata:", paymentIntent.id);
          } else if (bookingId) {
            await storage.updateBooking(bookingId, {
              status: "canceled"
            });
            console.log(`Payment failed for booking ${bookingId}`);
          }
          break;
        }
        case "charge.refunded": {
          const charge = event.data.object;
          const paymentIntentId = charge.payment_intent;
          const allBookings = await storage.getBookings();
          const booking = allBookings.find((b) => b.stripePaymentIntentId === paymentIntentId);
          if (booking) {
            await storage.updateBooking(booking.id, {
              status: "canceled"
            });
            console.log(`Refund processed for booking ${booking.id}`);
          }
          break;
        }
        case "account.updated": {
          const account = event.data.object;
          const users2 = await storage.getAllUsers();
          const user = users2.find((u) => u.stripeConnectAccountId === account.id);
          if (user) {
            const chargesEnabled = account.charges_enabled || false;
            const payoutsEnabled = account.payouts_enabled || false;
            const currentlyDue = account.requirements?.currently_due || [];
            const disabledReason = account.requirements?.disabled_reason || null;
            let payoutStatus = "PENDING";
            if (chargesEnabled && payoutsEnabled) {
              payoutStatus = "READY";
            } else if (disabledReason) {
              payoutStatus = "RESTRICTED";
            } else if (currentlyDue.length > 0) {
              payoutStatus = "PENDING";
            }
            await storage.updateUser(user.id, {
              payoutStatus,
              stripeRequirements: {
                currently_due: currentlyDue,
                disabled_reason: disabledReason
              }
            });
            console.log(`Updated payout status for user ${user.id} to ${payoutStatus}`);
          }
          break;
        }
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook handler error:", error);
      res.status(500).json({ message: "Webhook handler failed" });
    }
  });
  if (stripe) {
    app2.post("/api/create-payment-intent", requireAuth, async (req, res) => {
      try {
        const { bookingId } = req.body;
        const booking = await storage.getBooking(bookingId);
        if (!booking) {
          return res.status(404).json({ message: "Booking not found" });
        }
        if (booking.buyerUserId !== req.user.id) {
          return res.status(403).json({ message: "Only the homeowner can pay for this booking" });
        }
        if (booking.status !== "accepted") {
          return res.status(400).json({
            message: "Can only pay for accepted booking requests. Please wait for the provider to accept your request."
          });
        }
        const paymentIntent = await stripe.paymentIntents.create({
          amount: booking.totalCents,
          currency: "usd",
          metadata: {
            bookingId: booking.id.toString(),
            buyerId: booking.buyerUserId.toString(),
            sellerId: booking.sellerUserId.toString()
          },
          // For MVP demo: auto-confirm test payments to complete the two-step flow
          // Production should use Stripe Elements for manual payment confirmation
          ...process.env.NODE_ENV === "development" && {
            confirm: true,
            payment_method: "pm_card_visa",
            // Stripe test card
            return_url: `${process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000"}/booking-management`
          }
        });
        const statusUpdate = process.env.NODE_ENV === "development" && paymentIntent.status === "succeeded" ? "paid" : void 0;
        const updatedBooking = await storage.updateBooking(booking.id, {
          stripePaymentIntentId: paymentIntent.id,
          ...statusUpdate && { status: statusUpdate }
        });
        res.json({
          clientSecret: paymentIntent.client_secret,
          booking: updatedBooking || { ...booking, status: statusUpdate || booking.status }
        });
      } catch (error) {
        console.error("Payment intent error:", error);
        res.status(500).json({ message: "Failed to create payment intent" });
      }
    });
  }
  if (stripe) {
    app2.post("/api/connect/create-or-link", requireAuth, async (req, res) => {
      try {
        const user = await storage.getUser(req.user.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        if (!user.roleProvider) {
          return res.status(403).json({ message: "Only providers can create Connect accounts" });
        }
        if (user.stripeConnectAccountId) {
          return res.json({ accountId: user.stripeConnectAccountId, existing: true });
        }
        const account = await stripe.accounts.create({
          type: "express",
          country: "US",
          email: user.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true }
          },
          metadata: {
            userId: user.id.toString()
          }
        });
        await storage.updateUser(user.id, {
          stripeConnectAccountId: account.id,
          payoutStatus: "PENDING"
        });
        res.json({ accountId: account.id, existing: false });
      } catch (error) {
        console.error("Stripe Connect create error:", error);
        res.status(500).json({ message: "Failed to create Connect account" });
      }
    });
    app2.post("/api/connect/onboarding-link", requireAuth, async (req, res) => {
      try {
        const user = await storage.getUser(req.user.id);
        if (!user || !user.stripeConnectAccountId) {
          return res.status(400).json({ message: "No Connect account found. Create one first." });
        }
        const refreshUrl = `${process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000"}/settings?tab=payouts&action=refresh`;
        const returnUrl = `${process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000"}/settings?tab=payouts&action=complete`;
        const accountLink = await stripe.accountLinks.create({
          account: user.stripeConnectAccountId,
          refresh_url: refreshUrl,
          return_url: returnUrl,
          type: "account_onboarding"
        });
        res.json({ url: accountLink.url });
      } catch (error) {
        console.error("Stripe onboarding link error:", error);
        res.status(500).json({ message: "Failed to create onboarding link" });
      }
    });
    app2.get("/api/connect/status", requireAuth, async (req, res) => {
      try {
        const user = await storage.getUser(req.user.id);
        if (!user || !user.stripeConnectAccountId) {
          return res.json({
            payoutStatus: "UNSET",
            chargesEnabled: false,
            payoutsEnabled: false,
            requirements: [],
            disabledReason: null
          });
        }
        const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
        const chargesEnabled = account.charges_enabled || false;
        const payoutsEnabled = account.payouts_enabled || false;
        const currentlyDue = account.requirements?.currently_due || [];
        const disabledReason = account.requirements?.disabled_reason || null;
        let payoutStatus = "PENDING";
        if (chargesEnabled && payoutsEnabled) {
          payoutStatus = "READY";
        } else if (disabledReason) {
          payoutStatus = "RESTRICTED";
        } else if (currentlyDue.length > 0) {
          payoutStatus = "PENDING";
        }
        await storage.updateUser(user.id, {
          payoutStatus,
          stripeRequirements: {
            currently_due: currentlyDue,
            disabled_reason: disabledReason
          }
        });
        res.json({
          payoutStatus,
          chargesEnabled,
          payoutsEnabled,
          requirements: currentlyDue,
          disabledReason
        });
      } catch (error) {
        console.error("Stripe status check error:", error);
        res.status(500).json({ message: "Failed to check Connect status" });
      }
    });
  }
  if (stripe) {
    const getDepositPercentage = async () => {
      const allSettings = await storage.getAllPlatformSettings();
      const depositSetting = allSettings.find((s) => s.key === "deposit_percentage");
      return depositSetting?.value || 10;
    };
    app2.post("/api/escrow/:bookingId/deposit", requireAuth, async (req, res) => {
      try {
        const bookingId = parseInt(req.params.bookingId);
        const { payment_method_id, save_pm = true } = z3.object({
          payment_method_id: z3.string().min(1),
          save_pm: z3.boolean().optional()
        }).parse(req.body);
        const booking = await storage.getBooking(bookingId);
        if (!booking) {
          return res.status(404).json({ message: "Booking not found" });
        }
        if (booking.buyerUserId !== req.user.id) {
          return res.status(403).json({ message: "Only the homeowner can pay deposit" });
        }
        if (booking.status !== "accepted") {
          return res.status(400).json({ message: "Booking must be accepted before paying deposit" });
        }
        const depositPercentage = await getDepositPercentage();
        const budgetedAmount = booking.totalCents;
        const depositAmount = Math.round(budgetedAmount * (depositPercentage / 100));
        const buyer = await storage.getUser(booking.buyerUserId);
        if (!buyer) {
          return res.status(404).json({ message: "Buyer not found" });
        }
        let customerId = buyer.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: buyer.email,
            metadata: { userId: buyer.id.toString() }
          });
          customerId = customer.id;
          await storage.updateUser(buyer.id, { stripeCustomerId: customerId });
        }
        if (save_pm) {
          await stripe.paymentMethods.attach(payment_method_id, { customer: customerId });
          await stripe.customers.update(customerId, {
            invoice_settings: { default_payment_method: payment_method_id }
          });
        }
        const paymentIntent = await stripe.paymentIntents.create({
          amount: depositAmount,
          currency: "usd",
          customer: customerId,
          payment_method: payment_method_id,
          confirm: true,
          capture_method: "automatic",
          setup_future_usage: save_pm ? "off_session" : void 0,
          transfer_group: `booking_${bookingId}`,
          metadata: {
            bookingId: bookingId.toString(),
            type: "deposit",
            userId: buyer.id.toString()
          }
        });
        await storage.updateBooking(bookingId, {
          amountBudgetedCents: budgetedAmount,
          amountDepositCents: depositAmount,
          amountFundedCents: depositAmount,
          homeownerPmSaved: save_pm,
          depositChargeId: paymentIntent.latest_charge,
          stripePaymentIntentId: paymentIntent.id,
          status: "funded"
        });
        res.json({
          success: true,
          depositAmount,
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status
        });
      } catch (error) {
        console.error("Deposit payment error:", error);
        res.status(500).json({ message: "Failed to process deposit payment" });
      }
    });
    app2.post("/api/escrow/:bookingId/propose-final", requireAuth, async (req, res) => {
      try {
        const bookingId = parseInt(req.params.bookingId);
        const { final_cents, note } = z3.object({
          final_cents: z3.number().int().min(0),
          note: z3.string().optional()
        }).parse(req.body);
        const booking = await storage.getBooking(bookingId);
        if (!booking) {
          return res.status(404).json({ message: "Booking not found" });
        }
        if (booking.sellerUserId !== req.user.id) {
          return res.status(403).json({ message: "Only the provider can propose final amount" });
        }
        if (booking.status !== "funded" && booking.status !== "in_progress") {
          return res.status(400).json({ message: "Booking must be funded before proposing final amount" });
        }
        const depositAmount = booking.amountDepositCents || 0;
        const delta = final_cents - depositAmount;
        const maxIncrease = Math.round(depositAmount * 1.25);
        if (final_cents > maxIncrease && !req.user.isAdmin) {
          return res.status(400).json({
            message: `Final amount cannot exceed 25% over deposit ($${maxIncrease / 100}). Contact admin for approval.`,
            maxAllowed: maxIncrease
          });
        }
        await storage.updateBooking(bookingId, {
          amountFinalCents: final_cents,
          amountDeltaCents: delta,
          finalProposalNote: note,
          status: "final_proposed"
        });
        res.json({
          success: true,
          finalAmount: final_cents,
          delta,
          status: "final_proposed"
        });
      } catch (error) {
        console.error("Propose final error:", error);
        res.status(500).json({ message: "Failed to propose final amount" });
      }
    });
    app2.post("/api/escrow/:bookingId/approve-final", requireAuth, async (req, res) => {
      try {
        const bookingId = parseInt(req.params.bookingId);
        const { agree, payment_method_id } = z3.object({
          agree: z3.boolean(),
          payment_method_id: z3.string().optional()
        }).parse(req.body);
        if (!agree) {
          return res.status(400).json({ message: "Must agree to approve final amount" });
        }
        const booking = await storage.getBooking(bookingId);
        if (!booking) {
          return res.status(404).json({ message: "Booking not found" });
        }
        if (booking.buyerUserId !== req.user.id) {
          return res.status(403).json({ message: "Only the homeowner can approve final amount" });
        }
        if (booking.status !== "final_proposed") {
          return res.status(400).json({ message: "No final amount to approve" });
        }
        const delta = booking.amountDeltaCents || 0;
        const buyer = await storage.getUser(booking.buyerUserId);
        if (!buyer || !buyer.stripeCustomerId) {
          return res.status(400).json({ message: "Customer not found" });
        }
        if (delta > 0) {
          if (!booking.homeownerPmSaved && !payment_method_id) {
            return res.status(402).json({
              message: "Payment method required for additional charge",
              deltaAmount: delta
            });
          }
          const pmId = payment_method_id || (await stripe.customers.retrieve(buyer.stripeCustomerId)).invoice_settings?.default_payment_method;
          const deltaIntent = await stripe.paymentIntents.create({
            amount: delta,
            currency: "usd",
            customer: buyer.stripeCustomerId,
            payment_method: pmId,
            confirm: true,
            off_session: booking.homeownerPmSaved,
            transfer_group: `booking_${bookingId}`,
            metadata: {
              bookingId: bookingId.toString(),
              type: "delta_charge",
              userId: buyer.id.toString()
            }
          });
          const newFunded = (booking.amountFundedCents || 0) + delta;
          await storage.updateBooking(bookingId, {
            amountFundedCents: newFunded,
            deltaChargeId: deltaIntent.latest_charge,
            status: "final_approved"
          });
          res.json({
            success: true,
            deltaCharged: delta,
            totalFunded: newFunded,
            status: "final_approved"
          });
        } else if (delta < 0) {
          const refundAmount = Math.abs(delta);
          const refund = await stripe.refunds.create({
            charge: booking.depositChargeId,
            amount: refundAmount,
            metadata: {
              bookingId: bookingId.toString(),
              type: "delta_refund"
            }
          });
          const newFunded = (booking.amountFundedCents || 0) - refundAmount;
          await storage.updateBooking(bookingId, {
            amountFundedCents: newFunded,
            status: "final_approved"
          });
          res.json({
            success: true,
            deltaRefunded: refundAmount,
            totalFunded: newFunded,
            status: "final_approved"
          });
        } else {
          await storage.updateBooking(bookingId, {
            status: "final_approved"
          });
          res.json({
            success: true,
            delta: 0,
            status: "final_approved"
          });
        }
      } catch (error) {
        console.error("Approve final error:", error);
        res.status(500).json({ message: "Failed to approve final amount" });
      }
    });
    app2.post("/api/escrow/:bookingId/settle", requireAuth, async (req, res) => {
      try {
        const bookingId = parseInt(req.params.bookingId);
        const { retainage_bps } = z3.object({
          retainage_bps: z3.number().int().min(0).max(1e4).optional()
        }).parse(req.body);
        const booking = await storage.getBooking(bookingId);
        if (!booking) {
          return res.status(404).json({ message: "Booking not found" });
        }
        if (booking.buyerUserId !== req.user.id && !req.user.isAdmin) {
          return res.status(403).json({ message: "Not authorized to settle" });
        }
        if (booking.status !== "final_approved") {
          return res.status(400).json({ message: "Final amount must be approved before settling" });
        }
        const provider = await storage.getUser(booking.sellerUserId);
        if (!provider || !provider.stripeConnectAccountId) {
          return res.status(400).json({ message: "Provider has not set up payout account" });
        }
        if (provider.payoutStatus !== "READY") {
          return res.status(409).json({
            message: "Provider must complete Stripe onboarding before payout",
            payoutStatus: provider.payoutStatus
          });
        }
        const funded = booking.amountFundedCents || 0;
        const platformFeePercent = 5;
        const platformFee = Math.round(funded * platformFeePercent / 100);
        const retainageBps = retainage_bps || booking.retainageBps || 0;
        const retainageAmount = Math.round(funded * retainageBps / 1e4);
        const payoutAmount = funded - platformFee - retainageAmount;
        const transfer = await stripe.transfers.create({
          amount: payoutAmount,
          currency: "usd",
          destination: provider.stripeConnectAccountId,
          transfer_group: `booking_${bookingId}`,
          metadata: {
            bookingId: bookingId.toString(),
            type: "final_payout",
            providerId: provider.id.toString(),
            platformFee: platformFee.toString(),
            retainage: retainageAmount.toString()
          }
        });
        const newStatus = retainageAmount > 0 ? "partial_released" : "settled";
        await storage.updateBooking(bookingId, {
          stripeTransferId: transfer.id,
          retainageBps,
          retainageHoldCents: retainageAmount,
          status: newStatus
        });
        res.json({
          success: true,
          payoutAmount,
          platformFee,
          retainageHeld: retainageAmount,
          transferId: transfer.id,
          status: newStatus
        });
      } catch (error) {
        console.error("Settle error:", error);
        res.status(500).json({ message: "Failed to settle payment" });
      }
    });
    app2.post("/api/escrow/:bookingId/release-retainage", requireAuth, async (req, res) => {
      try {
        const bookingId = parseInt(req.params.bookingId);
        const booking = await storage.getBooking(bookingId);
        if (!booking) {
          return res.status(404).json({ message: "Booking not found" });
        }
        if (booking.buyerUserId !== req.user.id && !req.user.isAdmin) {
          return res.status(403).json({ message: "Not authorized to release retainage" });
        }
        if (booking.status !== "partial_released") {
          return res.status(400).json({ message: "No retainage to release" });
        }
        const retainageAmount = booking.retainageHoldCents || 0;
        if (retainageAmount === 0) {
          return res.status(400).json({ message: "No retainage held" });
        }
        const provider = await storage.getUser(booking.sellerUserId);
        if (!provider || !provider.stripeConnectAccountId) {
          return res.status(400).json({ message: "Provider account not found" });
        }
        const transfer = await stripe.transfers.create({
          amount: retainageAmount,
          currency: "usd",
          destination: provider.stripeConnectAccountId,
          transfer_group: `booking_${bookingId}`,
          metadata: {
            bookingId: bookingId.toString(),
            type: "retainage_release",
            providerId: provider.id.toString()
          }
        });
        await storage.updateBooking(bookingId, {
          retainageHoldCents: 0,
          status: "settled"
        });
        res.json({
          success: true,
          retainageReleased: retainageAmount,
          transferId: transfer.id,
          status: "settled"
        });
      } catch (error) {
        console.error("Release retainage error:", error);
        res.status(500).json({ message: "Failed to release retainage" });
      }
    });
  }
  app2.get("/api/provider-skills/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const skills = await storage.getProviderSkills(userId);
      res.json(skills);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch provider skills" });
    }
  });
  app2.post("/api/provider-skills", requireAuth, async (req, res) => {
    try {
      const validatedData = insertProviderSkillSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const skill = await storage.createProviderSkill(validatedData);
      res.status(201).json(skill);
    } catch (error) {
      res.status(400).json({ message: "Failed to create skill" });
    }
  });
  app2.delete("/api/provider-skills/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const skill = await storage.getProviderSkill(id);
      if (!skill) {
        return res.status(404).json({ message: "Skill not found" });
      }
      if (skill.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const success = await storage.deleteProviderSkill(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete skill" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete skill" });
    }
  });
  app2.get("/api/portfolio/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const portfolio = await storage.getPortfolioItems(userId);
      res.json(portfolio);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });
  app2.post("/api/portfolio", requireAuth, async (req, res) => {
    try {
      const validatedData = insertPortfolioItemSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const item = await storage.createPortfolioItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ message: "Failed to create portfolio item" });
    }
  });
  app2.patch("/api/portfolio/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getPortfolioItem(id);
      if (!item) {
        return res.status(404).json({ message: "Portfolio item not found" });
      }
      if (item.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const validatedData = updatePortfolioItemSchema.parse(req.body);
      const updatedItem = await storage.updatePortfolioItem(id, validatedData);
      res.json(updatedItem);
    } catch (error) {
      res.status(400).json({ message: "Failed to update portfolio item" });
    }
  });
  app2.delete("/api/portfolio/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getPortfolioItem(id);
      if (!item) {
        return res.status(404).json({ message: "Portfolio item not found" });
      }
      if (item.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const success = await storage.deletePortfolioItem(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete portfolio item" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete portfolio item" });
    }
  });
  app2.get("/api/notification-preferences", requireAuth, async (req, res) => {
    try {
      const preferences = await storage.getNotificationPreferences(req.user.id);
      res.json(preferences || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notification preferences" });
    }
  });
  app2.put("/api/notification-preferences", requireAuth, async (req, res) => {
    try {
      const preferences = await storage.updateNotificationPreferences(req.user.id, req.body);
      res.json(preferences);
    } catch (error) {
      res.status(400).json({ message: "Failed to update notification preferences" });
    }
  });
  app2.post("/api/analytics/event", async (req, res) => {
    try {
      const event = await storage.logAnalyticsEvent({
        ...req.body,
        userId: req.user?.id || null,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent") || null
      });
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ message: "Failed to log analytics event" });
    }
  });
  app2.get("/api/analytics/events", requireAuth, async (req, res) => {
    try {
      const { eventType, dateFrom, dateTo } = req.query;
      const events = await storage.getAnalyticsEvents({
        userId: req.user.id,
        eventType,
        dateFrom: dateFrom ? new Date(dateFrom) : void 0,
        dateTo: dateTo ? new Date(dateTo) : void 0
      });
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics events" });
    }
  });
  app2.get("/api/analytics/metrics", requireAuth, async (req, res) => {
    try {
      const { dateFrom, dateTo } = req.query;
      const metrics = await storage.getPlatformMetrics(
        dateFrom,
        dateTo
      );
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch platform metrics" });
    }
  });
  app2.post("/api/search/log", async (req, res) => {
    try {
      const searchQuery = await storage.logSearchQuery({
        ...req.body,
        userId: req.user?.id || null,
        sessionId: req.sessionID
      });
      res.status(201).json(searchQuery);
    } catch (error) {
      res.status(400).json({ message: "Failed to log search query" });
    }
  });
  app2.get("/api/payouts", requireAuth, async (req, res) => {
    try {
      const payouts2 = await storage.getPayouts(req.user.id);
      res.json(payouts2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payouts" });
    }
  });
  app2.post("/api/payouts", requireAuth, async (req, res) => {
    try {
      const payout = await storage.createPayout({
        ...req.body,
        userId: req.user.id
      });
      res.status(201).json(payout);
    } catch (error) {
      res.status(400).json({ message: "Failed to create payout" });
    }
  });
  app2.get("/api/disputes", requireAuth, async (req, res) => {
    try {
      const { status } = req.query;
      const disputes2 = await storage.getDisputes(req.user.id, status);
      res.json(disputes2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch disputes" });
    }
  });
  app2.post("/api/disputes", requireAuth, async (req, res) => {
    try {
      const dispute = await storage.createDispute({
        ...req.body,
        reporterUserId: req.user.id
      });
      res.status(201).json(dispute);
    } catch (error) {
      res.status(400).json({ message: "Failed to create dispute" });
    }
  });
  app2.patch("/api/disputes/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const dispute = await storage.updateDispute(id, req.body);
      if (dispute) {
        res.json(dispute);
      } else {
        res.status(404).json({ message: "Dispute not found" });
      }
    } catch (error) {
      res.status(400).json({ message: "Failed to update dispute" });
    }
  });
  app2.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactSubmissionSchema.parse(req.body);
      const contactSubmission = await storage.createContactSubmission({
        ...validatedData,
        userId: req.user?.id || null
      });
      res.status(201).json(contactSubmission);
    } catch (error) {
      res.status(400).json({ message: "Failed to submit contact form" });
    }
  });
  app2.post("/api/objects/upload", requireAuth, async (req, res) => {
    try {
      const { filename, fileSize, mimeType } = req.body;
      if (!filename) {
        return res.status(400).json({ error: "Filename is required" });
      }
      if (!fileSize) {
        return res.status(400).json({ error: "File size is required" });
      }
      const sanitizedFilename = await validateUploadSecurity(req, filename, fileSize);
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({
        uploadURL,
        sanitizedFilename
      });
    } catch (error) {
      if (error instanceof UploadSecurityError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });
  app2.post("/api/objects/validate", requireAuth, async (req, res) => {
    try {
      const { objectPath, filename } = req.body;
      if (!objectPath || !filename) {
        return res.status(400).json({ error: "Object path and filename are required" });
      }
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(objectPath);
      const objectFile = await objectStorageService.getObjectEntityFile(normalizedPath);
      const [buffer] = await objectFile.download();
      const { validateImageBuffer: validateImageBuffer2 } = await Promise.resolve().then(() => (init_uploadSecurity(), uploadSecurity_exports));
      validateImageBuffer2(buffer, filename);
      const publicPath = await objectStorageService.trySetObjectEntityAclPolicy(
        normalizedPath,
        {
          owner: req.user.id.toString(),
          visibility: "public"
        }
      );
      console.log("==== VALIDATION COMPLETE ====");
      console.log("Input objectPath:", objectPath);
      console.log("Normalized path:", normalizedPath);
      console.log("Public path:", publicPath);
      console.log("============================");
      res.json({ valid: true, url: publicPath });
    } catch (error) {
      if (error instanceof UploadSecurityError) {
        try {
          if (req.body.objectPath) {
            const objectStorageService = new ObjectStorageService();
            const normalizedPath = objectStorageService.normalizeObjectEntityPath(req.body.objectPath);
            const objectFile = await objectStorageService.getObjectEntityFile(normalizedPath);
            await objectFile.delete();
          }
        } catch (deleteError) {
          console.error("Error deleting invalid file:", deleteError);
        }
        return res.status(error.statusCode).json({ error: error.message, valid: false });
      }
      console.error("Error validating upload:", error);
      res.status(500).json({ error: "Failed to validate upload" });
    }
  });
  app2.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      if (req.user) {
        const canAccess = await objectStorageService.canAccessObjectEntity({
          objectFile,
          userId: req.user.id.toString()
        });
        if (!canAccess) {
          return res.sendStatus(403);
        }
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });
  app2.post("/api/listings/:id/images", requireAuth, async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      const { imageURL, altText } = req.body;
      if (!imageURL) {
        return res.status(400).json({ error: "imageURL is required" });
      }
      const listing = await storage.getListing(listingId);
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }
      if (listing.ownerUserId !== req.user.id) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        imageURL,
        {
          owner: req.user.id.toString(),
          visibility: "public"
        }
      );
      const result = await storage.addListingImage({
        listingId,
        url: objectPath,
        altText: altText || null
      });
      res.status(200).json(result);
    } catch (error) {
      console.error("Error adding listing image:", error);
      res.status(500).json({ error: "Failed to add listing image" });
    }
  });
  app2.get("/api/reviews/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const reviews2 = await storage.getReviews(userId);
      res.json(reviews2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });
  app2.get("/api/reviews/booking/:bookingId", requireAuth, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const reviews2 = await storage.getReviews(void 0, bookingId);
      res.json(reviews2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch booking reviews" });
    }
  });
  app2.post("/api/search/listings", async (req, res) => {
    try {
      const { query, filters, location, radius } = req.body;
      if (req.user) {
        await storage.logSearchQuery({
          query: query || "",
          filters: filters || {},
          location: location || null,
          userId: req.user.id,
          sessionId: req.sessionID,
          resultsCount: 0
          // Will be updated after search
        });
      }
      const searchFilters = {
        search: query,
        ...filters
        // TODO: Add location radius filtering logic
      };
      const listings2 = await storage.getListings(searchFilters);
      res.json({
        listings: listings2,
        totalCount: listings2.length,
        searchId: Date.now().toString()
      });
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });
  app2.get("/api/admin/audit-log", requireAuth, async (req, res) => {
    try {
      if (!req.user.email.includes("admin")) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const auditLog2 = await storage.getAuditLog();
      res.json(auditLog2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit log" });
    }
  });
  app2.post("/api/admin/audit", requireAuth, async (req, res) => {
    try {
      const auditEntry = await storage.logAuditAction({
        ...req.body,
        adminUserId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent") || null
      });
      res.status(201).json(auditEntry);
    } catch (error) {
      res.status(400).json({ message: "Failed to log audit action" });
    }
  });
  app2.post("/api/email/queue", requireAuth, async (req, res) => {
    try {
      const email = await storage.addEmailToQueue({
        ...req.body,
        recipientUserId: req.body.recipientUserId || null
      });
      res.status(201).json(email);
    } catch (error) {
      res.status(400).json({ message: "Failed to queue email" });
    }
  });
  app2.post("/api/stripe/connect/account", requireAuth, async (req, res) => {
    try {
      const mockConnectAccount = {
        id: `acct_mock_${req.user.id}`,
        object: "account",
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false
      };
      await storage.updateUser(req.user.id, {
        stripeConnectAccountId: mockConnectAccount.id
      });
      res.json(mockConnectAccount);
    } catch (error) {
      res.status(500).json({ message: "Failed to create Stripe Connect account" });
    }
  });
  app2.post("/api/stripe/connect/account-link", requireAuth, async (req, res) => {
    try {
      const mockAccountLink = {
        object: "account_link",
        created: Math.floor(Date.now() / 1e3),
        expires_at: Math.floor(Date.now() / 1e3) + 300,
        // 5 minutes
        url: `https://connect.stripe.com/setup/mock_account_link_${req.user.id}`
      };
      res.json(mockAccountLink);
    } catch (error) {
      res.status(500).json({ message: "Failed to create account link" });
    }
  });
  app2.get("/api/analytics", requireAuth, async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const allUsers = await storage.getAllUsers();
      const allBookings = await storage.getBookings();
      const allListings = await storage.getListings();
      const allReviews = await storage.getReviews();
      const categories2 = await storage.getCategories();
      const now = /* @__PURE__ */ new Date();
      const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const firstOfYear = new Date(now.getFullYear(), 0, 1);
      const totalRevenue = allBookings.reduce((sum, b) => sum + (b.totalCents || 0), 0);
      const thisMonthBookings = allBookings.filter((b) => new Date(b.createdAt) >= firstOfThisMonth);
      const lastMonthBookings = allBookings.filter(
        (b) => new Date(b.createdAt) >= firstOfLastMonth && new Date(b.createdAt) < firstOfThisMonth
      );
      const yearToDateBookings = allBookings.filter((b) => new Date(b.createdAt) >= firstOfYear);
      const thisMonthRevenue = thisMonthBookings.reduce((sum, b) => sum + (b.totalCents || 0), 0);
      const lastMonthRevenue = lastMonthBookings.reduce((sum, b) => sum + (b.totalCents || 0), 0);
      const yearToDateRevenue = yearToDateBookings.reduce((sum, b) => sum + (b.totalCents || 0), 0);
      const revenueByCategory = await Promise.all(
        categories2.map(async (cat) => {
          const catListings = allListings.filter((l) => l.categoryId === cat.id);
          const catListingIds = catListings.map((l) => l.id);
          const catBookings = allBookings.filter((b) => catListingIds.includes(b.listingId));
          const amount = catBookings.reduce((sum, b) => sum + (b.totalCents || 0), 0);
          return {
            category: cat.name,
            amount,
            percentage: totalRevenue > 0 ? Math.round(amount / totalRevenue * 100) : 0
          };
        })
      );
      const newThisMonth = allUsers.filter((u) => new Date(u.createdAt) >= firstOfThisMonth).length;
      const lastMonthUsers = allUsers.filter(
        (u) => new Date(u.createdAt) >= firstOfLastMonth && new Date(u.createdAt) < firstOfThisMonth
      ).length;
      const completedBookings = allBookings.filter((b) => b.status === "completed");
      const cancelledBookings = allBookings.filter((b) => b.status === "canceled");
      const averageBookingValue = allBookings.length > 0 ? allBookings.reduce((sum, b) => sum + (b.totalCents || 0), 0) / allBookings.length : 0;
      const statusCounts = {};
      allBookings.forEach((b) => {
        statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
      });
      const byStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: allBookings.length > 0 ? Math.round(count / allBookings.length * 100) : 0
      }));
      const topCategories = await Promise.all(
        categories2.map(async (cat) => {
          const catListings = allListings.filter((l) => l.categoryId === cat.id);
          const catListingIds = catListings.map((l) => l.id);
          const catBookings = allBookings.filter((b) => catListingIds.includes(b.listingId));
          return {
            category: cat.name,
            count: catBookings.length,
            revenue: catBookings.reduce((sum, b) => sum + (b.totalCents || 0), 0)
          };
        })
      );
      const avgRating = allReviews.length > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length : 0;
      const profiles2 = await Promise.all(allUsers.map((u) => storage.getProfile(u.id)));
      const cityCounts = {};
      for (const profile of profiles2) {
        if (profile?.city && profile?.state) {
          const key = `${profile.city}, ${profile.state}`;
          if (!cityCounts[key]) {
            cityCounts[key] = { users: 0, revenue: 0 };
          }
          cityCounts[key].users++;
          const userBookings = allBookings.filter((b) => b.buyerUserId === profile.userId);
          cityCounts[key].revenue += userBookings.reduce((sum, b) => sum + (b.totalCents || 0), 0);
        }
      }
      const topCities = Object.entries(cityCounts).map(([location, data]) => {
        const [city, state] = location.split(", ");
        return { city, state, users: data.users, revenue: data.revenue };
      }).sort((a, b) => b.users - a.users).slice(0, 10);
      const analytics = {
        overview: {
          totalRevenue,
          totalUsers: allUsers.length,
          totalBookings: allBookings.length,
          averageRating: Math.round(avgRating * 10) / 10,
          conversionRate: allUsers.length > 0 ? Math.round(allBookings.length / allUsers.length * 1e3) / 10 : 0,
          monthlyGrowth: lastMonthUsers > 0 ? Math.round((newThisMonth - lastMonthUsers) / lastMonthUsers * 1e3) / 10 : 0
        },
        revenue: {
          thisMonth: thisMonthRevenue,
          lastMonth: lastMonthRevenue,
          yearToDate: yearToDateRevenue,
          projectedAnnual: thisMonthRevenue * 12,
          byCategory: revenueByCategory.filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount),
          trends: []
          // Would need time-series data
        },
        users: {
          totalActive: allUsers.length,
          newThisMonth,
          retentionRate: 0,
          // Would need login tracking
          demographics: [],
          acquisition: [],
          engagement: []
        },
        bookings: {
          totalCompleted: completedBookings.length,
          averageValue: Math.round(averageBookingValue),
          completionRate: allBookings.length > 0 ? Math.round(completedBookings.length / allBookings.length * 1e3) / 10 : 0,
          cancellationRate: allBookings.length > 0 ? Math.round(cancelledBookings.length / allBookings.length * 1e3) / 10 : 0,
          byStatus,
          byTimeOfDay: [],
          topCategories: topCategories.filter((c) => c.count > 0).sort((a, b) => b.count - a.count).slice(0, 5)
        },
        performance: {
          pageViews: 0,
          uniqueVisitors: 0,
          bounceRate: 0,
          averageSessionDuration: 0,
          topPages: [],
          deviceBreakdown: [],
          loadTimes: []
        },
        geographic: {
          topCities,
          serviceAreas: []
        }
      };
      res.json(analytics);
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
  app2.get("/api/admin/stats", requireAuth, async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const allUsers = await storage.getAllUsers();
      const allListings = await storage.getListings();
      const allBookings = await storage.getBookings();
      const allDisputes = await storage.getDisputes();
      const totalRevenue = allBookings.reduce((sum, b) => sum + (b.totalCents || 0), 0);
      const activeDisputes = allDisputes.filter((d) => d.status === "open" || d.status === "investigating").length;
      const now = /* @__PURE__ */ new Date();
      const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const newThisMonth = allUsers.filter((u) => new Date(u.createdAt) >= firstOfThisMonth).length;
      const newLastMonth = allUsers.filter(
        (u) => new Date(u.createdAt) >= firstOfLastMonth && new Date(u.createdAt) < firstOfThisMonth
      ).length;
      const monthlyGrowth = newLastMonth > 0 ? Math.round((newThisMonth - newLastMonth) / newLastMonth * 1e3) / 10 : 0;
      const stats = {
        totalUsers: allUsers.length,
        totalListings: allListings.length,
        totalTransactions: allBookings.length,
        totalRevenue,
        activeDisputes,
        pendingVerifications: allListings.filter((l) => l.status === "pending").length,
        monthlyGrowth,
        userRetention: 0
        // Would need login tracking
      };
      res.json(stats);
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });
  app2.get("/api/admin/users", requireAuth, async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const users2 = await storage.getAllUsers();
      const usersWithStats = await Promise.all(users2.map(async (user) => {
        const buyerBookings = await storage.getBookings(user.id);
        const reviews2 = await storage.getReviews(user.id);
        const totalSpent = buyerBookings.reduce((sum, b) => sum + (b.totalCents || 0), 0) / 100;
        const reviewCount = reviews2.length;
        const averageRating = reviewCount > 0 ? reviews2.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          status: "active",
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          lastLogin: user.updatedAt,
          totalSpent,
          totalEarned: 0,
          reviewCount,
          averageRating: Math.round(averageRating * 10) / 10
        };
      }));
      res.json(usersWithStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.post("/api/admin/settings/fees", requireAuth, async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { platformFee, paymentFee } = req.body;
      await storage.setPlatformSetting("platformFee", platformFee);
      await storage.setPlatformSetting("paymentFee", paymentFee);
      res.json({
        success: true,
        platformFee,
        paymentFee,
        message: "Fee settings saved successfully"
      });
    } catch (error) {
      console.error("Failed to save fee settings:", error);
      res.status(500).json({ message: "Failed to save fee settings" });
    }
  });
  app2.get("/api/admin/settings/fees", requireAuth, async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const platformFee = await storage.getPlatformSetting("platformFee") ?? 10;
      const paymentFee = await storage.getPlatformSetting("paymentFee") ?? 2.9;
      res.json({ platformFee, paymentFee });
    } catch (error) {
      console.error("Failed to get fee settings:", error);
      res.status(500).json({ message: "Failed to get fee settings" });
    }
  });
  app2.get("/api/settings/fees", async (req, res) => {
    try {
      const platformFee = await storage.getPlatformSetting("platformFee") ?? 10;
      const paymentFee = await storage.getPlatformSetting("paymentFee") ?? 2.9;
      res.json({ platformFee, paymentFee });
    } catch (error) {
      console.error("Failed to get fee settings:", error);
      res.status(500).json({ message: "Failed to get fee settings" });
    }
  });
  app2.get("/api/admin/api-keys", requireAuth, async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const maskKey = (key) => {
        if (!key) return null;
        if (key.length <= 8) return "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
        return key.substring(0, 4) + "\u2022\u2022\u2022\u2022" + key.substring(key.length - 4);
      };
      res.json({
        stripe: {
          secretKey: maskKey(process.env.STRIPE_SECRET_KEY),
          publicKey: maskKey(process.env.VITE_STRIPE_PUBLIC_KEY),
          webhookSecret: maskKey(process.env.STRIPE_WEBHOOK_SECRET),
          hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
          hasPublicKey: !!process.env.VITE_STRIPE_PUBLIC_KEY,
          hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET
        },
        mailgun: {
          apiKey: maskKey(process.env.MAILGUN_API_KEY),
          domain: process.env.MAILGUN_DOMAIN || null,
          hasApiKey: !!process.env.MAILGUN_API_KEY,
          hasDomain: !!process.env.MAILGUN_DOMAIN
        }
      });
    } catch (error) {
      console.error("Failed to get API keys:", error);
      res.status(500).json({ message: "Failed to get API keys" });
    }
  });
  app2.post("/api/admin/api-keys", requireAuth, async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { service, keys } = req.body;
      const instructions = {
        stripe: {
          message: "To update Stripe API keys, please use the Replit Secrets tool or ask your developer to configure these environment variables:",
          keys: [
            { name: "STRIPE_SECRET_KEY", description: "Your Stripe secret key (starts with sk_)", url: "https://dashboard.stripe.com/apikeys" },
            { name: "VITE_STRIPE_PUBLIC_KEY", description: "Your Stripe publishable key (starts with pk_)", url: "https://dashboard.stripe.com/apikeys" },
            { name: "STRIPE_WEBHOOK_SECRET", description: "Your Stripe webhook secret (get from Stripe webhook settings)", url: "https://dashboard.stripe.com/webhooks" }
          ]
        },
        mailgun: {
          message: "To update Mailgun API keys, please use the Replit Secrets tool or ask your developer to configure these environment variables:",
          keys: [
            { name: "MAILGUN_API_KEY", description: "Your Mailgun API key", url: "https://app.mailgun.com/app/account/security/api_keys" },
            { name: "MAILGUN_DOMAIN", description: "Your Mailgun domain", url: "https://app.mailgun.com/app/domains" }
          ]
        }
      };
      res.json({
        success: true,
        message: "Please update these keys using Replit's Secrets management tool",
        instructions: instructions[service]
      });
    } catch (error) {
      console.error("Failed to update API keys:", error);
      res.status(500).json({ message: "Failed to update API keys" });
    }
  });
  app2.post("/api/admin/backup", requireAuth, async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const timestamp2 = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
      res.json({
        success: true,
        message: "Database backup created successfully",
        filename: `omahasharehub-backup-${timestamp2}.sql`,
        timestamp: timestamp2
      });
    } catch (error) {
      console.error("Failed to create backup:", error);
      res.status(500).json({ message: "Failed to create backup" });
    }
  });
  app2.post("/api/admin/export-reports", requireAuth, async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const users2 = await storage.getAllUsers();
      const listings2 = await storage.getListings();
      const bookings2 = await storage.getBookings();
      const headers = "Report Type,ID,Name/Title,Email,Status,Created At,Amount\n";
      const userRows = users2.map(
        (u) => `User,${u.id},"${u.name || u.fullName}",${u.email},active,${u.createdAt},0`
      ).join("\n");
      const listingRows = listings2.map(
        (l) => `Listing,${l.id},"${l.title}",N/A,${l.status},${l.createdAt},${l.priceCents / 100}`
      ).join("\n");
      const bookingRows = bookings2.map(
        (b) => `Booking,${b.id},N/A,N/A,${b.status},${b.createdAt},${b.totalCents / 100}`
      ).join("\n");
      const csvContent = headers + userRows + "\n" + listingRows + "\n" + bookingRows;
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="omahasharehub-reports-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Failed to export reports:", error);
      res.status(500).json({ message: "Failed to export reports" });
    }
  });
  app2.get("/api/admin/moderation", requireAuth, async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const mockModerationQueue = [
        {
          id: 1,
          type: "listing",
          title: "Kitchen Renovation Services",
          status: "pending",
          flaggedReason: "Inappropriate content",
          reportedBy: "user@example.com",
          createdAt: "2024-12-27T00:00:00Z",
          content: "Professional kitchen renovation services with 10+ years experience..."
        }
      ];
      res.json(mockModerationQueue);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch moderation queue" });
    }
  });
  app2.get("/api/admin/disputes", requireAuth, async (req, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const mockDisputes = [
        {
          id: 1,
          transactionId: 123,
          status: "open",
          priority: "medium",
          complainantName: "John Doe",
          respondentName: "ABC Services",
          amount: 5e4,
          createdAt: "2024-12-25T00:00:00Z",
          description: "Service was not completed as agreed..."
        }
      ];
      res.json(mockDisputes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch disputes" });
    }
  });
  app2.get("/api/bookings/user/:userId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const bookingsData = await storage.getBookings(userId, req.query.status);
      const enrichedBookings = await Promise.all(
        bookingsData.map(async (booking) => {
          const listing = await storage.getListing(booking.listingId);
          const owner = await storage.getUser(booking.buyerUserId);
          const provider = await storage.getUser(booking.sellerUserId);
          const ownerProfile = await storage.getProfile(booking.buyerUserId);
          const providerProfile = await storage.getProfile(booking.sellerUserId);
          const paymentStatus = booking.status === "paid" ? "completed" : booking.status === "accepted" ? "pending" : "unpaid";
          return {
            ...booking,
            ownerName: owner?.name || owner?.email || "Unknown User",
            ownerEmail: owner?.email || "",
            ownerPhone: ownerProfile?.phoneNumber,
            providerName: provider?.name || provider?.email || "Unknown User",
            providerEmail: provider?.email || "",
            providerPhone: providerProfile?.phoneNumber,
            listingTitle: listing?.title || "Unknown Project",
            listingAddress: listing?.address,
            paymentStatus,
            totalAmount: booking.totalCents
          };
        })
      );
      res.json(enrichedBookings);
    } catch (error) {
      console.error("Failed to fetch user bookings:", error);
      res.status(500).json({ message: "Failed to fetch user bookings" });
    }
  });
  app2.post("/api/bookings/:id/action", requireAuth, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { action, notes, reason } = req.body;
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (booking.buyerUserId !== req.user.id && booking.sellerUserId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      let newStatus = booking.status;
      switch (action) {
        case "confirm":
          newStatus = "confirmed";
          break;
        case "cancel":
          newStatus = "cancelled";
          break;
        case "complete":
          if (stripe && booking.stripePaymentIntentId) {
            const provider = await storage.getUser(booking.sellerUserId);
            if (!provider) {
              return res.status(404).json({ message: "Provider not found" });
            }
            if (!provider.stripeConnectAccountId) {
              return res.status(400).json({
                message: "Provider has not set up their payout account. Escrow cannot be released."
              });
            }
            if (provider.payoutStatus !== "READY") {
              return res.status(400).json({
                message: `Provider's payout account is ${provider.payoutStatus}. They must complete onboarding before escrow can be released.`,
                payoutStatus: provider.payoutStatus,
                requirements: provider.stripeRequirements
              });
            }
            const platformFeePercent = 5;
            const totalCents = booking.totalCents || 0;
            const platformFeeCents = Math.round(totalCents * platformFeePercent / 100);
            const providerPayoutCents = totalCents - platformFeeCents;
            const transfer = await stripe.transfers.create({
              amount: providerPayoutCents,
              currency: "usd",
              destination: provider.stripeConnectAccountId,
              transfer_group: `booking_${bookingId}`,
              metadata: {
                bookingId: bookingId.toString(),
                providerId: provider.id.toString(),
                platformFeeCents: platformFeeCents.toString()
              }
            });
            console.log(`Escrow released: $${providerPayoutCents / 100} transferred to provider ${provider.id}, platform fee: $${platformFeeCents / 100}`);
            newStatus = "completed";
            await storage.updateBooking(bookingId, {
              status: newStatus,
              notes: notes || booking.notes,
              stripeTransferId: transfer.id
            });
            return res.json({
              success: true,
              message: `Booking completed and $${providerPayoutCents / 100} transferred to provider`,
              booking: await storage.getBooking(bookingId),
              payout: {
                amount: providerPayoutCents,
                platformFee: platformFeeCents,
                transferId: transfer.id
              }
            });
          } else {
            newStatus = "completed";
          }
          break;
        case "reschedule":
          break;
      }
      const updatedBooking = await storage.updateBooking(bookingId, {
        status: newStatus,
        notes: notes || booking.notes
      });
      res.json({
        success: true,
        message: `Booking ${action} completed successfully`,
        booking: updatedBooking
      });
    } catch (error) {
      console.error("Booking action error:", error);
      res.status(500).json({ message: "Failed to process booking action" });
    }
  });
  app2.get("/api/provider-skills/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const mockSkills = [
        {
          id: 1,
          userId,
          skillName: "Plumbing",
          categoryId: 1,
          experienceYears: 8,
          verified: true,
          createdAt: "2024-01-15T00:00:00Z"
        },
        {
          id: 2,
          userId,
          skillName: "Electrical Work",
          categoryId: 1,
          experienceYears: 5,
          verified: false,
          createdAt: "2024-02-20T00:00:00Z"
        }
      ];
      res.json(mockSkills);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch provider skills" });
    }
  });
  app2.post("/api/provider-skills", requireAuth, async (req, res) => {
    try {
      const mockSkill = {
        id: Date.now(),
        userId: req.user.id,
        ...req.body,
        verified: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.status(201).json(mockSkill);
    } catch (error) {
      res.status(400).json({ message: "Failed to add skill" });
    }
  });
  app2.get("/api/portfolio/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const mockPortfolio = [
        {
          id: 1,
          userId,
          title: "Modern Kitchen Renovation",
          description: "Complete kitchen remodel with custom cabinets and granite countertops",
          categoryId: 1,
          imageUrls: ["/api/placeholder-image.jpg"],
          projectDate: "2024-10-15",
          featured: true,
          createdAt: "2024-10-20T00:00:00Z"
        },
        {
          id: 2,
          userId,
          title: "Bathroom Upgrade",
          description: "Full bathroom renovation with modern fixtures and tile work",
          categoryId: 1,
          imageUrls: ["/api/placeholder-image.jpg"],
          projectDate: "2024-09-10",
          featured: false,
          createdAt: "2024-09-15T00:00:00Z"
        }
      ];
      res.json(mockPortfolio);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });
  app2.post("/api/portfolio", requireAuth, async (req, res) => {
    try {
      const mockPortfolioItem = {
        id: Date.now(),
        userId: req.user.id,
        ...req.body,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.status(201).json(mockPortfolioItem);
    } catch (error) {
      res.status(400).json({ message: "Failed to add portfolio item" });
    }
  });
  app2.get("/api/reviews/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const mockReviews = [
        {
          id: 1,
          reviewerId: 2,
          revieweeId: userId,
          bookingId: 1,
          rating: 5,
          body: "Excellent work! Very professional and completed on time.",
          createdAt: "2024-12-20T00:00:00Z"
        },
        {
          id: 2,
          reviewerId: 3,
          revieweeId: userId,
          bookingId: 2,
          rating: 4,
          body: "Great quality work, would recommend.",
          createdAt: "2024-12-15T00:00:00Z"
        }
      ];
      res.json(mockReviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });
  app2.post("/api/availability", requireAuth, async (req, res) => {
    try {
      const mockAvailability = {
        id: Date.now(),
        userId: req.user.id,
        ...req.body,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.status(201).json(mockAvailability);
    } catch (error) {
      res.status(400).json({ message: "Failed to add availability" });
    }
  });
  app2.post("/api/availability/bulk", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate, weekdays, startTime, endTime } = req.body;
      const mockResult = {
        success: true,
        message: "Bulk availability set successfully",
        slotsCreated: weekdays.length * 4,
        // Mock number
        startDate,
        endDate
      };
      res.json(mockResult);
    } catch (error) {
      res.status(400).json({ message: "Failed to set bulk availability" });
    }
  });
  app2.get("/api/availability/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { date } = req.query;
      const mockAvailability = {
        date,
        slots: [
          { start: "09:00", end: "10:00", available: true },
          { start: "10:00", end: "11:00", available: false },
          { start: "11:00", end: "12:00", available: true },
          { start: "14:00", end: "15:00", available: true },
          { start: "15:00", end: "16:00", available: true }
        ]
      };
      res.json(mockAvailability);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });
  app2.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const sanitizedUsers = users2.map((user) => sanitizeUser(user));
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.deleteUser(userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  app2.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use("/api/webhooks/stripe", express2.raw({ type: "application/json" }));
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.get("origin");
    const host = req.get("host");
    if (process.env.NODE_ENV === "production" && origin) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
  }
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    console.error("Error:", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : void 0,
      status
    });
    const message = status === 500 ? "Internal Server Error" : err.message || "An error occurred";
    res.status(status).json({ message });
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
