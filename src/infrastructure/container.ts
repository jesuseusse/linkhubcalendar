import { FirestoreTenantRegistryRepository } from './repositories/FirestoreTenantRegistryRepository';
import { FirestoreUserRepository } from './repositories/FirestoreUserRepository';
import { FirestoreAppointmentRepository } from './repositories/FirestoreAppointmentRepository';
import { FirestoreLeadRepository } from './repositories/FirestoreLeadRepository';
import { FirebaseStorageService } from './services/FirebaseStorageService';
import { FirebaseEmailVerificationService } from './services/FirebaseEmailVerificationService';
import { GetProfileUseCase } from '@/application/use-cases/GetProfileUseCase';
import { UpdateProfileUseCase } from '@/application/use-cases/UpdateProfileUseCase';
import { UploadPhotoUseCase } from '@/application/use-cases/UploadPhotoUseCase';
import { UpdateUsernameUseCase } from '@/application/use-cases/UpdateUsernameUseCase';
import { UpdateThemeUseCase } from '@/application/use-cases/UpdateThemeUseCase';
import { ToggleContactFormUseCase } from '@/application/use-cases/ToggleContactFormUseCase';
import { ToggleCalendarUseCase } from '@/application/use-cases/ToggleCalendarUseCase';
import {
  AddCalendarSlotUseCase,
  UpsertCalendarSlotsUseCase,
  DeleteCalendarSlotUseCase,
  ReleaseCalendarSlotUseCase,
  GetPublicCalendarUseCase,
} from '@/application/use-cases/ManageCalendarSlotsUseCase';
import { GetPublicProfileUseCase } from '@/application/use-cases/GetPublicProfileUseCase';
import {
  AddLinkUseCase,
  UpdateLinkUseCase,
  DeleteLinkUseCase,
} from '@/application/use-cases/ManageLinksUseCase';
import { GetAppointmentsUseCase } from '@/application/use-cases/GetAppointmentsUseCase';
import {
  CancelAppointmentUseCase,
  ConfirmAppointmentUseCase,
  RescheduleAppointmentUseCase,
} from '@/application/use-cases/ManageAppointmentsUseCase';
import { SubmitLeadUseCase } from '@/application/use-cases/SubmitLeadUseCase';
import { GetLeadsUseCase } from '@/application/use-cases/GetLeadsUseCase';
import { UpdateLeadStatusUseCase } from '@/application/use-cases/UpdateLeadStatusUseCase';
import { GetLeadsPaginatedUseCase } from '@/application/use-cases/GetLeadsPaginatedUseCase';

export const tenantRegistryRepo = new FirestoreTenantRegistryRepository();
export const userRepo = new FirestoreUserRepository();
export const appointmentRepo = new FirestoreAppointmentRepository();
export const leadRepo = new FirestoreLeadRepository();
const storageService = new FirebaseStorageService();
export const emailVerificationService = new FirebaseEmailVerificationService();

export const container = {
  tenantRegistryRepo,
  userRepo,
  getProfileUseCase: new GetProfileUseCase(userRepo, appointmentRepo),
  updateProfileUseCase: new UpdateProfileUseCase(userRepo),
  uploadPhotoUseCase: new UploadPhotoUseCase(userRepo, storageService),
  updateUsernameUseCase: new UpdateUsernameUseCase(userRepo),
  updateThemeUseCase: new UpdateThemeUseCase(userRepo),
  toggleContactFormUseCase: new ToggleContactFormUseCase(userRepo),
  toggleCalendarUseCase: new ToggleCalendarUseCase(userRepo),
  addCalendarSlotUseCase: new AddCalendarSlotUseCase(userRepo, appointmentRepo),
  upsertCalendarSlotsUseCase: new UpsertCalendarSlotsUseCase(userRepo, appointmentRepo),
  deleteCalendarSlotUseCase: new DeleteCalendarSlotUseCase(userRepo, appointmentRepo),
  releaseCalendarSlotUseCase: new ReleaseCalendarSlotUseCase(userRepo, appointmentRepo),
  getPublicCalendarUseCase: new GetPublicCalendarUseCase(userRepo, appointmentRepo),
  getPublicProfileUseCase: new GetPublicProfileUseCase(userRepo, appointmentRepo),
  addLinkUseCase: new AddLinkUseCase(userRepo),
  updateLinkUseCase: new UpdateLinkUseCase(userRepo),
  deleteLinkUseCase: new DeleteLinkUseCase(userRepo),
  getAppointmentsUseCase: new GetAppointmentsUseCase(appointmentRepo),
  cancelAppointmentUseCase: new CancelAppointmentUseCase(appointmentRepo),
  confirmAppointmentUseCase: new ConfirmAppointmentUseCase(appointmentRepo),
  rescheduleAppointmentUseCase: new RescheduleAppointmentUseCase(appointmentRepo),
  submitLeadUseCase: new SubmitLeadUseCase(userRepo, leadRepo),
  getLeadsUseCase: new GetLeadsUseCase(leadRepo),
  updateLeadStatusUseCase: new UpdateLeadStatusUseCase(leadRepo),
  getLeadsPaginatedUseCase: new GetLeadsPaginatedUseCase(leadRepo),
};
