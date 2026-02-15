export interface LinkDto {
  id: string;
  title: string;
  url: string;
}

export interface CreateLinkDto {
  title: string;
  url: string;
}

export interface UpdateLinkDto {
  title: string;
  url: string;
}
