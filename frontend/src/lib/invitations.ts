export type InvitationStatus = "pending" | "accepted" | "declined" | "expired";

export interface Invitation {
  id: string;
  organization_id: string;
  sender_user_id: string;
  recipient_email: string;
  role: string;
  token: string;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface InvitationCreate {
  recipient_email: string;
  role: string;
}
