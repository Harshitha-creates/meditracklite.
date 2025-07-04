import { pgTable, text, timestamp, varchar, boolean, integer } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Appointments table
export const appointments = pgTable('appointments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  patientId: text('patient_id').notNull().references(() => users.id),
  doctorId: text('doctor_id').notNull().references(() => users.id),
  appointmentDate: timestamp('appointment_date').notNull(),
  appointmentTime: varchar('appointment_time', { length: 10 }).notNull(),
  healthConcern: text('health_concern').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('Pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Prescriptions table
export const prescriptions = pgTable('prescriptions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  appointmentId: text('appointment_id').notNull().references(() => appointments.id),
  patientId: text('patient_id').notNull().references(() => users.id),
  doctorId: text('doctor_id').notNull().references(() => users.id),
  medicineName: varchar('medicine_name', { length: 100 }).notNull(),
  dosage: varchar('dosage', { length: 100 }).notNull(),
  frequency: varchar('frequency', { length: 100 }).notNull(),
  duration: varchar('duration', { length: 100 }),
  instructions: text('instructions'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Feedback table
export const feedback = pgTable('feedback', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  appointmentId: text('appointment_id').notNull().references(() => appointments.id),
  patientId: text('patient_id').notNull().references(() => users.id),
  doctorId: text('doctor_id').notNull().references(() => users.id),
  rating: integer('rating').notNull(),
  comments: text('comments'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;

export type Prescription = typeof prescriptions.$inferSelect;
export type NewPrescription = typeof prescriptions.$inferInsert;

export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;