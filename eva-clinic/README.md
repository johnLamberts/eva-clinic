# 🏗️ Modular Feature Architecture

## Core Principle
Each feature is **self-contained** with its own:
- API layer
- Components
- Hooks
- Types
- Store (if needed)
- Utils
- Constants
- Public API (index.ts)

---

## 📂 Complete Folder Structure

```
src/
├── app/                              # Application core
│   ├── App.tsx                       # Root component
│   ├── router.tsx                    # Router configuration
│   └── providers.tsx                 # All providers wrapper
│
├── components/                       # Shared/reusable components only
│   ├── ui/                          # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   └── ... (all shadcn components)
│   │
│   ├── layouts/                     # Layout wrappers
│   │   ├── dashboard-layout/
│   │   │   ├── index.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── footer.tsx
│   │   ├── auth-layout/
│   │   │   └── index.tsx
│   │   └── public-layout/
│   │       └── index.tsx
│   │
│   └── common/                      # Shared business components
│       ├── data-table/
│       │   ├── index.tsx
│       │   ├── pagination.tsx
│       │   ├── filters.tsx
│       │   └── columns.tsx
│       ├── form-field/
│       │   └── index.tsx
│       ├── page-header/
│       │   └── index.tsx
│       ├── search-bar/
│       │   └── index.tsx
│       └── empty-state/
│           └── index.tsx
│
├── features/                         # Feature modules (domain-driven)
│   │
│   ├── auth/                        # 🔐 Authentication Feature
│   │   ├── api/
│   │   │   ├── authApi.ts           # API calls
│   │   │   └── index.ts             # API exports
│   │   ├── components/
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   ├── forgot-password-form.tsx
│   │   │   ├── reset-password-form.tsx
│   │   │   ├── two-factor-dialog.tsx
│   │   │   ├── email-verification.tsx
│   │   │   └── index.ts             # Component exports
│   │   ├── hooks/
│   │   │   ├── useLogin.ts
│   │   │   ├── useRegister.ts
│   │   │   ├── useLogout.ts
│   │   │   ├── useForgotPassword.ts
│   │   │   ├── useResetPassword.ts
│   │   │   ├── use2FA.ts
│   │   │   ├── useAuth.ts           # Main auth hook
│   │   │   └── index.ts             # Hook exports
│   │   ├── stores/
│   │   │   ├── authStore.ts         # Zustand store
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── auth.types.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── token.utils.ts
│   │   │   ├── validation.utils.ts
│   │   │   └── index.ts
│   │   ├── constants/
│   │   │   ├── auth.constants.ts
│   │   │   └── index.ts
│   │   ├── routes/
│   │   │   ├── login.tsx            # Route component
│   │   │   ├── register.tsx
│   │   │   ├── forgot-password.tsx
│   │   │   ├── reset-password.tsx
│   │   │   └── index.ts
│   │   └── index.ts                 # Public API (only exports what's needed)
│   │
│   ├── patients/                    # 🏥 Patient Management Feature
│   │   ├── api/
│   │   │   ├── patientApi.ts
│   │   │   ├── medicalHistoryApi.ts
│   │   │   ├── dentalRecordApi.ts
│   │   │   └── index.ts
│   │   ├── components/
│   │   │   ├── patient-list.tsx
│   │   │   ├── patient-card.tsx
│   │   │   ├── patient-form.tsx
│   │   │   ├── patient-details.tsx
│   │   │   ├── medical-history-form.tsx
│   │   │   ├── dental-chart.tsx
│   │   │   ├── patient-search.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── usePatients.ts
│   │   │   ├── usePatient.ts
│   │   │   ├── useCreatePatient.ts
│   │   │   ├── useUpdatePatient.ts
│   │   │   ├── useDeletePatient.ts
│   │   │   ├── useMedicalHistory.ts
│   │   │   ├── useDentalRecords.ts
│   │   │   └── index.ts
│   │   ├── stores/
│   │   │   ├── patientStore.ts      # Local feature state
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── patient.types.ts
│   │   │   ├── medical-history.types.ts
│   │   │   ├── dental-record.types.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── patient.utils.ts
│   │   │   ├── validation.utils.ts
│   │   │   └── index.ts
│   │   ├── constants/
│   │   │   ├── patient.constants.ts
│   │   │   └── index.ts
│   │   ├── routes/
│   │   │   ├── patients-list.tsx
│   │   │   ├── patient-details.tsx
│   │   │   ├── patient-create.tsx
│   │   │   ├── patient-edit.tsx
│   │   │   └── index.ts
│   │   └── index.ts                 # Public API
│   │
│   ├── appointments/                # 📅 Appointment Scheduling Feature
│   │   ├── api/
│   │   │   ├── appointmentApi.ts
│   │   │   ├── scheduleApi.ts
│   │   │   ├── slotApi.ts
│   │   │   └── index.ts
│   │   ├── components/
│   │   │   ├── appointment-calendar.tsx
│   │   │   ├── appointment-list.tsx
│   │   │   ├── appointment-form.tsx
│   │   │   ├── appointment-card.tsx
│   │   │   ├── time-slot-picker.tsx
│   │   │   ├── appointment-filters.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useAppointments.ts
│   │   │   ├── useAppointment.ts
│   │   │   ├── useCreateAppointment.ts
│   │   │   ├── useUpdateAppointment.ts
│   │   │   ├── useCancelAppointment.ts
│   │   │   ├── useAvailableSlots.ts
│   │   │   └── index.ts
│   │   ├── stores/
│   │   │   ├── appointmentStore.ts
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── appointment.types.ts
│   │   │   ├── schedule.types.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── appointment.utils.ts
│   │   │   ├── calendar.utils.ts
│   │   │   └── index.ts
│   │   ├── constants/
│   │   │   ├── appointment.constants.ts
│   │   │   └── index.ts
│   │   ├── routes/
│   │   │   ├── appointments-calendar.tsx
│   │   │   ├── appointments-list.tsx
│   │   │   ├── appointment-create.tsx
│   │   │   ├── appointment-details.tsx
│   │   │   └── index.ts
│   │   └── index.ts                 # Public API
│   │
│   ├── users/                       # 👥 User Management Feature
│   │   ├── api/
│   │   │   ├── userApi.ts
│   │   │   ├── roleApi.ts
│   │   │   └── index.ts
│   │   ├── components/
│   │   │   ├── user-list.tsx
│   │   │   ├── user-card.tsx
│   │   │   ├── user-form.tsx
│   │   │   ├── user-profile.tsx
│   │   │   ├── role-badge.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useUsers.ts
│   │   │   ├── useUser.ts
│   │   │   ├── useCreateUser.ts
│   │   │   ├── useUpdateUser.ts
│   │   │   ├── useDeleteUser.ts
│   │   │   ├── useRoles.ts
│   │   │   └── index.ts
│   │   ├── stores/
│   │   │   ├── userStore.ts
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── user.types.ts
│   │   │   ├── role.types.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── user.utils.ts
│   │   │   └── index.ts
│   │   ├── constants/
│   │   │   ├── user.constants.ts
│   │   │   └── index.ts
│   │   ├── routes/
│   │   │   ├── users-list.tsx
│   │   │   ├── user-profile.tsx
│   │   │   ├── user-create.tsx
│   │   │   └── index.ts
│   │   └── index.ts                 # Public API
│   │
│   └── dashboard/                   # 📊 Dashboard Feature
│       ├── api/
│       │   ├── analyticsApi.ts
│       │   └── index.ts
│       ├── components/
│       │   ├── dashboard-overview.tsx
│       │   ├── stats-card.tsx
│       │   ├── recent-appointments.tsx
│       │   ├── revenue-chart.tsx
│       │   ├── patient-growth-chart.tsx
│       │   └── index.ts
│       ├── hooks/
│       │   ├── useDashboardStats.ts
│       │   ├── useRecentAppointments.ts
│       │   └── index.ts
│       ├── types/
│       │   ├── analytics.types.ts
│       │   └── index.ts
│       ├── routes/
│       │   ├── dashboard-home.tsx
│       │   └── index.ts
│       └── index.ts                 # Public API
│
├── lib/                             # Core utilities (framework-level)
│   ├── axios.ts
│   ├── query-client.ts
│   ├── router.ts
│   └── utils.ts
│
├── hooks/                           # Global/shared hooks
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   ├── useMediaQuery.ts
│   ├── usePermissions.ts
│   └── index.ts
│
├── stores/                          # Global stores only
│   ├── themeStore.ts
│   ├── uiStore.ts
│   └── index.ts
│
├── types/                           # Global types only
│   ├── api.types.ts
│   ├── common.types.ts
│   └── index.ts
│
├── config/                          # Global configuration
│   ├── env.ts
│   ├── constants.ts
│   └── routes.ts
│
└── assets/                          # Static assets
    ├── images/
    ├── icons/
    └── fonts/
```

---

## 🎯 Key Principles

### 1. **Self-Contained Features**
Each feature has EVERYTHING it needs:
```typescript
// ❌ Bad - reaching outside feature
import { formatDate } from '@/utils/date';

// ✅ Good - use feature's own utils
import { formatDate } from '../utils';
```

### 2. **Public API Pattern**
Each feature exports only what's needed via `index.ts`:

```typescript
// features/patients/index.ts
export { PatientList, PatientForm } from './components';
export { usePatients, usePatient } from './hooks';
export type { Patient, PatientFilters } from './types';

// ❌ Don't export internal stuff
// export { validatePatientForm } from './utils';
```

### 3. **Feature Independence**
Features should NOT import from each other directly:

```typescript
// ❌ Bad
import { PatientCard } from '@/features/patients/components/patient-card';

// ✅ Good
import { PatientCard } from '@/features/patients';
```

### 4. **Shared Components**
Only truly reusable components go in `components/`:
- UI primitives (shadcn)
- Layout wrappers
- Common business components (DataTable, SearchBar)

Feature-specific components stay in the feature.

---

## 📦 Feature Structure Template

Every feature follows this exact structure:

```
features/[feature-name]/
├── api/                    # API layer
│   ├── [feature]Api.ts    # Main API calls
│   └── index.ts           # Export all APIs
│
├── components/             # Feature components
│   ├── [component].tsx
│   └── index.ts           # Export public components
│
├── hooks/                  # React Query hooks
│   ├── use[Feature]s.ts   # List hook
│   ├── use[Feature].ts    # Single hook
│   ├── useCreate[Feature].ts
│   ├── useUpdate[Feature].ts
│   ├── useDelete[Feature].ts
│   └── index.ts           # Export all hooks
│
├── stores/                 # Feature state (optional)
│   ├── [feature]Store.ts
│   └── index.ts
│
├── types/                  # TypeScript types
│   ├── [feature].types.ts
│   └── index.ts           # Export all types
│
├── utils/                  # Feature utilities
│   ├── [feature].utils.ts
│   └── index.ts           # Export public utils
│
├── constants/              # Feature constants
│   ├── [feature].constants.ts
│   └── index.ts
│
├── routes/                 # Route components
│   ├── [route].tsx
│   └── index.ts
│
└── index.ts               # PUBLIC API - only export what's needed
```

---

## 🔥 Benefits of This Structure

### ✅ **Scalability**
- Add new features without touching existing ones
- Features can grow independently
- Easy to understand boundaries

### ✅ **Maintainability**
- Find everything related to a feature in one place
- Clear ownership of code
- Easy to refactor

### ✅ **Testability**
- Test features in isolation
- Mock dependencies easily
- Clear test boundaries

### ✅ **Team Collaboration**
- Multiple developers can work on different features
- Reduced merge conflicts
- Clear code ownership

### ✅ **Code Reusability**
- Extract features as packages
- Share features between projects
- Clear public APIs

---

## 📝 Example: Public API Pattern

```typescript
// features/patients/index.ts
// This is the ONLY file other modules should import from

// Components (only public ones)
export { PatientList } from './components/patient-list';
export { PatientForm } from './components/patient-form';
export { PatientCard } from './components/patient-card';

// Hooks (all query hooks)
export { usePatients } from './hooks/usePatients';
export { usePatient } from './hooks/usePatient';
export { useCreatePatient } from './hooks/useCreatePatient';
export { useUpdatePatient } from './hooks/useUpdatePatient';
export { useDeletePatient } from './hooks/useDeletePatient';

// Types (public types only)
export type { 
  Patient, 
  PatientFilters, 
  PatientFormData 
} from './types';

// Routes
export { default as PatientsRoutes } from './routes';

// DO NOT export:
// - Internal components
// - Private utilities
// - API functions (hooks abstract these)
// - Store (accessed via hooks)
```

---

## 🎯 Usage Examples

### Importing from Features

```typescript
// ✅ Correct way
import { 
  PatientList, 
  usePatients, 
  type Patient 
} from '@/features/patients';

// ❌ Wrong way - don't go deep
import { PatientList } from '@/features/patients/components/patient-list';
```

### Creating New Features

```bash
# Use this template for every new feature
mkdir -p src/features/new-feature/{api,components,hooks,stores,types,utils,constants,routes}
touch src/features/new-feature/index.ts
```

---

## 🚀 Ready to Build?

This structure is **production-ready** and used by:
- Large enterprise applications
- SaaS platforms
- Multi-tenant systems
- Open source projects

Choose what you want to build first:
1. **Auth Feature** - Complete authentication system
2. **Patients Feature** - Patient management
3. **Appointments Feature** - Scheduling system
4. **All features** - Let's build everything!
