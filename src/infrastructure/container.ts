import { FirestoreTenantRegistryRepository } from './repositories/FirestoreTenantRegistryRepository';
import { FirestoreUserRepository } from './repositories/FirestoreUserRepository';
import { FirestoreAppointmentRepository } from './repositories/FirestoreAppointmentRepository';
import { FirestoreLeadRepository } from './repositories/FirestoreLeadRepository';
import { FirestoreSupportTicketRepository } from './repositories/FirestoreSupportTicketRepository';
import { FirestoreCampaignRepository } from './repositories/FirestoreCampaignRepository';
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
import {
  CreateSupportTicketUseCase,
  GetSupportTicketsUseCase,
  GetTicketDetailUseCase,
  UpdateTicketStatusUseCase,
  AddCommentUseCase,
} from '@/application/use-cases/ManageSupportTicketsUseCase';
import {
  GetSuperAdminStatsUseCase,
  GetAllUsersUseCase,
  GetAllTicketsUseCase,
  GetUsersPaginatedUseCase,
} from '@/application/use-cases/SuperAdminUseCases';
import {
  GetCampaignsPaginatedUseCase,
  GetCampaignDetailUseCase,
} from '@/application/use-cases/CampaignUseCases';
import {
  UploadGalleryPhotoUseCase,
  DeleteGalleryPhotoUseCase,
  ReorderGalleryPhotosUseCase,
  ToggleGalleryUseCase,
} from '@/application/use-cases/ManageGalleryUseCase';

export const tenantRegistryRepo = new FirestoreTenantRegistryRepository();
export const userRepo = new FirestoreUserRepository();
export const appointmentRepo = new FirestoreAppointmentRepository();
export const leadRepo = new FirestoreLeadRepository();
export const supportTicketRepo = new FirestoreSupportTicketRepository();
export const campaignRepo = new FirestoreCampaignRepository();
const storageService = new FirebaseStorageService();
export const emailVerificationService = new FirebaseEmailVerificationService();

export const container = {
  tenantRegistryRepo,
  userRepo,
  appointmentRepo,
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
  // Support tickets — email deps are injected ad-hoc per request in the API route
  supportTicketRepo,
  createSupportTicketUseCase: new CreateSupportTicketUseCase(supportTicketRepo),
  getSupportTicketsUseCase: new GetSupportTicketsUseCase(supportTicketRepo),
  getTicketDetailUseCase: new GetTicketDetailUseCase(supportTicketRepo),
  updateTicketStatusUseCase: new UpdateTicketStatusUseCase(supportTicketRepo),
  addCommentUseCase: new AddCommentUseCase(supportTicketRepo),
  // Gallery
  uploadGalleryPhotoUseCase: new UploadGalleryPhotoUseCase(userRepo, storageService),
  deleteGalleryPhotoUseCase: new DeleteGalleryPhotoUseCase(userRepo, storageService),
  reorderGalleryPhotosUseCase: new ReorderGalleryPhotosUseCase(userRepo),
  toggleGalleryUseCase: new ToggleGalleryUseCase(userRepo),
  // Super admin
  getSuperAdminStatsUseCase: new GetSuperAdminStatsUseCase(userRepo),
  getAllUsersUseCase: new GetAllUsersUseCase(userRepo),
  getAllTicketsUseCase: new GetAllTicketsUseCase(userRepo, supportTicketRepo),
  getUsersPaginatedUseCase: new GetUsersPaginatedUseCase(userRepo),
  // Campaigns — SendCampaignUseCase is constructed ad-hoc in the API route (needs tenant email config)
  campaignRepo,
  getCampaignsPaginatedUseCase: new GetCampaignsPaginatedUseCase(campaignRepo),
  getCampaignDetailUseCase: new GetCampaignDetailUseCase(campaignRepo),
};
