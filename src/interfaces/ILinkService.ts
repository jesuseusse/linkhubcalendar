import { UserDto } from '../dtos/user.dto';
import { CreateLinkDto, UpdateLinkDto } from '../dtos/link.dto';

export interface ILinkService {
  addLink(token: string, dto: CreateLinkDto): Promise<UserDto>;
  updateLink(token: string, linkId: string, dto: UpdateLinkDto): Promise<UserDto>;
  deleteLink(token: string, linkId: string): Promise<UserDto>;
}
