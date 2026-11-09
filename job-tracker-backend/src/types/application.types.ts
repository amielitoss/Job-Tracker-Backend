export const applicationStatuses = [
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
] as const;

export type ApplicationStatus =
typeof applicationStatuses[number];

export type ApplicationType = {
    id: number;
    company: string;
    role: string;
    status: ApplicationStatus;
};