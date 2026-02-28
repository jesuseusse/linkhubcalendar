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
import { BookAppointmentUseCase } from '@/application/use-cases/BookAppointmentUseCase';
import { GetAppointmentsUseCase } from '@/application/use-cases/GetAppointmentsUseCase';
import {
  DeleteAppointmentUseCase,
  ConfirmAppointmentUseCase,
  ReleaseAppointmentSlotUseCase,
} from '@/application/use-cases/ManageAppointmentsUseCase';
import { SubmitLeadUseCase } from '@/application/use-cases/SubmitLeadUseCase';
import { GetLeadsUseCase } from '@/application/use-cases/GetLeadsUseCase';

export const tenantRegistryRepo = new FirestoreTenantRegistryRepository();
export const userRepo = new FirestoreUserRepository();
const appointmentRepo = new FirestoreAppointmentRepository();
const leadRepo = new FirestoreLeadRepository();
const storageService = new FirebaseStorageService();
export const emailVerificationService = new FirebaseEmailVerificationService();

export const container = {
  tenantRegistryRepo,
  userRepo,
  getProfileUseCase: new GetProfileUseCase(userRepo),
  updateProfileUseCase: new UpdateProfileUseCase(userRepo),
  uploadPhotoUseCase: new UploadPhotoUseCase(userRepo, storageService),
  updateUsernameUseCase: new UpdateUsernameUseCase(userRepo),
  updateThemeUseCase: new UpdateThemeUseCase(userRepo),
  toggleContactFormUseCase: new ToggleContactFormUseCase(userRepo),
  toggleCalendarUseCase: new ToggleCalendarUseCase(userRepo),
  addCalendarSlotUseCase: new AddCalendarSlotUseCase(userRepo),
  deleteCalendarSlotUseCase: new DeleteCalendarSlotUseCase(userRepo),
  releaseCalendarSlotUseCase: new ReleaseCalendarSlotUseCase(userRepo),
  getPublicCalendarUseCase: new GetPublicCalendarUseCase(userRepo),
  getPublicProfileUseCase: new GetPublicProfileUseCase(userRepo),
  addLinkUseCase: new AddLinkUseCase(userRepo),
  updateLinkUseCase: new UpdateLinkUseCase(userRepo),
  deleteLinkUseCase: new DeleteLinkUseCase(userRepo),
  bookAppointmentUseCase: new BookAppointmentUseCase(userRepo, appointmentRepo),
  getAppointmentsUseCase: new GetAppointmentsUseCase(appointmentRepo),
  deleteAppointmentUseCase: new DeleteAppointmentUseCase(appointmentRepo, userRepo),
  confirmAppointmentUseCase: new ConfirmAppointmentUseCase(appointmentRepo),
  releaseAppointmentSlotUseCase: new ReleaseAppointmentSlotUseCase(appointmentRepo, userRepo),
  submitLeadUseCase: new SubmitLeadUseCase(userRepo, leadRepo),
  getLeadsUseCase: new GetLeadsUseCase(leadRepo),
};
