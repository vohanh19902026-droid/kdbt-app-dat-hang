import {
  boolean, date, decimal, index, integer, pgEnum, pgSequence, pgTable, text, timestamp,
  uniqueIndex, uuid, jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const appRoleEnum = pgEnum("app_role", ["ADMIN", "PLANNER", "SALES", "ACCOUNTANT", "TECHNICAL"]);
export const orderStatusEnum = pgEnum("order_status", ["PENDING", "APPROVED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
export const receivableEntryTypeEnum = pgEnum("receivable_entry_type", ["CHARGE", "PAYMENT"]);
export const bookingNumberSeq = pgSequence("booking_number_seq", { startWith: 7431 });

// Better Auth tables; appRole is separate from its internal account-management role.
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  role: text("role").default("user"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { withTimezone: true }),
  appRole: appRoleEnum("app_role").default("SALES").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isPlatformOwner: boolean("is_platform_owner").default(false).notNull(),
  employeeCode: text("employee_code"),
  phone: text("phone"),
  department: text("department"),
  jobTitle: text("job_title"),
  age: integer("age"),
  requestedAppRole: appRoleEnum("requested_app_role"),
  monthlyTargetM3: decimal("monthly_target_m3", { precision: 10, scale: 2 }),
  notificationPreferences: jsonb("notification_preferences").$type<Record<string, unknown>>().notNull().default({}),
}, (table) => [uniqueIndex("user_single_platform_owner_idx").on(table.isPlatformOwner).where(sql`${table.isPlatformOwner} = true`)]);

export const appSettings = pgTable("app_settings", {
  id: text("id").primaryKey().default("default"),
  values: jsonb("settings_json").$type<Record<string, unknown>>().notNull(),
  updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
}, (t) => [index("session_user_id_idx").on(t.userId)]);

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("account_user_id_idx").on(t.userId)]);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  defaultAddress: text("default_address"),
  salesRepId: text("sales_rep_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
}, (t) => [index("customers_name_idx").on(t.name), index("customers_sales_rep_idx").on(t.salesRepId)]);

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingNo: text("booking_no").notNull().default(sql`'BOOK-' || nextval('booking_number_seq')::text`),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  customerName: text("customer_name").notNull(),
  salesRepName: text("sales_rep_name").notNull(),
  siteAddress: text("site_address").notNull(),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull(),
  plannedStartAt: timestamp("planned_start_at", { withTimezone: true }),
  plannedEndAt: timestamp("planned_end_at", { withTimezone: true }),
  quantityM3: decimal("quantity_m3", { precision: 10, scale: 2 }).notNull(),
  actualM3: decimal("actual_m3", { precision: 10, scale: 2 }).default("0").notNull(),
  grade: text("grade").notNull(),
  sandType: text("sand_type").notNull(),
  stoneType: text("stone_type").notNull(),
  pumpRequired: text("pump_required").notNull(),
  pumpOperator: text("pump_operator"),
  assignedVehicle: text("assigned_vehicle"),
  truckCapacityM3: decimal("truck_capacity_m3", { precision: 5, scale: 2 }),
  pourType: text("pour_type"),
  pourMethod: text("pour_method"),
  siteCategory: text("site_category"),
  salesNote: text("sales_note"),
  planningNote: text("planning_note"),
  status: orderStatusEnum("status").default("PENDING").notNull(),
  createdBy: text("created_by").notNull().references(() => user.id),
  approvedBy: text("approved_by").references(() => user.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  version: decimal("version", { precision: 10, scale: 0 }).default("0").notNull(),
}, (t) => [
  index("orders_requested_at_idx").on(t.requestedAt),
  index("orders_status_requested_idx").on(t.status, t.requestedAt),
  index("orders_creator_created_idx").on(t.createdBy, t.createdAt),
  index("orders_planning_basis_idx").on(sql`COALESCE(${t.plannedStartAt}, ${t.requestedAt})`),
  uniqueIndex("orders_booking_no_idx").on(t.bookingNo),
]);

export const orderEvents = pgTable("order_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  actorUserId: text("actor_user_id").notNull().references(() => user.id),
  eventType: text("event_type").notNull(),
  fieldName: text("field_name"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("order_events_order_created_idx").on(t.orderId, t.createdAt)]);

export const appNotifications = pgTable("app_notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipientUserId: text("recipient_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  orderEventId: uuid("order_event_id").references(() => orderEvents.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
}, (t) => [
  index("app_notifications_recipient_created_idx").on(t.recipientUserId, t.createdAt),
  index("app_notifications_recipient_unread_idx").on(t.recipientUserId, t.readAt),
]);

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("push_subscriptions_user_endpoint_idx").on(t.userId, t.endpoint), index("push_subscriptions_user_idx").on(t.userId)]);

// Append-only customer receivable ledger. Amounts are integer Vietnamese dong;
// corrections should be recorded as a compensating entry, never edited away.
export const receivableEntries = pgTable("receivable_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "restrict" }),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
  entryType: receivableEntryTypeEnum("entry_type").notNull(),
  amountVnd: decimal("amount_vnd", { precision: 15, scale: 0 }).notNull(),
  referenceNo: text("reference_no"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  note: text("note"),
  createdBy: text("created_by").notNull().references(() => user.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("receivable_entries_customer_date_idx").on(t.customerId, t.occurredAt),
  index("receivable_entries_date_idx").on(t.occurredAt),
  index("receivable_entries_order_idx").on(t.orderId),
]);

export const materials = pgTable("materials", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: text("kind").notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
}, (t) => [uniqueIndex("materials_kind_code_idx").on(t.kind, t.code)]);

// Lightweight, per-user page telemetry. No IP address, query string or page content is stored.
export const usageEvents = pgTable("usage_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  route: text("route").notNull(),
  transferBytes: decimal("transfer_bytes", { precision: 14, scale: 0 }).default("0").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("usage_events_created_idx").on(t.createdAt), index("usage_events_user_created_idx").on(t.userId, t.createdAt)]);

export const adminAuditEvents = pgTable("admin_audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorUserId: text("actor_user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
  eventType: text("event_type").notNull(),
  entityType: text("entity_type").notNull(),
  entityKey: text("entity_key").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("admin_audit_events_created_idx").on(t.createdAt), index("admin_audit_events_actor_created_idx").on(t.actorUserId, t.createdAt)]);

// Legacy KDBT workbooks are retained as review-only snapshots. They are never
// converted into the operational receivable ledger without an explicit review.
export const legacyImportBatches = pgTable("legacy_import_batches", {
  id: uuid("id").defaultRandom().primaryKey(),
  manifestSha256: text("manifest_sha256").notNull().unique(),
  periodFrom: date("period_from", { mode: "string" }).notNull(),
  periodTo: date("period_to", { mode: "string" }).notNull(),
  sourceWorkbookCount: integer("source_workbook_count").notNull(),
  mappingVersion: text("mapping_version").notNull(),
  status: text("status").notNull().default("PENDING_HUMAN_REVIEW"),
  sourceObservationCount: integer("source_observation_count").notNull().default(0),
  importedBy: text("imported_by").references(() => user.id, { onDelete: "set null" }),
  importedAt: timestamp("imported_at", { withTimezone: true }).defaultNow().notNull(),
});

export const legacySalesRoster = pgTable("legacy_sales_roster", {
  id: text("id").primaryKey(),
  segment: text("segment").notNull(),
  displayName: text("display_name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  observedMonths: integer("observed_months").notNull().default(0),
  reviewStatus: text("review_status").notNull().default("NEEDS_EMPLOYER_CONFIRMATION"),
  mappedUserId: text("mapped_user_id").references(() => user.id, { onDelete: "set null" }),
  reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("legacy_sales_roster_segment_name_idx").on(t.segment, t.normalizedName),
  index("legacy_sales_roster_user_idx").on(t.mappedUserId),
]);

export const legacySalesRosterEvidence = pgTable("legacy_sales_roster_evidence", {
  id: uuid("id").defaultRandom().primaryKey(),
  rosterId: text("roster_id").notNull().references(() => legacySalesRoster.id, { onDelete: "cascade" }),
  reportMonth: integer("report_month").notNull(),
  sourceFile: text("source_file").notNull(),
  sourceSha256: text("source_sha256").notNull(),
  sourceSheet: text("source_sheet").notNull(),
  sourceCell: text("source_cell").notNull(),
  sourceName: text("source_name").notNull(),
  fillColorType: text("fill_color_type").notNull(),
  fillColor: text("fill_color").notNull(),
  classification: text("classification").notNull().default("SALES_NAME"),
}, (t) => [
  uniqueIndex("legacy_sales_roster_evidence_source_idx").on(t.sourceSha256, t.sourceSheet, t.sourceCell),
  index("legacy_sales_roster_evidence_roster_idx").on(t.rosterId, t.reportMonth),
]);

export const legacyCustomerEntities = pgTable("legacy_customer_entities", {
  entityKey: text("entity_key").primaryKey(),
  segment: text("segment").notNull(),
  identityKeyQuality: text("identity_key_quality").notNull(),
  reviewStatus: text("review_status").notNull().default("PENDING_HUMAN_REVIEW"),
  linkedCustomerId: uuid("linked_customer_id").references(() => customers.id, { onDelete: "set null" }),
  reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("legacy_customer_entities_link_idx").on(t.linkedCustomerId)]);

export const legacyDebtObservations = pgTable("legacy_debt_observations", {
  observationId: text("observation_id").primaryKey(),
  batchId: uuid("batch_id").notNull().references(() => legacyImportBatches.id, { onDelete: "restrict" }),
  entityKey: text("entity_key").notNull().references(() => legacyCustomerEntities.entityKey, { onDelete: "restrict" }),
  segment: text("segment").notNull(),
  reportMonth: date("report_month", { mode: "string" }).notNull(),
  sourceFile: text("source_file").notNull(),
  sourceSha256: text("source_sha256").notNull(),
  sourceSheet: text("source_sheet").notNull(),
  sourceRow: integer("source_row").notNull(),
  sourceRange: text("source_range"),
  sourceName: text("source_name").notNull(),
  sourceProjectName: text("source_project_name"),
  sourceAddress: text("source_address"),
  sourcePhone: text("source_phone"),
  sourceCustomerCode: text("source_customer_code"),
  sourceSalesCode: text("source_sales_code"),
  sourceSalesperson: text("source_salesperson"),
  rosterId: text("roster_id").references(() => legacySalesRoster.id, { onDelete: "set null" }),
  openingRaw: text("opening_raw"),
  openingValue: decimal("opening_value", { precision: 20, scale: 3 }),
  revenueRaw: text("revenue_raw"),
  revenueValue: decimal("revenue_value", { precision: 20, scale: 3 }),
  receiptsRaw: text("receipts_raw"),
  receiptsValue: decimal("receipts_value", { precision: 20, scale: 3 }),
  closingRaw: text("closing_raw"),
  closingValue: decimal("closing_value", { precision: 20, scale: 3 }),
  openingCell: text("opening_cell"),
  revenueCell: text("revenue_cell"),
  receiptsCell: text("receipts_cell"),
  closingCell: text("closing_cell"),
  residual: decimal("residual", { precision: 20, scale: 3 }),
  reconciliationStatus: text("reconciliation_status").notNull().default("UNREVIEWED"),
  unitStatus: text("unit_status").notNull().default("UNCONFIRMED_SOURCE_UNIT"),
  identityKeyQuality: text("identity_key_quality").notNull(),
  reviewStatus: text("review_status").notNull().default("PENDING_HUMAN_REVIEW"),
  mappingVersion: text("mapping_version").notNull(),
  importedAt: timestamp("imported_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("legacy_debt_observations_source_idx").on(t.sourceSha256, t.sourceSheet, t.sourceRow, t.mappingVersion),
  index("legacy_debt_observations_month_idx").on(t.reportMonth, t.segment),
  index("legacy_debt_observations_entity_idx").on(t.entityKey, t.reportMonth),
  index("legacy_debt_observations_roster_idx").on(t.rosterId, t.reportMonth),
  index("legacy_debt_observations_source_name_idx").on(sql`lower(${t.sourceName}) text_pattern_ops`),
]);

export const legacyDebtReviewEvents = pgTable("legacy_debt_review_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  observationId: text("observation_id").notNull().references(() => legacyDebtObservations.observationId, { onDelete: "restrict" }),
  actorUserId: text("actor_user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
  decision: text("decision").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("legacy_debt_review_events_observation_idx").on(t.observationId, t.createdAt)]);
