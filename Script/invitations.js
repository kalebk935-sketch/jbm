export async function loadInvitations() {
  const response = await fetch('../Script/data/invitations.json');
  if (!response.ok) {
    throw new Error(`Impossible de charger les invitations (${response.status}).`);
  }
  const data = await response.json();
  return Array.isArray(data.invitations) ? data.invitations : [];
}

export function getInvitationById(invitations, id) {
  return invitations.find((invitation) => invitation.id === id);
}